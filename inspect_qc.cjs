const { createClient } = require('@supabase/supabase-js');

const url = 'https://pypjnzvsolxsddsqworw.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5cGpuenZzb2x4c2Rkc3F3b3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTQ1MDQsImV4cCI6MjA5MjY5MDUwNH0.kjKlJu336ZqIOEk4SV7WhPrhsHzQv-rrKDh-oPasbAc';

const supabase = createClient(url, anonKey, {
    auth: { persistSession: false }
});

async function run() {
    console.log('Fetching stations...');
    const { data: stations, error: stationsErr } = await supabase.from('stations').select('*');
    if (stationsErr) {
        console.error('Error fetching stations:', stationsErr);
        return;
    }

    console.log(`Found ${stations.length} stations:`);
    stations.forEach(s => {
        console.log(`- ID: ${s.id}, Name: "${s.name}", Description: "${s.description || ''}"`);
    });

    const qcStation = stations.find(s => s.name.toLowerCase().includes('qc'));
    if (!qcStation) {
        console.log('No QC station found in the stations table.');
        return;
    }

    console.log(`\nAnalyzing QC station: "${qcStation.name}" (ID: ${qcStation.id})`);

    // Let's check player_sessions for this station_id
    console.log('Checking player_sessions...');
    const { data: sessions, error: sessionsErr } = await supabase
        .from('player_sessions')
        .select('*')
        .eq('station_id', qcStation.id);
    
    if (sessionsErr) {
        console.error('Error fetching player_sessions:', sessionsErr);
    } else {
        console.log(`Found ${sessions.length} player sessions referencing this station.`);
        sessions.forEach((s, idx) => {
            console.log(`  [${idx+1}] Session ID: ${s.id}, App Name: "${s.app_name}", Operator: "${s.operator}"`);
        });
    }

    // Let's check interfaces for this station_id
    console.log('Checking interfaces...');
    const { data: interfaces, error: interfacesErr } = await supabase
        .from('interfaces')
        .select('*')
        .eq('station_id', qcStation.id);
    
    if (interfacesErr) {
        console.error('Error fetching interfaces by station_id:', interfacesErr);
    } else {
        console.log(`Found ${interfaces.length} interfaces referencing this station ID directly.`);
    }

    // Let's check interfaces by station name (just in case they store station name)
    const { data: interfacesByName, error: interfacesByNameErr } = await supabase
        .from('interfaces')
        .select('*')
        .eq('station_id', qcStation.name);
    
    if (interfacesByNameErr) {
        console.error('Error fetching interfaces by station name:', interfacesByNameErr);
    } else {
        console.log(`Found ${interfacesByName.length} interfaces referencing this station name directly.`);
    }

    // Try deleting the station to see the database error
    console.log('\nTesting deletion of QC station...');
    const { error: deleteErr } = await supabase
        .from('stations')
        .delete()
        .eq('id', qcStation.id);
    
    if (deleteErr) {
        console.error('❌ Deletion failed with error:', deleteErr);
    } else {
        console.log('✅ Deletion succeeded (temporarily/successfully in database)!');
    }
}

run().catch(console.error);
