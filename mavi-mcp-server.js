#!/usr/bin/env node

/**
 * Mavi MES Model Context Protocol (MCP) Server
 * ============================================
 * Provides stdio-based JSON-RPC 2.0 communication for Claude Desktop
 * and Antigravity IDE to access stasiun, mesin, tables, and completions in Mavi MES.
 */

// Config Settings (Fallback to Mavi defaults if not provided in environment)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pypjnzvsolxsddsqworw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5cGpuenZzb2x4c2Rkc3F3b3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTQ1MDQsImV4cCI6MjA5MjY5MDUwNH0.kjKlJu336ZqIOEk4SV7WhPrhsHzQv-rrKDh-oPasbAc';

// Logging helper (Stderr only, so we don't interfere with Stdout JSON-RPC stream)
function log(msg, ...args) {
    process.stderr.write(`[Mavi-MCP] ${msg} ${args.map(x => typeof x === 'object' ? JSON.stringify(x) : x).join(' ')}\n`);
}

log('Initializing enhanced server with Supabase URL:', SUPABASE_URL);

// Set up robust stdio buffer reading with brace matching to support multi-line JSON
let inputBuffer = '';
process.stdin.on('data', async (chunk) => {
    inputBuffer += chunk.toString();
    
    let processedLength = 0;
    while (processedLength < inputBuffer.length) {
        // Skip leading whitespace
        while (processedLength < inputBuffer.length && /\s/.test(inputBuffer[processedLength])) {
            processedLength++;
        }
        if (processedLength >= inputBuffer.length) break;

        let braceCount = 0;
        let insideString = false;
        let escapeNext = false;
        let startIndex = processedLength;
        let endIndex = -1;

        for (let i = startIndex; i < inputBuffer.length; i++) {
            const char = inputBuffer[i];
            if (escapeNext) {
                escapeNext = false;
                continue;
            }
            if (char === '\\') {
                escapeNext = true;
                continue;
            }
            if (char === '"') {
                insideString = !insideString;
                continue;
            }
            if (!insideString) {
                if (char === '{') {
                    braceCount++;
                } else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        endIndex = i + 1;
                        break;
                    }
                } else if (char === '\n' && braceCount === 0) {
                    endIndex = i + 1;
                    break;
                }
            }
        }

        if (endIndex !== -1) {
            const candidate = inputBuffer.substring(startIndex, endIndex).trim();
            processedLength = endIndex;
            if (candidate) {
                try {
                    const request = JSON.parse(candidate);
                    await handleRequest(request);
                } catch (err) {
                    log('Parse error reading JSON candidate:', err.message, 'Candidate:', candidate);
                    sendResponse(null, {
                        error: { code: -32700, message: `Parse error: ${err.message}` }
                    });
                }
            }
        } else {
            // Need more data
            break;
        }
    }
    
    if (processedLength > 0) {
        inputBuffer = inputBuffer.substring(processedLength);
    }
});

// JSON-RPC Send Helper
function sendResponse(id, payload) {
    const response = {
        jsonrpc: '2.0',
        ...(id !== undefined && id !== null ? { id } : {}),
        ...payload
    };
    process.stdout.write(JSON.stringify(response) + '\n');
}

// Request Dispatcher
async function handleRequest(request) {
    const { method, params, id } = request;
    log(`Incoming request: method=${method}, id=${id}`);

    try {
        switch (method) {
            case 'initialize':
                return sendResponse(id, {
                    result: {
                        protocolVersion: '2024-11-05',
                        capabilities: {
                            tools: {},
                            resources: {},
                            prompts: {}
                        },
                        serverInfo: {
                            name: 'mavi-mes-mcp',
                            version: '1.1.0'
                        }
                    }
                });

            case 'notifications/initialized':
                log('Notification initialized received. Session active.');
                return;

            case 'resources/list':
                return sendResponse(id, {
                    result: {
                        resources: [
                            {
                                uri: 'mavi://docs/mcp-guide',
                                name: 'Panduan MCP Mavi MES',
                                description: 'Dokumentasi standar cara AI berinteraksi dengan database Mavi secara aman.',
                                mimeType: 'text/markdown'
                            },
                            {
                                uri: 'mavi://docs/system-architecture',
                                name: 'Arsitektur Mavi MES',
                                description: 'Skema komponen sistem manufaktur di Mavi MES.',
                                mimeType: 'text/markdown'
                            }
                        ]
                    }
                });

            case 'resources/read': {
                const { uri } = params || {};
                log(`Read resource: uri=${uri}`);
                let text = '';
                if (uri === 'mavi://docs/mcp-guide') {
                    text = `# Panduan Penggunaan MCP Mavi MES\n\n1. **Read Operations**: Gunakan tool \`read_mavi_table\` dengan parameter \`limit\`, \`orderBy\` dan \`filters\` untuk memantau data.\n2. **Schema Discovery**: Selalu jalankan \`list_mavi_tables\` dan \`describe_mavi_table\` sebelum menulis data baru.\n3. **Write Operations**: Gunakan tool \`write_mavi_table\` secara aman untuk menyisipkan data baru.`;
                } else if (uri === 'mavi://docs/system-architecture') {
                    text = `# Arsitektur Sistem Mavi MES\n\n- **Frontend**: Tauri React App.\n- **Backend/Database**: Supabase PostgreSQL dengan API REST (PostgREST).\n- **Shop Floor Integration**: Protokol OPC UA (PLC Controllers), MQTT (Edge Devices), dan IoT Gateway (Zigbee/Matter/BLE).`;
                } else {
                    return sendResponse(id, {
                        error: { code: -32602, message: `Resource not found: ${uri}` }
                    });
                }
                return sendResponse(id, {
                    result: {
                        contents: [
                            {
                                uri,
                                mimeType: 'text/markdown',
                                text
                            }
                        ]
                    }
                });
            }

            case 'prompts/list':
                return sendResponse(id, {
                    result: {
                        prompts: [
                            {
                                name: 'diagnose-downtime',
                                description: 'Menganalisis stasiun kerja dan mesin yang sedang offline atau down untuk mencari tahu masalahnya.',
                                arguments: []
                            },
                            {
                                name: 'summarize-production',
                                description: 'Merangkum kinerja produksi hari ini berdasarkan daftar penyelesaian (completions).',
                                arguments: [
                                    {
                                        name: 'limit',
                                        description: 'Jumlah baris data produksi terbaru yang dianalisis (default: 5).',
                                        required: false
                                    }
                                ]
                            }
                        ]
                    }
                });

            case 'prompts/get': {
                const { name, arguments: promptArgs } = params || {};
                log(`Get prompt: name=${name}`, promptArgs);
                let messages = [];
                if (name === 'diagnose-downtime') {
                    messages = [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: 'Periksa status stasiun kerja menggunakan tool get_station_status atau read_mavi_table untuk stasiun dan mesin. Cari stasiun/mesin yang statusnya DOWN atau OFFLINE, lalu berikan analisis langkah penanganan masalahnya.'
                            }
                        }
                    ];
                } else if (name === 'summarize-production') {
                    const limitVal = promptArgs?.limit || '5';
                    messages = [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: `Tolong ambil ${limitVal} data penyelesaian produksi terbaru dari tabel completions menggunakan read_mavi_table, lalu rangkum durasi pengerjaan, stasiun yang paling aktif, dan status keberhasilannya.`
                            }
                        }
                    ];
                } else {
                    return sendResponse(id, {
                        error: { code: -32602, message: `Prompt not found: ${name}` }
                    });
                }
                return sendResponse(id, {
                    result: {
                        messages
                    }
                });
            }

            case 'tools/list':
                return sendResponse(id, {
                    result: {
                        tools: getToolsDefinition()
                    }
                });

            case 'tools/call': {
                const { name, arguments: args } = params || {};
                log(`Call tool: name=${name}`, args);
                const result = await executeTool(name, args);
                return sendResponse(id, {
                    result: {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(result, null, 2)
                            }
                        ]
                    }
                });
            }

            default:
                return sendResponse(id, {
                    error: {
                        code: -32601,
                        message: `Method not found: ${method}`
                    }
                });
        }
    } catch (err) {
        log(`Error processing request:`, err.message);
        return sendResponse(id, {
            error: {
                code: -32603,
                message: `Internal server error: ${err.message}`
            }
        });
    }
}

// Supabase REST fetch helper
async function supabaseFetch(path, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${path}`;
    const headers = {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Supabase API responded with status ${response.status}: ${text}`);
    }

    if (response.status === 204) return null;

    return await response.json();
}

// List of exposed tools
function getToolsDefinition() {
    return [
        {
            name: 'list_mavi_tables',
            description: 'Mendapatkan daftar lengkap nama tabel database Mavi MES bawaan beserta deskripsi fungsinya.',
            inputSchema: {
                type: 'object',
                properties: {}
            }
        },
        {
            name: 'describe_mavi_table',
            description: 'Membaca satu baris sampel data untuk mendeteksi skema kolom (keys) yang tersedia pada tabel database tertentu.',
            inputSchema: {
                type: 'object',
                properties: {
                    tableId: {
                        type: 'string',
                        description: 'Nama tabel database Mavi (e.g. completions, stations, machines).'
                    }
                },
                required: ['tableId']
            }
        },
        {
            name: 'read_mavi_table',
            description: 'Membaca record data dari tabel database Mavi MES dengan opsi limit, sorting (orderBy), dan filters.',
            inputSchema: {
                type: 'object',
                properties: {
                    tableId: {
                        type: 'string',
                        description: 'Nama tabel di database Supabase (e.g. completions, stations, machines).'
                    },
                    limit: {
                        type: 'integer',
                        description: 'Maksimal jumlah baris data yang diambil (default: 5).'
                    },
                    orderBy: {
                        type: 'string',
                        description: 'Kolom pengurutan dengan format kolom.arah (e.g. created_at.desc, name.asc).'
                    },
                    filters: {
                        type: 'string',
                        description: 'String filter PostgREST URL (e.g. status=eq.COMPLETED atau operator=like.*John*).'
                    }
                },
                required: ['tableId']
            }
        },
        {
            name: 'write_mavi_table',
            description: 'Menyisipkan record data baru ke dalam tabel database Mavi MES.',
            inputSchema: {
                type: 'object',
                properties: {
                    tableId: {
                        type: 'string',
                        description: 'Nama tabel database tujuan.'
                    },
                    recordData: {
                        type: 'object',
                        description: 'Data objek JSON yang akan dimasukkan ke baris tabel.'
                    }
                },
                required: ['tableId', 'recordData']
            }
        },
        {
            name: 'get_station_status',
            description: 'Mendapatkan data status real-time stasiun kerja di area produksi.',
            inputSchema: {
                type: 'object',
                properties: {
                    stationId: {
                        type: 'string',
                        description: 'ID UUID atau Nama Stasiun (e.g. WS-01).'
                    }
                },
                required: ['stationId']
            }
        },
        {
            name: 'set_station_status',
            description: 'Mengubah status operasional stasiun kerja di shop floor.',
            inputSchema: {
                type: 'object',
                properties: {
                    stationId: {
                        type: 'string',
                        description: 'Nama stasiun atau ID stasiun.'
                    },
                    status: {
                        type: 'string',
                        description: 'Status baru stasiun (e.g. RUNNING, DOWN, OFFLINE).'
                    },
                    description: {
                        type: 'string',
                        description: 'Keterangan tambahan atau catatan status.'
                    }
                },
                required: ['stationId', 'status']
            }
        },
        {
            name: 'get_machine_info',
            description: 'Mengambil informasi telemetri detail, tipe, dan status operasional dari mesin manufaktur.',
            inputSchema: {
                type: 'object',
                properties: {
                    machineId: {
                        type: 'string',
                        description: 'Nama mesin atau ID mesin.'
                    }
                },
                required: ['machineId']
            }
        },
        {
            name: 'list_active_users',
            description: 'Mendapatkan daftar sesi login operator aktif di shop floor.',
            inputSchema: {
                type: 'object',
                properties: {}
            }
        },
        {
            name: 'get_copilot_commands',
            description: 'Mengambil tugas coding atau perintah baru yang dikirim dari Mavi Builder Copilot.',
            inputSchema: {
                type: 'object',
                properties: {}
            }
        },
        {
            name: 'send_copilot_response',
            description: 'Mengirim pesan konfirmasi atau log eksekusi dari Antigravity ke chat Builder Copilot secara real-time.',
            inputSchema: {
                type: 'object',
                properties: {
                    message: {
                        type: 'string',
                        description: 'Isi pesan log status/keberhasilan dari Antigravity (e.g. Berhasil menambahkan widget baru).'
                    }
                },
                required: ['message']
            }
        }
    ];
}

// Tool Execution Implementation
async function executeTool(name, args) {
    switch (name) {
        case 'list_mavi_tables': {
            return {
                tables: [
                    { name: 'manuals', description: 'Panduan kerja dan instruksi kerja manufaktur.' },
                    { name: 'frontline_apps', description: 'Aplikasi shop floor yang dibuat oleh app builder.' },
                    { name: 'production_queue', description: 'Antrean perintah kerja (work order) untuk diproduksi.' },
                    { name: 'audit_logs', description: 'Log audit peristiwa/kejadian sistem dan operator.' },
                    { name: 'dynamic_translations', description: 'Peta terjemahan dinamis multi-bahasa.' },
                    { name: 'app_variables', description: 'Daftar variabel global untuk aplikasi builder.' },
                    { name: 'app_tables', description: 'Definisi tabel kustom (style Tulip).' },
                    { name: 'app_table_records', description: 'Baris data untuk masing-masing tabel kustom.' },
                    { name: 'chat_messages', description: 'Pesan obrolan real-time antar operator/stasiun.' },
                    { name: 'stations', description: 'Stasiun kerja di area perakitan/produksi (shop floor).' },
                    { name: 'machines', description: 'Daftar mesin pabrik beserta tipe dan status operasional.' },
                    { name: 'interfaces', description: 'Komputer, tablet, atau interface di stasiun kerja.' },
                    { name: 'integration_connectors', description: 'Konektor integrasi eksternal (AI, HTTP, DB).' },
                    { name: 'edge_devices', description: 'Perangkat edge IoT di area pabrik.' },
                    { name: 'station_groups', description: 'Pengelompokan stasiun kerja.' },
                    { name: 'measurements', description: 'Data rekaman telemetri / pengukuran manual.' },
                    { name: 'completions', description: 'Rekaman sejarah eksekusi aplikasi oleh operator.' },
                    { name: 'saved_analyses', description: 'Konfigurasi analisis/laporan data yang disimpan.' },
                    { name: 'dashboards', description: 'Konfigurasi visualisasi dashboard MES.' },
                    { name: 'player_sessions', description: 'Sesi operator aktif yang sedang menjalankan aplikasi.' },
                    { name: 'iot_smart_devices', description: 'Registri perangkat pintar IoT (Zigbee/Matter/BLE).' },
                    { name: 'iot_gateways', description: 'Gateway komunikasi IoT (Zigbee2MQTT, dll.).' },
                    { name: 'plc_controllers', description: 'Konfigurasi kontroler PLC pabrik.' },
                    { name: 'plc_tags', description: 'Tag register / alamat memory PLC.' }
                ]
            };
        }

        case 'describe_mavi_table': {
            const { tableId } = args;
            const sample = await supabaseFetch(`${tableId}?limit=1`);
            if (!sample || sample.length === 0) {
                return {
                    tableId,
                    columns: [],
                    message: 'Tabel ini kosong atau tidak dapat diakses, tidak ada baris data sampel untuk mendeteksi skema kolom.'
                };
            }
            const columns = Object.keys(sample[0]);
            return {
                tableId,
                columns,
                sampleRecord: sample[0],
                message: `Berhasil mendeteksi ${columns.length} kolom dari baris sampel.`
            };
        }

        case 'read_mavi_table': {
            const { tableId, limit = 5, orderBy, filters } = args;
            let queryParams = [];
            queryParams.push(`limit=${limit}`);
            if (orderBy) {
                queryParams.push(`order=${orderBy}`);
            }
            if (filters) {
                queryParams.push(filters);
            }
            const queryString = queryParams.join('&');
            return await supabaseFetch(`${tableId}?${queryString}`);
        }

        case 'write_mavi_table': {
            const { tableId, recordData } = args;
            const sensitiveTables = ['plc_controllers', 'integration_connectors'];
            if (sensitiveTables.includes(tableId)) {
                throw new Error(`Write operation to table '${tableId}' is restricted via MCP for safety.`);
            }
            return await supabaseFetch(tableId, {
                method: 'POST',
                headers: { 'Prefer': 'return=representation' },
                body: JSON.stringify(recordData)
            });
        }

        case 'get_station_status': {
            const { stationId } = args;
            const res = await supabaseFetch(`stations?or=(name.eq.${encodeURIComponent(stationId)},id.eq.${encodeURIComponent(stationId)})&limit=1`);
            if (!res || res.length === 0) {
                return { error: `Station "${stationId}" not found.` };
            }
            return res[0];
        }

        case 'set_station_status': {
            const { stationId, status, description = '' } = args;
            const search = await supabaseFetch(`stations?or=(name.eq.${encodeURIComponent(stationId)},id.eq.${encodeURIComponent(stationId)})&limit=1`);
            if (!search || search.length === 0) {
                return { error: `Station "${stationId}" not found.` };
            }
            const station = search[0];
            const hasStatusColumn = 'status' in station;
            
            let updatePayload = {
                updated_at: new Date().toISOString()
            };

            if (hasStatusColumn) {
                updatePayload.status = status.toUpperCase();
                if (description) {
                    updatePayload.description = description;
                }
            } else {
                updatePayload.description = `[STATUS: ${status.toUpperCase()}] ${description || station.description || ''}`;
            }

            const update = await supabaseFetch(`stations?id=eq.${station.id}`, {
                method: 'PATCH',
                headers: { 'Prefer': 'return=representation' },
                body: JSON.stringify(updatePayload)
            });
            
            return {
                success: true,
                message: `Station status updated to ${status}`,
                data: update?.[0] || station
            };
        }

        case 'get_machine_info': {
            const { machineId } = args;
            const res = await supabaseFetch(`machines?or=(name.eq.${encodeURIComponent(machineId)},id.eq.${encodeURIComponent(machineId)})&limit=1`);
            if (!res || res.length === 0) {
                return { error: `Machine "${machineId}" not found.` };
            }
            return res[0];
        }

        case 'list_active_users': {
            const res = await supabaseFetch(`player_sessions?select=id,operator,started_at,station_name&limit=10&order=started_at.desc`);
            return res || [];
        }

        case 'get_copilot_commands': {
            const pending = await supabaseFetch(`chat_messages?type=eq.IDE_COMMAND&is_read=eq.false&target_station_id=eq.antigravity&order=created_at.asc&limit=5`);
            if (pending && pending.length > 0) {
                for (const msg of pending) {
                    await supabaseFetch(`chat_messages?id=eq.${msg.id}`, {
                        method: 'PATCH',
                        headers: { 'Prefer': 'return=representation' },
                        body: JSON.stringify({
                            is_read: true,
                            read_at: new Date().toISOString()
                        })
                    });
                }
            }
            return pending || [];
        }

        case 'send_copilot_response': {
            const { message } = args;
            return await supabaseFetch('chat_messages', {
                method: 'POST',
                headers: { 'Prefer': 'return=representation' },
                body: JSON.stringify({
                    sender_id: 'antigravity',
                    sender_name: 'Antigravity IDE Agent',
                    station_id: 'AppBuilder',
                    content: message,
                    type: 'TEXT',
                    created_at: new Date().toISOString()
                })
            });
        }

        default:
            throw new Error(`Tool ${name} implementation missing.`);
    }
}
