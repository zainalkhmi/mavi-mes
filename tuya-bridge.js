import mqtt from 'mqtt';
import TuyaDevice from 'tuyapi';

// ─── CONFIGURATION ──────────────────────────────────────────────────────────
// Sesuaikan dengan data Anda
const CONFIG = {
    mqttBroker: 'wss://broker.emqx.io:8084/mqtt', // Broker URL yang sama dengan di Mavi
    deviceId: 'a3b7f7d2bd950a5d81g2pl',       // Device ID dari Tuya
    localKey: 'MASUKKAN_LOCAL_KEY_TUYA_ANDA',       // Local Key dari Tuya (dapatkan dari Tuya IoT Platform)
    deviceIp: '157.85.207.85',   // IP Address colokan
};
// ─────────────────────────────────────────────────────────────────────────────

if (!CONFIG.localKey || CONFIG.localKey.includes('MASUKKAN') || CONFIG.localKey.length !== 16) {
    console.error('\n❌ ERROR: Tuya Local Key tidak valid atau belum diisi!');
    console.error('Silakan buka file "tuya-bridge.js", lalu ganti "localKey" dengan 16-karakter local key perangkat Tuya Anda.');
    console.error('Dapatkan Local Key dari Tuya IoT Platform -> Cloud -> API Explorer -> Get Device Details.\n');
    process.exit(1);
}

console.log('🔄 Memulai Tuya-MQTT Bridge...');

const client = mqtt.connect(CONFIG.mqttBroker);

const device = new TuyaDevice({
    id: CONFIG.deviceId,
    key: CONFIG.localKey,
    ip: CONFIG.deviceIp,
    version: '3.3' // Versi default protokol Tuya
});

client.on('connect', () => {
    console.log('✅ Terhubung ke MQTT Broker:', CONFIG.mqttBroker);
    
    // Mavi mempublikasikan status ke topik ini saat sakelar diklik
    const topic = `tuya/${CONFIG.deviceId}/command`;
    client.subscribe(topic, (err) => {
        if (!err) {
            console.log(`📡 Menunggu perintah Mavi di topik: ${topic}`);
        }
    });
});

client.on('message', async (topic, message) => {
    console.log(`📩 Perintah diterima dari Mavi:`, message.toString());
    try {
        const payload = JSON.parse(message.toString());
        // Periksa apakah ada payload 'on'
        const turnOn = payload.on !== undefined ? payload.on : (payload.telemetry?.on);
        
        if (turnOn === undefined) {
            console.log('⚠️ Format perintah tidak dikenal.');
            return;
        }

        console.log(`🔌 Menghubungkan ke Tuya Plug lokal (${CONFIG.deviceIp})...`);
        
        await device.find();
        await device.connect();
        
        // DPS 1 biasanya adalah status sakelar ON/OFF untuk colokan Tuya
        await device.set({ set: turnOn, dps: 1 });
        console.log(`🚀 Berhasil mengubah status colokan menjadi: ${turnOn ? 'ON' : 'OFF'}`);
        
        // Kirim balik feedback status ke Mavi
        const stateTopic = `tuya/${CONFIG.deviceId}/state`;
        client.publish(stateTopic, JSON.stringify({ on: turnOn }));
        
        await device.disconnect();
        console.log('🔌 Koneksi lokal diputus (siaga).');
    } catch (err) {
        console.error('❌ Gagal mengontrol Tuya Plug:', err.message);
        try { await device.disconnect(); } catch(e) {}
    }
});

client.on('error', (err) => {
    console.error('❌ Kesalahan MQTT Broker:', err.message);
});
