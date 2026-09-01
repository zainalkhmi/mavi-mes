/**
 * Shift Handoff Summary AI Agent - Mandor MES
 * Synthesizes production data into concise, actionable shift summaries
 */

// Shift Handoff Agent Configuration
export const SHIFT_HANDOFF_AGENT = {
  id: 'shift_handoff_agent',
  name: 'Shift Handoff Summary Agent',
  description: 'Automatically synthesizes production data into concise shift summaries for seamless manufacturing transitions',

  // System prompt for the agent
  systemPrompt: `INSTRUCTIONS
YOUR TASK:
Generate a comprehensive shift handoff summary using the provided production data, focusing on actionable insights and critical alerts that require immediate attention from the incoming shift team.

INPUT
The user will prompt you to summarize a shift or multiple shifts' performance for them.

YOUR OUTPUT:

Example format:
"Shift Summary (6AM-2PM): Achieved 94% of production target with 405 units completed across 11 work orders. ALERT: ANDON_KIT_01 station exceeded baseline utilization by 23%, indicating high demand. REMOTE_PROD_01 experienced 3 unplanned stops (47 min total) due to feeder mechanism issues detected at 10:15, 12:30, and 13:45. Recommend immediate maintenance review. Quality: 100% pass rate maintained. Next shift priority: Address feeder mechanism on REMOTE_PROD_01 before production resumes."


1. Executive Summary (2-3 sentences)
- Overall shift performance vs. targets
- Key achievements or concerns

2. Station Performance Analysis
For each station, provide:
- Utilization rate vs. baseline (flag if >15% deviation)
- Notable events or anomalies
- Impact on downstream operations

3. Quality & Production Metrics
- Units produced vs. target
- Quality pass rates
- Cycle time performance
- Work order completion status

4. Critical Alerts & Anomalies
Highlight issues requiring immediate attention:
- Equipment failures or unusual downtime
- Quality deviations exceeding thresholds
- Resource constraints or bottlenecks
- Safety incidents or near-misses

5. Trend Analysis
- Performance patterns compared to previous shifts
- Emerging issues or improvements
- Predictive insights for next shift

6. Handoff Recommendations
- Priority actions for incoming shift
- Equipment requiring attention
- Process adjustments needed
- Resource allocation suggestions

YOU MUST
- KEEP SUMMARIES UNDER 250 WORDS PER SUMMARY.
- FOLLOW THE EXAMPLE FORMAT WHICH WAS PROVIDED UNDER THE OUTPUT SECTION
- Use clear, jargon-free language understandable by shop-floor personnel.
- Only report statistically or operationally significant trends and anomalies.
- Remain neutral — report observed data without assuming root causes unless supported by evidence.
- Rank anomalies by operational impact (downtime > defects > minor deviations).
- Always clarify or ask follow-up questions if needed.
- If data is missing or ambiguous, note it explicitly in the summary.`,

  // Facility context
  facilityContext: {
    name: 'Andon Manufacturing Company',
    stations: [
      'Material Warehouse',
      'Remote Production',
      'Remote Assembly',
      'Andon Kitting',
      'Andon Assembly',
      'Final Inspection',
      'Shipping'
    ],
    targets: {
      throughputPerHour: 50,
      averageCycleTime: 7.5, // minutes
      qualityPassRate: 98
    },
    productMix: ['Remote Controls', 'Andon Lamps']
  },

  // Critical thresholds
  thresholds: {
    utilizationVariance: 15, // %
    downtimeAlert: 30, // minutes
    cycleTimeVariance: 20, // %
    qualityFailure: 1 // any failure
  },

  // Database tables to query
  tables: {
    stations: 'stations',
    stationActivity: 'station_activity',
    workOrders: 'work_orders',
    units: 'units',
    inspections: 'inspections',
    defects: 'defects',
    equipment: 'equipment',
    comments: 'comments',
    actions: 'actions'
  }
};

// Table schema mappings
export const TABLE_SCHEMAS = {
  stations: {
    description: 'Current station status and configuration',
    fields: {
      id: 'Station identifier',
      oekxd_status: '"RUNNING", "DOWN", "MAINTENANCE", "IDLE"',
      kiyrh_current_operator: 'Operator name/ID',
      grdfr_current_job_id: 'Current work order ID',
      ssgxo_current_product_id: 'Product being manufactured'
    }
  },
  station_activity: {
    description: 'Historical station performance and downtime tracking',
    fields: {
      id: 'Unique activity record ID',
      knheh_station: 'Station ID reference',
      bwuaq_status: 'Activity status',
      kvqgd_start_date_time: 'Activity start timestamp',
      ftizq_end_date_time: 'Activity end timestamp',
      ncgrz_duration: 'Duration in minutes'
    }
  },
  work_orders: {
    description: 'Production orders and completion tracking',
    fields: {
      id: 'Work order number (format: WO-YYYY-###)',
      levog_status: '"COMPLETED", "IN_PROGRESS", "PLANNED"',
      reavb_qty_required: 'Planned quantity',
      ftnlk_qty_complete: 'Completed quantity',
      zziwa_startdate: 'Start timestamp',
      nmqnv_complete_date: 'Completion timestamp'
    }
  },
  units: {
    description: 'Individual unit production tracking',
    fields: {
      id: 'Unit serial number',
      wgnxp_work_order: 'Work order reference',
      bouoq_completed_date: 'Unit completion timestamp',
      xnazp_produced_by: 'Station that completed the unit',
      oltjf_status: '"COMPLETED", "IN_PROGRESS", "REJECTED"'
    }
  },
  inspections: {
    description: 'Quality inspection outcomes',
    fields: {
      id: 'Inspection record ID',
      huegu_passed: 'Boolean (true/false)',
      daypb_order_id: 'Work order reference',
      tpyyp_location: 'Inspection station',
      svvky_operator: 'Inspector name',
      buwix_measured: 'Measurement value (if applicable)'
    }
  },
  defects: {
    description: 'Defect tracking and categorization',
    fields: {
      id: 'Defect record ID',
      tjwit_reason: 'Defect type/reason',
      vbfik_location: 'Station where defect found',
      vrasf_severity: '"MINOR", "MAJOR", "CRITICAL"',
      qxitw_status: '"OPEN", "RESOLVED", "INVESTIGATING"',
      dgcuy_quantity: 'Number of affected units'
    }
  },
  equipment: {
    description: 'Equipment status and maintenance tracking',
    fields: {
      id: 'Equipment identifier',
      vaoro_status: '"OPERATIONAL", "MAINTENANCE_REQUIRED", "DOWN"',
      wrvtl_location: 'Station location',
      jhzaa_last_calibration: 'Last calibration date',
      uxlug_maintenance_status: 'Maintenance state'
    }
  },
  comments: {
    description: 'Operational exceptions and issues',
    fields: {
      id: 'Exception record ID',
      akioj_location: 'Station/location',
      ejicn_severity: '"LOW", "MEDIUM", "HIGH", "CRITICAL"',
      thlqv_description: 'Exception description',
      epazg_status: '"OPEN", "INVESTIGATING", "RESOLVED"'
    }
  },
  actions: {
    description: 'Action items and follow-up tasks',
    fields: {
      id: 'Action item ID',
      iydrm_location: 'Station/cell reference',
      skoec_severity: 'Priority level',
      zkdcu_status: '"OPEN", "IN_PROGRESS", "COMPLETED"',
      vqvci_title: 'Related defect reference'
    }
  }
};

// Use cases for the shift handoff agent
export const SHIFT_HANDOFF_USE_CASES = [
  {
    id: 'downtime_alert',
    name: 'Shift Transition Downtime Alert & Maintenance Prioritization',
    description: 'Preventing extended equipment downtime during shift transition by automatically flagging and recommending maintenance for stations with critical performance anomalies.',
    value: 'Reduces unplanned production stoppages at the start of each shift, ensures seamless handoff, and increases facility output by proactively highlighting and ranking critical issues based on operational impact.',
    targetUsers: ['Production Supervisors', 'Maintenance Leads'],
    examplePrompt: 'Summarize the 2PM-10PM shift. Highlight any stations with downtime over 30 minutes, provide OEE metrics, and list urgent maintenance recommendations for the incoming team.'
  },
  {
    id: 'quality_escalation',
    name: 'Quality Deviation Escalation',
    description: 'Detecting and escalating quality deviations at Final Inspection so corrective actions can be implemented before defective units leave the facility.',
    value: 'Minimizes the spread of defects, increases customer satisfaction, and reduces rework costs by enabling the shift team to act on data-driven recommendations with traceable, prioritized tasks.',
    targetUsers: ['Quality Managers', 'Final Inspection Leads'],
    examplePrompt: 'Generate an end-of-shift report for Final Inspection from 6AM-2PM. Focus on detected quality failures, tie alerts to affected work orders, and advise immediate actions for the next shift.'
  },
  {
    id: 'bottleneck_detection',
    name: 'Bottleneck Detection and Throughput Optimization',
    description: 'Automatically identifying stations or processes where throughput is falling short of targets or cycle times are spiking, enabling leaders to intervene before backlog grows.',
    value: 'Increases output and reduces lead times by proactively targeting bottlenecks; helps supervisors allocate operators or resources where they\'re needed most.',
    targetUsers: ['Production Managers', 'Process Improvement Engineers'],
    examplePrompt: 'Generate a shift summary for 10PM-6AM. Identify any stations underperforming vs throughput or cycle time targets, and recommend resource allocation for the next shift.'
  },
  {
    id: 'safety_escalation',
    name: 'Safety Incident Escalation at Shift Handover',
    description: 'Flagging critical safety incidents or near-misses during the prior shift, with clear action steps and escalation to EHS (Environment, Health, and Safety) teams for immediate follow-up.',
    value: 'Improves workplace safety, ensures regulatory compliance, and prevents repeat incidents by providing fast, detailed updates to EHS stakeholders at shift change.',
    targetUsers: ['EHS Officers', 'Area Supervisors'],
    examplePrompt: 'Summarize any safety incidents or high-severity exceptions from today\'s 6AM-2PM shift, including location, description, and status of corrective actions.'
  }
];

// Helper function to generate shift handoff summary
export async function generateShiftSummary(shiftRange, options = {}) {
  const {
    focusArea = 'all', // 'all', 'quality', 'maintenance', 'safety', 'throughput'
    previousShift = null,
    includeRecommendations = true
  } = options;

  // Build the context prompt
  const contextPrompt = `
FACILITY CONTEXT:
- Manufacturing facility: ${SHIFT_HANDOFF_AGENT.facilityContext.name}
- Key stations: ${SHIFT_HANDOFF_AGENT.facilityContext.stations.join(', ')}
- Production targets: ~${SHIFT_HANDOFF_AGENT.facilityContext.targets.throughputPerHour} units/hour, ${SHIFT_HANDOFF_AGENT.facilityContext.targets.averageCycleTime}-minute average cycle time
- Product mix: ${SHIFT_HANDOFF_AGENT.facilityContext.productMix.join(', ')}

SHIFT TO ANALYZE: ${shiftRange}
FOCUS AREA: ${focusArea === 'all' ? 'Full shift performance' : focusArea.toUpperCase()}

CRITICAL THRESHOLDS:
- Utilization variance: >${SHIFT_HANDOFF_AGENT.thresholds.utilizationVariance}% from baseline
- Downtime events: >${SHIFT_HANDOFF_AGENT.thresholds.downtimeAlert} minutes unplanned
- Quality issues: Any failure or deviation
- Cycle time variance: >${SHIFT_HANDOFF_AGENT.thresholds.cycleTimeVariance}% from ${SHIFT_HANDOFF_AGENT.facilityContext.targets.averageCycleTime}-minute target

Please analyze the production data and generate a comprehensive shift handoff summary following the output format specified in your instructions.`;

  return contextPrompt;
}

// Helper to create data query parameters
export function getDataQueryParams(shiftRange) {
  // Parse shift range (e.g., "6AM-2PM", "2PM-10PM", "10PM-6AM")
  const [startStr, endStr] = shiftRange.split('-');
  const now = new Date();

  // Simple time parsing
  const parseTime = (str) => {
    const match = str.trim().match(/(\d+)(AM|PM)/i);
    if (match) {
      let hour = parseInt(match[1]);
      if (match[2].toUpperCase() === 'PM' && hour !== 12) hour += 12;
      if (match[2].toUpperCase() === 'AM' && hour === 12) hour = 0;
      return hour;
    }
    return 8; // default
  };

  const startHour = parseTime(startStr);
  const endHour = parseTime(endStr);

  // Build date range for the shift
  const startDate = new Date(now);
  startDate.setHours(startHour, 0, 0, 0);

  const endDate = new Date(now);
  if (endHour <= startHour) {
    endDate.setDate(endDate.getDate() + 1);
  }
  endDate.setHours(endHour, 0, 0, 0);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    shiftDuration: Math.abs(endHour - startHour),
    startHour,
    endHour
  };
}

// Generate a complete shift handoff report with all data
export async function generateShiftHandoffReport(shiftRange, connector) {
  const { startDate, endDate } = getDataQueryParams(shiftRange);

  // This would typically fetch real data from the database
  // For now, we structure the query that would be executed
  const dataQueries = {
    stations: {
      table: 'stations',
      query: `SELECT * FROM stations WHERE status != 'IDLE'`,
      purpose: 'Current station status'
    },
    stationActivity: {
      table: 'station_activity',
      query: `SELECT * FROM station_activity
              WHERE kvqgd_start_date_time >= '${startDate}'
              AND kvqgd_start_date_time < '${endDate}'`,
      purpose: 'Historical station performance and downtime'
    },
    workOrders: {
      table: 'work_orders',
      query: `SELECT * FROM work_orders
              WHERE zziwa_startdate >= '${startDate}'
              OR nmqnv_complete_date >= '${startDate}'`,
      purpose: 'Production orders and completion'
    },
    units: {
      table: 'units',
      query: `SELECT * FROM units
              WHERE bouoq_completed_date >= '${startDate}'
              AND bouoq_completed_date < '${endDate}'`,
      purpose: 'Individual unit production tracking'
    },
    inspections: {
      table: 'inspections',
      query: `SELECT * FROM inspections
              WHERE created_at >= '${startDate}'
              AND created_at < '${endDate}'`,
      purpose: 'Quality inspection outcomes'
    },
    defects: {
      table: 'defects',
      query: `SELECT * FROM defects
              WHERE created_at >= '${startDate}'
              AND created_at < '${endDate}'`,
      purpose: 'Defect tracking'
    },
    equipment: {
      table: 'equipment',
      query: `SELECT * FROM equipment
              WHERE vaoro_status != 'OPERATIONAL'`,
      purpose: 'Equipment requiring attention'
    },
    comments: {
      table: 'comments',
      query: `SELECT * FROM comments
              WHERE created_at >= '${startDate}'
              AND created_at < '${endDate}'
              AND ejicn_severity IN ('HIGH', 'CRITICAL')`,
      purpose: 'Critical operational exceptions'
    },
    actions: {
      table: 'actions',
      query: `SELECT * FROM actions
              WHERE created_at >= '${startDate}'
              AND zkdcu_status != 'COMPLETED'`,
      purpose: 'Open action items'
    }
  };

  // Build AI prompt with data structure
  const dataStructurePrompt = `
Please generate a comprehensive shift handoff report for the following shift:

SHIFT RANGE: ${shiftRange}
DATE: ${new Date().toLocaleDateString()}

The following data has been collected from the production system:

${Object.entries(dataQueries).map(([key, q]) =>
    `[${key.toUpperCase()}] - ${q.purpose}\nTable: ${q.table}\nQuery: ${q.query}`
).join('\n\n')}

Based on your analysis of these data sources, generate a shift handoff summary that includes:

1. EXECUTIVE SUMMARY
2. STATION PERFORMANCE (flag any >15% utilization variance)
3. QUALITY & PRODUCTION METRICS
4. CRITICAL ALERTS & ANOMALIES (prioritize downtime > defects > minor deviations)
5. TREND ANALYSIS
6. HANDOFF RECOMMENDATIONS

Remember:
- Keep under 250 words
- Use the example format provided
- Rank by operational impact
- Report only significant trends
- Note any missing or ambiguous data`;

  return dataStructurePrompt;
}

export default {
  SHIFT_HANDOFF_AGENT,
  TABLE_SCHEMAS,
  SHIFT_HANDOFF_USE_CASES,
  generateShiftSummary,
  getDataQueryParams,
  generateShiftHandoffReport
};
