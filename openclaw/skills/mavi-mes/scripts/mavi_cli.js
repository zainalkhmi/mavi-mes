#!/usr/bin/env node

/**
 * Mavi MES CLI Helper for OpenClaw Skill
 * =====================================
 * This script is called by OpenClaw to interact with Mavi MES database.
 * 
 * Usage:
 *   node mavi_cli.js get-jobs
 *   node mavi_cli.js create-job --wo WO-100 --app <app_uuid> --qty 10 --priority P1
 *   node mavi_cli.js update-job --id <job_uuid> --status RUNNING
 *   node mavi_cli.js trigger-andon --station "Station-A" --category "Machine Fault" --detail "Spindle motor overheated"
 *   node mavi_cli.js resolve-andon --station "Station-A"
 *   node mavi_cli.js report-daily
 */

import { createClient } from '@supabase/supabase-js';

// Configuration (fallback to defaults if not set in environment)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pypjnzvsolxsddsqworw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5cGpuenZzb2x4c2Rkc3F3b3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTQ1MDQsImV4cCI6MjA5MjY5MDUwNH0.kjKlJu336ZqIOEk4SV7WhPrhsHzQv-rrKDh-oPasbAc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
    printHelp();
    process.exit(1);
}

// Parse named options (--wo, --qty, etc.)
function getOption(name) {
    const idx = args.indexOf(name);
    if (idx !== -1 && args[idx + 1]) {
        return args[idx + 1];
    }
    return null;
}

async function run() {
    try {
        switch (command) {
            case 'get-jobs':
                await getJobs();
                break;
            case 'create-job':
                await createJob();
                break;
            case 'update-job':
                await updateJob();
                break;
            case 'trigger-andon':
                await triggerAndon();
                break;
            case 'resolve-andon':
                await resolveAndon();
                break;
            case 'report-daily':
                await reportDaily();
                break;
            default:
                console.error(`Unknown command: ${command}`);
                printHelp();
                process.exit(1);
        }
    } catch (err) {
        console.error('❌ Error executing command:', err.message || err);
        process.exit(1);
    }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

async function getJobs() {
    console.log('Fetching active production queue...');
    const { data, error } = await supabase
        .from('production_queue')
        .select('*')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
        console.log('No jobs in production queue.');
        return;
    }

    console.table(data.map(j => ({
        ID: j.id,
        'Work Order': j.work_order,
        Status: j.status,
        Priority: j.priority,
        'Target Qty': j.target_qty,
        Created: new Date(j.created_at).toLocaleString()
    })));
}

async function createJob() {
    const workOrder = getOption('--wo');
    const appId = getOption('--app');
    const qty = parseInt(getOption('--qty') || '0', 10);
    const priority = getOption('--priority') || 'P2';

    if (!workOrder) {
        throw new Error('--wo <work_order_id> is required');
    }

    console.log(`Creating job for Work Order: ${workOrder}...`);
    const { data, error } = await supabase
        .from('production_queue')
        .insert([{
            work_order: workOrder,
            app_id: appId || null,
            target_qty: qty,
            priority: priority,
            status: 'PENDING',
            created_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) throw error;
    console.log(`✅ Success! Job created:`, data);
}

async function updateJob() {
    const id = getOption('--id');
    const status = getOption('--status');

    if (!id || !status) {
        throw new Error('--id <job_uuid> and --status <status> are required');
    }

    console.log(`Updating job ${id} status to ${status.toUpperCase()}...`);
    const { data, error } = await supabase
        .from('production_queue')
        .update({ status: status.toUpperCase() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    console.log(`✅ Success! Job updated:`, data);
}

async function triggerAndon() {
    const station = getOption('--station');
    const category = getOption('--category') || 'General Alert';
    const detail = getOption('--detail') || '';

    if (!station) {
        throw new Error('--station <station_name> is required');
    }

    console.log(`Triggering Andon alert at ${station}...`);
    const eventData = {
        event_type: 'ANDON_TRIGGERED',
        operator_id: 'openclaw-agent',
        station_id: station,
        payload: {
            action: 'ANDON_TRIGGERED',
            category: category,
            detail: detail,
            work_order: 'N/A'
        },
        created_at: new Date().toISOString()
    };

    const { error } = await supabase
        .from('audit_logs')
        .insert(eventData);

    if (error) throw error;
    console.log(`🚨 Andon Alert triggered successfully for station "${station}"`);
}

async function resolveAndon() {
    const station = getOption('--station');

    if (!station) {
        throw new Error('--station <station_name> is required');
    }

    console.log(`Resolving Andon alert at ${station}...`);
    const eventData = {
        event_type: 'ANDON_RESOLVED',
        operator_id: 'openclaw-agent',
        station_id: station,
        payload: {
            action: 'ANDON_RESOLVED',
            category: 'Resolution',
            detail: 'Resolved by OpenClaw Agent',
            work_order: 'N/A'
        },
        created_at: new Date().toISOString()
    };

    const { error } = await supabase
        .from('audit_logs')
        .insert(eventData);

    if (error) throw error;
    console.log(`✅ Andon Alert resolved for station "${station}"`);
}

async function reportDaily() {
    console.log('Generating Daily Production Summary...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('completions')
        .select('*')
        .gte('end_time', today.toISOString());

    if (error) throw error;

    if (!data || data.length === 0) {
        console.log('No completions recorded today.');
        return;
    }

    const report = {
        total_completions: data.length,
        by_app: {},
        by_station: {}
    };

    data.forEach(item => {
        const app = item.app_name || 'Unknown App';
        const station = item.station_name || 'Unknown Station';

        report.by_app[app] = (report.by_app[app] || 0) + 1;
        report.by_station[station] = (report.by_station[station] || 0) + 1;
    });

    console.log('\n--- DAILY SUMMARY REPORT ---');
    console.log(`Total Completions: ${report.total_completions}`);
    console.log('\nBy Application:');
    console.table(Object.entries(report.by_app).map(([app, count]) => ({ App: app, Count: count })));
    console.log('\nBy Workstation:');
    console.table(Object.entries(report.by_station).map(([st, count]) => ({ Station: st, Count: count })));
}

function printHelp() {
    console.log(`
Mavi MES Helper CLI Utility
Usage:
  node mavi_cli.js <command> [options]

Commands:
  get-jobs               List all active production queue items
  create-job             Add a new job to the production queue
                         Options:
                           --wo <wo_id>        (Required) Work Order ID
                           --app <app_uuid>    (Optional) App ID
                           --qty <number>      (Optional) Target quantity
                           --priority <P1|P2>  (Optional) Priority (default P2)
  update-job             Update an existing job status
                         Options:
                           --id <job_uuid>     (Required) Job UUID
                           --status <status>   (Required) PENDING, RUNNING, COMPLETED
  trigger-andon          Trigger a shop floor Andon alert
                         Options:
                           --station <name>    (Required) Station name
                           --category <cat>    (Optional) Alert category
                           --detail <text>     (Optional) Detailed description
  resolve-andon          Resolve an active Andon alert
                         Options:
                           --station <name>    (Required) Station name
  report-daily           Generate daily completions summary
`);
}

run();
