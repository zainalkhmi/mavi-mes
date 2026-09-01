/**
 * n8nEngineBridge.js
 * =========================================================================
 * Bi-directional Bridge & Converter between Mandor MES Workflow Canvas
 * and the official n8n Workflow Engine (v1 JSON Specification & REST API)
 * =========================================================================
 */

/**
 * Convert ReactFlow Canvas Nodes & Edges to Official n8n Workflow JSON Format
 */
export function convertCanvasToN8NJson(nodes, edges, workflowName = 'MES Workflow') {
  const n8nNodes = nodes.map(node => {
    let n8nType = 'n8n-nodes-base.httpRequest';
    let typeVersion = 1;

    if (node.type === 'n8n_trigger') {
      n8nType = node.data?.type === 'schedule' ? 'n8n-nodes-base.scheduleTrigger' : 'n8n-nodes-base.webhook';
      typeVersion = 2;
    } else if (node.type === 'n8n_agent') {
      n8nType = '@n8n/n8n-nodes-langchain.agent';
      typeVersion = 1.6;
    } else if (node.type === 'n8n_subnode') {
      if (node.data?.subType === 'model') n8nType = '@n8n/n8n-nodes-langchain.lmChatAnthropic';
      else if (node.data?.subType === 'memory') n8nType = '@n8n/n8n-nodes-langchain.memoryPostgresChat';
      else if (node.data?.subType === 'microsoft') n8nType = 'n8n-nodes-base.microsoftEntra';
      else if (node.data?.subType === 'jira') n8nType = 'n8n-nodes-base.jira';
      else n8nType = 'n8n-nodes-base.postgres';
    } else if (node.type === 'n8n_decision') {
      n8nType = 'n8n-nodes-base.if';
      typeVersion = 2;
    } else if (node.type === 'n8n_action') {
      if (node.data?.app === 'slack') n8nType = 'n8n-nodes-base.slack';
      else if (node.data?.app === 'sheets') n8nType = 'n8n-nodes-base.googleSheets';
      else if (node.data?.app === 'telegram') n8nType = 'n8n-nodes-base.telegram';
      else n8nType = 'n8n-nodes-base.code';
    }

    return {
      id: node.id,
      name: node.data?.label || node.id,
      type: n8nType,
      typeVersion,
      position: [Math.round(node.position?.x || 0), Math.round(node.position?.y || 0)],
      parameters: node.data?.parameters || {}
    };
  });

  // Build n8n Connections Map
  const connections = {};
  const nodeMap = new Map(nodes.map(n => [n.id, n.data?.label || n.id]));

  edges.forEach(edge => {
    const sourceName = nodeMap.get(edge.source) || edge.source;
    const targetName = nodeMap.get(edge.target) || edge.target;

    if (!connections[sourceName]) {
      connections[sourceName] = { main: [[]] };
    }

    const outputIndex = edge.sourceHandle === 'false' ? 1 : 0;
    while (connections[sourceName].main.length <= outputIndex) {
      connections[sourceName].main.push([]);
    }

    connections[sourceName].main[outputIndex].push({
      node: targetName,
      type: 'main',
      index: 0
    });
  });

  return {
    name: workflowName,
    nodes: n8nNodes,
    connections,
    active: true,
    settings: {
      executionOrder: 'v1',
      saveManualExecutions: true,
      callerPolicy: 'workflowsFromSameOwner'
    },
    versionId: `mes-${Date.now()}`
  };
}

/**
 * Convert Official n8n Workflow JSON to ReactFlow Canvas Nodes & Edges
 */
export function convertN8NJsonToCanvas(n8nJson) {
  if (!n8nJson || !Array.isArray(n8nJson.nodes)) {
    throw new Error('Format JSON n8n tidak valid: nodes tidak ditemukan.');
  }

  const nodes = n8nJson.nodes.map((n, idx) => {
    let type = 'n8n_action';
    let app = undefined;
    let subType = undefined;
    let portLabel = undefined;

    const lowerType = (n.type || '').toLowerCase();

    if (lowerType.includes('trigger') || lowerType.includes('webhook')) {
      type = 'n8n_trigger';
    } else if (lowerType.includes('agent')) {
      type = 'n8n_agent';
    } else if (lowerType.includes('anthropic') || lowerType.includes('openai') || lowerType.includes('lmchat')) {
      type = 'n8n_subnode';
      subType = 'model';
      portLabel = 'Model';
    } else if (lowerType.includes('memory')) {
      type = 'n8n_subnode';
      subType = 'memory';
      portLabel = 'Memory';
    } else if (lowerType.includes('if') || lowerType.includes('decision') || lowerType.includes('switch')) {
      type = 'n8n_decision';
    } else if (lowerType.includes('slack')) {
      type = 'n8n_action';
      app = 'slack';
    } else if (lowerType.includes('googlesheets') || lowerType.includes('sheet')) {
      type = 'n8n_action';
      app = 'sheets';
    } else if (lowerType.includes('telegram')) {
      type = 'n8n_action';
      app = 'telegram';
    }

    const pos = Array.isArray(n.position) ? n.position : [idx * 160, 150];

    return {
      id: n.id || `node-${idx}-${Date.now()}`,
      type,
      position: { x: pos[0], y: pos[1] },
      data: {
        label: n.name || `Node ${idx + 1}`,
        subtitle: n.type?.split('.').pop() || '',
        subType,
        portLabel,
        app,
        parameters: n.parameters || {}
      }
    };
  });

  // Build Edges from connections map
  const edges = [];
  const nameToId = new Map(nodes.map(n => [n.data.label, n.id]));

  if (n8nJson.connections && typeof n8nJson.connections === 'object') {
    Object.entries(n8nJson.connections).forEach(([sourceName, connGroup]) => {
      const sourceId = nameToId.get(sourceName) || sourceName;
      const mainOutputs = connGroup.main || [];

      mainOutputs.forEach((outputList, outIdx) => {
        (outputList || []).forEach((conn, edgeIdx) => {
          const targetId = nameToId.get(conn.node) || conn.node;
          const isFalseBranch = outIdx === 1;

          edges.push({
            id: `edge-${sourceId}-${targetId}-${outIdx}-${edgeIdx}`,
            source: sourceId,
            target: targetId,
            sourceHandle: isFalseBranch ? 'false' : (outIdx === 0 ? 'true' : undefined),
            type: 'smoothstep',
            label: isFalseBranch ? 'false' : (mainOutputs.length > 1 ? 'true' : undefined),
            labelStyle: { fill: '#94a3b8', fontSize: 11, fontWeight: 600 },
            labelBgStyle: { fill: '#111116', fillOpacity: 0.8 },
            style: { stroke: '#8b8b99', strokeWidth: 2 }
          });
        });
      });
    });
  }

  return { nodes, edges, name: n8nJson.name || 'Imported n8n Workflow' };
}

/**
 * Trigger Workflow Execution on n8n Server Engine
 */
export async function executeWorkflowOnN8NServer(n8nUrl, webhookPath = 'webhook/mes-qc-alert', payload = {}) {
  const url = `${n8nUrl.replace(/\/$/, '')}/${webhookPath.replace(/^\//, '')}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MES-Source': 'Mandor-MES-Automation-Engine'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Server n8n mengembalikan status ${response.status}: ${response.statusText}`);
  }

  return await response.json().catch(() => ({ status: 'success', message: 'Webhook triggered successfully' }));
}
