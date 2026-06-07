import { createClient } from '@supabase/supabase-js';

const url = 'https://pypjnzvsolxsddsqworw.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5cGpuenZzb2x4c2Rkc3F3b3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTQ1MDQsImV4cCI6MjA5MjY5MDUwNH0.kjKlJu336ZqIOEk4SV7WhPrhsHzQv-rrKDh-oPasbAc';
const supabase = createClient(url, anonKey);

async function run() {
    console.log("Mulai membuat tabel...");

    // 1. Buat Tabel Users
    console.log("1. Membuat tabel 'Users'...");
    const { data: usersTable, error: err1 } = await supabase.from('app_tables').insert({
        name: 'Users',
        description: 'Tabel Pengguna',
        fields: [
            { name: 'username', type: 'text' },
            { name: 'email', type: 'text' }
        ],
        archived_field_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }).select().single();

    if (err1) throw err1;
    console.log("✅ Tabel Users berhasil dibuat dengan ID:", usersTable.id);

    // 2. Buat Tabel Tasks
    console.log("2. Membuat tabel 'Tasks'...");
    const { data: tasksTable, error: err2 } = await supabase.from('app_tables').insert({
        name: 'Tasks',
        description: 'Tabel Tugas',
        fields: [
            { name: 'title', type: 'text' },
            { name: 'status', type: 'text' },
            { 
                name: 'user_id', 
                type: 'linked_record', 
                link_table_id: usersTable.id, 
                link_type: 'one_to_many', 
                reverse_link_name: 'tasks',
                auto_created: false
            }
        ],
        archived_field_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }).select().single();

    if (err2) throw err2;
    console.log("✅ Tabel Tasks berhasil dibuat dengan ID:", tasksTable.id);

    // Update Users table with reverse link field
    const updatedUsersFields = [
        ...usersTable.fields,
        {
            name: 'tasks',
            type: 'linked_record',
            link_table_id: tasksTable.id,
            link_type: 'many_to_one',
            reverse_link_name: 'user_id',
            auto_created: true
        }
    ];
    await supabase.from('app_tables').update({ fields: updatedUsersFields }).eq('id', usersTable.id);

    // 3. Tambahkan Record Dummy
    console.log("3. Menambahkan data dummy...");
    const { data: userRec, error: err3 } = await supabase.from('app_table_records').insert({
        table_id: usersTable.id,
        record_id: 'USER_1',
        data: { username: "budi_santoso", email: "budi@example.com" },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }).select().single();
    if (err3) throw err3;

    const { data: taskRec, error: err4 } = await supabase.from('app_table_records').insert({
        table_id: tasksTable.id,
        record_id: 'TASK_101',
        data: { title: "Mengerjakan Laporan", status: "pending", user_id: [userRec.id] },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }).select().single();
    if (err4) throw err4;
    
    // Update reciprocal link
    await supabase.from('app_table_records').update({
        data: { ...userRec.data, tasks: [taskRec.id] }
    }).eq('id', userRec.id);

    console.log("✅ Data dummy berhasil ditambahkan!");
    console.log("Selesai! Silakan refresh halaman Table Manager di aplikasi Anda.");
}

run().catch(err => {
    console.error("Terjadi kesalahan:", err);
});
