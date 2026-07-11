---
name: mavi-mes
description: Integration skill for Mavi MES database, queue management, Andon alerts, and daily production reports.
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - SUPABASE_URL
        - SUPABASE_KEY
---

# Mavi MES Integration Skill

This skill allows the OpenClaw agent to query, manage, and report on the shop floor state in Mavi MES.

## Available Actions

### 1. View Active Jobs / Production Queue
To see what is running on the shop floor:
* Use the `exec` tool to run: `node scripts/mavi_cli.js get-jobs`

### 2. Create a New Production Job (Work Order)
To dispatch a new work order to the queue:
* Use the `exec` tool to run: `node scripts/mavi_cli.js create-job --wo <WO_ID> --qty <QTY> --priority <P1_OR_P2>`
* **Parameters:**
  * `--wo`: Work Order code (e.g., `WO-2026-XYZ`)
  * `--qty`: (Optional) Target quantity of pieces to build
  * `--priority`: (Optional) Set `P1` for High or `P2` for Normal priority.

### 3. Update Job Status
To mark a production job as RUNNING or COMPLETED:
* Use the `exec` tool to run: `node scripts/mavi_cli.js update-job --id <JOB_UUID> --status <STATUS>`
* **Parameters:**
  * `--id`: The unique database UUID of the job
  * `--status`: `PENDING`, `RUNNING`, or `COMPLETED`

### 4. Trigger Andon Alert
When there's a shop floor disruption (e.g. material shortage, machine down):
* Use the `exec` tool to run: `node scripts/mavi_cli.js trigger-andon --station <STATION_NAME> --category <CATEGORY> --detail <DESCRIPTION>`
* **Parameters:**
  * `--station`: Station ID/Name (e.g., `Station-A`)
  * `--category`: Category of issue (e.g., `Machine Fault`, `Material Shortage`, `Quality Issue`)
  * `--detail`: Description of what went wrong.

### 5. Resolve Andon Alert
To clear an Andon alert after resolving the issue:
* Use the `exec` tool to run: `node scripts/mavi_cli.js resolve-andon --station <STATION_NAME>`

### 6. Generate Daily Report Summary
To pull a quick breakdown of today's production analytics:
* Use the `exec` tool to run: `node scripts/mavi_cli.js report-daily`

---

## Guidelines for OpenClaw Agent
- Always verify parameter inputs (like ensuring a valid UUID format for `--id`).
- When triggering or resolving Andon alerts, present the result clearly to the user using clean formatting.
- When generating reports, summarize the tables neatly in Markdown formatting.
- Fallback configuration values are baked into the CLI script, but environment variables (`SUPABASE_URL` and `SUPABASE_KEY`) are preferred for production environments.
