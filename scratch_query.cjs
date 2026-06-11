const URL = 'https://pypjnzvsolxsddsqworw.supabase.co/rest/v1/frontline_apps?select=id,name,config';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5cGpuenZzb2x4c2Rkc3F3b3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTQ1MDQsImV4cCI6MjA5MjY5MDUwNH0.kjKlJu336ZqIOEk4SV7WhPrhsHzQv-rrKDh-oPasbAc';

fetch(URL, {
  headers: {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`
  }
})
.then(res => res.json())
.then(data => {
  console.log("Found", data.length, "apps:");
  data.forEach(app => {
    console.log(`- App: ${app.name} (${app.id})`);
    console.log(`  scalingMode: ${app.config?.scalingMode}`);
    console.log(`  devicePreset: ${app.config?.devicePreset}`);
  });
})
.catch(err => console.error("Error:", err));
