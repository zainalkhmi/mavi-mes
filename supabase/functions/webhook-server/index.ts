/**
 * Automation Webhook Server
 * Supabase Edge Function to receive incoming webhooks
 *
 * Usage:
 * POST /functions/v1/webhook-server?automation_id=xxx
 * Body: { event: "work_order.created", data: {...} }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-automation-secret, x-webhook-signature',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

// =====================================================
// SUPABASE CLIENT
// =====================================================

function getSupabaseClient(supabaseUrl: string, serviceRoleKey: string) {
    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
    });
}

// =====================================================
// WEBHOOK VERIFICATION
// =====================================================

async function verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
): Promise<boolean> {
    if (!secret || !signature) return true; // Skip if no secret configured

    try {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signatureBuffer = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(payload)
        );

        const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return signature === expectedSignature;
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

// =====================================================
// TRIGGER AUTOMATION
// =====================================================

async function triggerAutomation(
    supabase: any,
    automationId: string,
    triggerEvent: any
) {
    // Get automation details
    const { data: automation, error: autoError } = await supabase
        .from('automations')
        .select('*')
        .eq('id', automationId)
        .single();

    if (autoError || !automation) {
        throw new Error(`Automation not found: ${automationId}`);
    }

    if (!automation.is_active) {
        return {
            success: false,
            message: 'Automation is not active',
            automationId
        };
    }

    // Create run record
    const { data: run, error: runError } = await supabase
        .from('automation_runs')
        .insert({
            automation_id: automationId,
            status: 'pending',
            trigger_type: 'webhook',
            trigger_event: triggerEvent,
            execution_mode: 'production'
        })
        .select()
        .single();

    if (runError) {
        throw new Error(`Failed to create run: ${runError.message}`);
    }

    // Update automation stats
    await supabase.rpc('update_automation_stats', { run_id: run.id });

    return {
        success: true,
        runId: run.id,
        automationId,
        automationName: automation.name,
        message: 'Automation triggered successfully'
    };
}

// =====================================================
// ROUTE WEBHOOK TO AUTOMATIONS
// =====================================================

async function routeWebhookEvent(supabase: any, event: any, triggerConfig: any) {
    const { eventType, data } = event;

    // Find automations subscribed to this event
    const { data: automations, error } = await supabase
        .from('automations')
        .select('*')
        .eq('is_active', true)
        .contains('trigger_config', { type: 'webhook' });

    if (error) {
        throw new Error(`Failed to fetch automations: ${error.message}`);
    }

    const triggered: string[] = [];

    for (const automation of automations || []) {
        const config = automation.trigger_config || {};

        // Check if this automation matches the event
        const shouldTrigger =
            config.events?.includes(eventType) ||
            config.events?.includes('*') ||
            (eventType && config.events?.length === 0);

        if (shouldTrigger) {
            await triggerAutomation(supabase, automation.id, {
                event: eventType,
                source: 'webhook',
                timestamp: new Date().toISOString(),
                data
            });
            triggered.push(automation.id);
        }
    }

    return triggered;
}

// =====================================================
// MAIN REQUEST HANDLER
// =====================================================

serve(async (req: Request) => {
    const url = new URL(req.url);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const automationSecret = Deno.env.get('AUTOMATION_WEBHOOK_SECRET') || '';

    const supabase = getSupabaseClient(supabaseUrl, serviceRoleKey);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Parse request
        const body = await req.text();

        // Get automation_id from query params or body
        let automationId = url.searchParams.get('automation_id');

        // Parse body as JSON
        let payload: any = {};
        if (body) {
            try {
                payload = JSON.parse(body);
            } catch {
                payload = { raw: body };
            }
        }

        // If no specific automation_id, try to find from body or route by event
        if (!automationId && payload.automation_id) {
            automationId = payload.automation_id;
        }

        // Verify webhook signature if configured
        const signature = req.headers.get('x-webhook-signature') || '';
        if (automationSecret && signature) {
            const isValid = await verifyWebhookSignature(body, signature, automationSecret);
            if (!isValid) {
                return new Response(
                    JSON.stringify({ error: 'Invalid webhook signature' }),
                    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        // Log incoming webhook
        console.log('Webhook received:', {
            automationId,
            event: payload.event,
            timestamp: new Date().toISOString()
        });

        // Execute based on mode
        let result;

        if (automationId) {
            // Trigger specific automation
            result = await triggerAutomation(supabase, automationId, {
                event: payload.event,
                source: 'webhook',
                timestamp: new Date().toISOString(),
                data: payload.data || payload
            });
        } else {
            // Route by event type
            const triggered = await routeWebhookEvent(supabase, {
                eventType: payload.event,
                data: payload.data || payload
            }, {});

            result = {
                success: true,
                triggeredAutomations: triggered.length,
                automationIds: triggered
            };
        }

        // Return success response
        return new Response(
            JSON.stringify({
                success: true,
                ...result,
                receivedAt: new Date().toISOString()
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Webhook processing error:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Internal server error'
            }),
            {
                status: error.message.includes('not found') ? 404 : 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
