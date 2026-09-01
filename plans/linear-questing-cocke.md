# MAVI MES Automation Engine Enhancement Plan

## Context

**Problem:** User wants to add a "Custom Automation Engine" similar to n8n as a menu in MAVI MES application.

**Discovery:** MAVI already has an automation engine (`AutomationEngine.js`, `AutomationEditor.jsx`) with ReactFlow visual editor, 20+ node types, loops, sub-workflows, and AI integration. However, it needs enhancement to fully meet requirements.

**Requirements:**
1. Integrate external services (Telegram, Email, Google Sheets, Slack, dll)
2. Logic: If-else, Loops, parallel execution, Sub-workflow
3. Timeline: 2-4 months
4. Menu "Automation" access

**Outcome:** Enhance existing MAVI automation engine with new connectors, better execution monitoring, and enterprise features.

---

## Phase 1: MVP Enhancement (Month 1)

### 1.1 Database Schema (Supabase)

Create 4 new tables with RLS policies:

```sql
-- automations: workflow definitions
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  graph_data JSONB NOT NULL,  -- ReactFlow nodes/edges
  trigger_config JSONB,
  is_active BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- automation_runs: execution history
CREATE TABLE automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES automations(id),
  status TEXT DEFAULT 'running',  -- running, completed, failed, cancelled
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  trigger_event JSONB,
  variables JSONB DEFAULT '{}',
  error_message TEXT
);

-- automation_run_steps: step-by-step log
CREATE TABLE automation_run_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES automation_runs(id),
  step_name TEXT,
  node_id TEXT,
  status TEXT,  -- pending, running, completed, failed
  input_data JSONB,
  output_data JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT
);

-- automation_credentials: secure storage
CREATE TABLE automation_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- telegram, slack, google_sheets, smtp
  encrypted_config JSONB,  -- encrypted via Supabase Vault
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.2 Core Engine Refactor

**File:** `src/utils/automationEngine.js` → create `src/utils/automationDB.js`

New module responsibilities:
- Load/save workflows from Supabase
- Async execution with proper error handling
- Step-by-step execution logging
- Run state management (pause/resume/cancel)

Key changes:
```javascript
// Convert to async/await pattern
async executeWorkflow(automationId, triggerEvent) {
  const automation = await automationDB.getById(automationId);
  const run = await automationDB.createRun(automationId, triggerEvent);
  
  try {
    for (const node of executionOrder) {
      await automationDB.logStep(run.id, { node, status: 'running' });
      const result = await this.executeNode(node, context);
      await automationDB.logStep(run.id, { node, status: 'completed', output: result });
    }
  } catch (error) {
    await automationDB.updateRun(run.id, { status: 'failed', error: error.message });
  }
}
```

### 1.3 New Connectors (Phase 1)

| Connector | File | Implementation |
|-----------|------|----------------|
| **Telegram** | `src/utils/connectors/telegram.js` | Real Bot API with chat_id, parse_mode |
| **Slack** | `src/utils/connectors/slack.js` | Webhook or Bot Token API |
| **Google Sheets** | `src/utils/connectors/googleSheets.js` | Service Account + googleapis |
| **Email SMTP** | `src/utils/connectors/email.js` | Nodemailer with SMTP config |

### 1.4 Execution Controls

Add to `AutomationEditor.jsx`:
- **Pause** button: Store current execution state in localStorage
- **Resume** button: Continue from paused state
- **Cancel** button: Stop execution, mark as cancelled

---

## Phase 2: Advanced Features (Month 2)

### 2.1 Parallel Execution

**New Node Types:**
```
Fork Node — Splits execution into parallel branches
  └── Join Node — Waits for all branches, merges results
```

Engine changes:
```javascript
async executeNode(node, context) {
  if (node.type === 'fork') {
    const branches = this.getOutgoingEdges(node.id);
    const promises = branches.map(edge => 
      this.executeBranch(edge.target, context)
    );
    return Promise.all(promises);
  }
  // ... existing logic
}
```

### 2.2 Webhook Server (Supabase Edge Function)

**File:** `supabase/functions/webhook-server/index.ts`

Responsibilities:
- Receive incoming webhooks
- Match to automation triggers
- Queue for execution
- Return immediate response

### 2.3 Execution Monitor Dashboard

**File:** `src/pages/ExecutionMonitor.jsx` (route: `/automations/monitor`)

Features:
- Real-time run list (WebSocket subscription)
- Step detail view with input/output
- Filter by status, date, automation
- Error trace visualization
- Retry failed runs

### 2.4 Debug Mode

Add to `AutomationEditor.jsx`:
- Step-through execution (one node at a time)
- Breakpoint markers on nodes
- Variable inspector panel
- Execution path highlighting

### 2.5 New Node Types

| Node | Purpose |
|------|---------|
| **JSON Parse** | Parse string → JSON object |
| **JSON Transform** | Map/transform JSON structure |
| **Template** | String interpolation with variables |
| **Delay/Wait** | Pause execution for X seconds |
| **Date/Time** | Get current time, format dates |

---

## Phase 3: Polish & Enterprise (Months 3-4)

### 3.1 Enterprise Connectors

| Connector | Implementation |
|-----------|----------------|
| **Odoo** | JSON-RPC v14/v16/v17 (extend existing ConnectorHub) |
| **SAP S/4HANA** | OData V4 with CSRF handling |
| **SFTP** | ssh2/ssh2-sftp-client |
| **Stripe** | Official stripe-node SDK |
| **Shopify** | Shopify Admin API |

### 3.2 AI Enhancements

**RAG Memory Node:**
- Store conversation context in Supabase pgvector
- Retrieve relevant context for AI Agent

**Chain-of-Thought:**
- Enable step-by-step reasoning in AI Agent
- Configurable temperature/max_tokens

**Tool-Calling:**
- AI can call workflow nodes dynamically

### 3.3 Workflow Marketplace

**File:** `src/components/AutomationTemplateGallery.jsx`

Templates to create:
1. **ERP Sync** — Odoo/SAP ↔ MES Work Orders
2. **QC Inspection** — Auto-create WO on pass/fail
3. **Shift Handoff** — Daily summary → Telegram
4. **Machine Monitoring** — OEE alerts → Slack
5. **Purchase Request** — Low stock → Email supplier
6. **AI Quality Check** — Image → Gemini → Decision

### 3.4 Version Control

**File:** `src/components/AutomationVersioning.jsx`

Features:
- Version history with timestamps
- Side-by-side diff view
- One-click rollback
- (Future) Branch and merge

### 3.5 AI Copilot Multi-turn

Enhance `handleGenerateAiAutomation`:
- Chat history support
- Natural language editing
- Error diagnosis mode

---

## Menu Integration

Update `src/components/layout/TopNavbar.jsx` to include:

```javascript
// Automation menu item
{
  label: 'Automation',
  icon: <Zap className="w-5 h-5" />,
  children: [
    { label: 'Workflows', path: '/automations' },
    { label: 'Monitor', path: '/automations/monitor' },
    { label: 'Templates', path: '/automations/templates' },
    { label: 'Settings', path: '/automations/settings' },
  ]
}
```

---

## Testing Strategy

```
Unit Tests (Vitest)
├── automationEngine.test.js
├── connectors/telegram.test.js
├── connectors/slack.test.js
└── scheduler.test.js

Integration Tests
├── workflow-end-to-end.test.js
└── webhook-handler.test.js

E2E Tests (Playwright)
├── automation-editor.spec.js
└── execution-monitor.spec.js
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Google OAuth complexity | Use Service Account (server-side) |
| Parallel execution races | Add mutex locks in Supabase |
| Credential storage security | Encrypt via Supabase Vault |
| Large workflow perf | Virtualize node rendering |

---

## Milestones Summary

| Phase | Week | Deliverable |
|-------|------|-------------|
| **1** | W1-2 | Supabase schema, automationDB.js |
| **1** | W3-4 | Telegram, Slack, Sheets, Email connectors |
| **2** | W5-6 | Parallel Fork/Join, Webhook server |
| **2** | W7-8 | Monitor dashboard, Debug mode |
| **3** | W9-10 | Odoo/SAP connectors, AI enhancements |
| **3** | W11-12 | Marketplace, Versioning, Polish |

---

## Critical Files to Modify

| File | Action |
|------|--------|
| `src/utils/automationEngine.js` | Refactor to async + logging |
| `src/components/AutomationEditor.jsx` | Add pause/resume/cancel, debug mode |
| `src/components/TopNavbar.jsx` | Add Automation menu |
| `supabase_setup.sql` | Add new tables |
| `src/utils/connectors/*.js` | New connector modules |

---

## Verification

1. Run `npm test` — all unit tests pass
2. Run `npm run dev` — app starts without errors
3. Create new automation workflow in UI
4. Execute workflow with Telegram/Slack connector
5. Verify execution log appears in Monitor
6. Test pause/resume/cancel functionality
