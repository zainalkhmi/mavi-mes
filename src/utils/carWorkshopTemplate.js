/**
 * carWorkshopTemplate.js
 * Car Workshop Industry Template
 * Tables: Work_Orders, Service_Items, Vehicle_Inspections, Parts_Used
 * Formulas: Total_Cost, Labor_Total, Parts_Total
 * Automations: Job Complete Notification, Low Parts Alert
 */
export function createCarWorkshopTemplate() {
    const ts = Date.now(), iso = new Date().toISOString();
    const T = { orders: 'tbl_ws_orders', services: 'tbl_ws_services', inspections: 'tbl_ws_inspections', parts: 'tbl_ws_parts' };

    const V = [
        { id:`v1_${ts}`, name:'License_Plate', type:'string', defaultValue:'', persisted:false },
        { id:`v2_${ts}`, name:'Vehicle_Make', type:'string', defaultValue:'', persisted:false },
        { id:`v3_${ts}`, name:'Vehicle_Model', type:'string', defaultValue:'', persisted:false },
        { id:`v4_${ts}`, name:'Vehicle_Year', type:'string', defaultValue:'', persisted:false },
        { id:`v5_${ts}`, name:'Mileage', type:'number', defaultValue:0, persisted:false },
        { id:`v6_${ts}`, name:'Customer_Name', type:'string', defaultValue:'', persisted:false },
        { id:`v7_${ts}`, name:'Customer_Phone', type:'string', defaultValue:'', persisted:false },
        { id:`v8_${ts}`, name:'Technician', type:'string', defaultValue:'@APP_INFO.USER', persisted:true },
        { id:`v9_${ts}`, name:'Service_Type', type:'string', defaultValue:'', persisted:false },
        { id:`v10_${ts}`, name:'Service_Desc', type:'string', defaultValue:'', persisted:false },
        { id:`v11_${ts}`, name:'Labor_Hours', type:'number', defaultValue:0, persisted:false },
        { id:`v12_${ts}`, name:'Labor_Rate', type:'number', defaultValue:150, persisted:false },
        { id:`v13_${ts}`, name:'Part_Name', type:'string', defaultValue:'', persisted:false },
        { id:`v14_${ts}`, name:'Part_Qty', type:'number', defaultValue:1, persisted:false },
        { id:`v15_${ts}`, name:'Part_Price', type:'number', defaultValue:0, persisted:false },
        { id:`v16_${ts}`, name:'WO_Status', type:'string', defaultValue:'OPEN', persisted:true },
        { id:`v17_${ts}`, name:'Priority', type:'string', defaultValue:'Normal', persisted:false },
        { id:`v18_${ts}`, name:'Timestamp', type:'string', defaultValue:'', persisted:false },
        { id:`v19_${ts}`, name:'Insp_Engine', type:'string', defaultValue:'', persisted:false },
        { id:`v20_${ts}`, name:'Insp_Brakes', type:'string', defaultValue:'', persisted:false },
        { id:`v21_${ts}`, name:'Insp_Tires', type:'string', defaultValue:'', persisted:false },
        { id:`v22_${ts}`, name:'Insp_Fluids', type:'string', defaultValue:'', persisted:false },
        { id:`v23_${ts}`, name:'Insp_Lights', type:'string', defaultValue:'', persisted:false },
        { id:`v24_${ts}`, name:'Insp_Suspension', type:'string', defaultValue:'', persisted:false },
        { id:`v25_${ts}`, name:'Insp_Notes', type:'string', defaultValue:'', persisted:false },
        { id:`v26_${ts}`, name:'Bay_Number', type:'string', defaultValue:'Bay 1', persisted:false },
        { id:`v27_${ts}`, name:'VIN', type:'string', defaultValue:'', persisted:false },
        { id:`v28_${ts}`, name:'Engine_Number', type:'string', defaultValue:'', persisted:false },
        { id:`v29_${ts}`, name:'DTC_Codes', type:'string', defaultValue:'[]', persisted:false },
        { id:`v30_${ts}`, name:'DTC_Status', type:'string', defaultValue:'UNCLEARED', persisted:false }
    ];

    const step1 = { id:`s1_${ts}`, title:'1. Registrasi & Check-In', stepType:'Step', components:[
        {id:`s1h_${ts}`,type:'TEXT',x:0,y:0,w:960,h:30,props:{text:'🚗 Registrasi Kendaraan / Vehicle Check-In',fontSize:20,fontWeight:'bold',color:'#1e293b',textAlign:'center'}},
        {id:`s1sub_${ts}`,type:'TEXT',x:0,y:30,w:960,h:18,props:{text:'Scan plat nomor / VIN atau input manual data kendaraan untuk membuat Work Order',fontSize:11,color:'#64748b',textAlign:'center'}},
        // Scanner
        {id:`s1bc_${ts}`,type:'BARCODE_SCANNER',x:40,y:60,w:420,h:150,props:{label:'Scan Plat Nomor / VIN Barcode',targetVariable:'License_Plate'}},
        // Vehicle fields
        {id:`s1lp_${ts}`,type:'TEXT_INPUT',x:490,y:60,w:210,h:42,props:{label:'Plat Nomor / License Plate',targetVariable:'License_Plate',required:true,fontSize:14,fontWeight:'bold'}},
        {id:`s1vin_${ts}`,type:'TEXT_INPUT',x:710,y:60,w:210,h:42,props:{label:'No. VIN / Rangka',targetVariable:'VIN',placeholder:'17 digit...'}},
        {id:`s1mk_${ts}`,type:'TEXT_INPUT',x:490,y:115,w:210,h:42,props:{label:'Merek / Make',targetVariable:'Vehicle_Make',placeholder:'Toyota'}},
        {id:`s1md_${ts}`,type:'TEXT_INPUT',x:710,y:115,w:210,h:42,props:{label:'Model / Type',targetVariable:'Vehicle_Model',placeholder:'Avanza'}},
        {id:`s1yr_${ts}`,type:'TEXT_INPUT',x:490,y:170,w:210,h:42,props:{label:'Tahun / Year',targetVariable:'Vehicle_Year',placeholder:'2024'}},
        {id:`s1ml_${ts}`,type:'TEXT_INPUT',x:710,y:170,w:210,h:42,props:{label:'Odometer (km)',targetVariable:'Mileage',inputType:'number'}},
        // Customer info header
        {id:`s1ch_${ts}`,type:'TEXT',x:40,y:230,w:880,h:20,props:{text:'👤 Data Pelanggan & Penugasan Teknisi',fontSize:13,fontWeight:'bold',color:'#1e40af'}},
        {id:`s1cn_${ts}`,type:'TEXT_INPUT',x:40,y:255,w:280,h:42,props:{label:'Nama Pelanggan / Customer Name',targetVariable:'Customer_Name',required:true}},
        {id:`s1cp_${ts}`,type:'TEXT_INPUT',x:340,y:255,w:280,h:42,props:{label:'No. Telepon / Phone',targetVariable:'Customer_Phone'}},
        {id:`s1tc_${ts}`,type:'TEXT_INPUT',x:640,y:255,w:280,h:42,props:{label:'Teknisi / Technician',targetVariable:'Technician'}},
        // Priority & Bay
        {id:`s1pr_${ts}`,type:'RADIO_GROUP',x:40,y:315,w:440,h:50,props:{label:'Prioritas Pekerjaan',options:['Normal','Urgent','Emergency'],targetVariable:'Priority'}},
        {id:`s1by_${ts}`,type:'RADIO_GROUP',x:500,y:315,w:420,h:50,props:{label:'Bay Servis / Work Area',options:['Bay 1 (General)','Bay 2 (Engine)','Bay 3 (Electrical)','Bay 4 (Suspension)'],targetVariable:'Bay_Number'}},
        // Start WO
        {id:`s1btn_${ts}`,type:'BUTTON',x:160,y:385,w:640,h:45,props:{label:'🔧 BUAT WORK ORDER →',text:'🔧 BUAT WORK ORDER →',backgroundColor:'#dc2626',color:'white',fontSize:16,fontWeight:'bold',
            triggers:[{name:'CreateWO',event:'ON_CLICK',actions:[
                {type:'SET_VARIABLE',payload:{variable:'Timestamp',valueType:'EXPRESSION',value:'new Date().toISOString()'}},
                {type:'SET_VARIABLE',payload:{variable:'WO_Status',value:'OPEN'}},
                {type:'TABLE_RECORD_CREATE',payload:{placeholderId:`rp_wo_${ts}`}},
                {type:'SHOW_MESSAGE',payload:{message:'✅ Work Order created → Workshop_Orders',msgType:'success'}},
                {type:'NEXT_STEP'}
            ]}]}}
    ]};

    const step2 = { id:`s2_${ts}`, title:'2. Diagnostik OBD-II', stepType:'Step', components:[
        {id:`s2h_${ts}`,type:'TEXT',x:0,y:0,w:960,h:30,props:{text:'🔌 Sistem Diagnostik OBD-II & DTC',fontSize:18,fontWeight:'bold',color:'#dc2626',textAlign:'center'}},
        {id:`s2sub_${ts}`,type:'TEXT',x:0,y:30,w:960,h:18,props:{text:'Sambungkan OBD-II scanner untuk memantau sensor mesin secara live dan menghapus DTC (trouble codes)',fontSize:11,color:'#64748b',textAlign:'center'}},
        // Scanner
        {id:`s2scan_${ts}`,type:'OBD2_SCANNER',x:40,y:60,w:420,h:90,props:{label:'OBD2 Bluetooth Scanner',transport:'BLUETOOTH'}},
        // DTC list
        {id:`s2dtc_${ts}`,type:'OBD2_DTC',x:40,y:165,w:420,h:145,props:{label:'Diagnostic Trouble Codes (DTC)',pid:'DTC'}},
        // Clear DTC button
        {id:`s2clear_${ts}`,type:'OBD2_CLEAR_DTC',x:40,y:325,w:420,h:45,props:{label:'HAPUS DTC (CLEAR ERROR CODES)',action:'CLEAR_DTC'}},
        // Gauges right side
        {id:`s2rpm_${ts}`,type:'OBD2_RPM',x:490,y:60,w:210,h:85,props:{label:'Engine RPM',pid:'010C'}},
        {id:`s2spd_${ts}`,type:'OBD2_SPEED',x:710,y:60,w:210,h:85,props:{label:'Vehicle Speed',pid:'010D'}},
        {id:`s2cool_${ts}`,type:'OBD2_COOLANT_TEMP',x:490,y:155,w:210,h:85,props:{label:'Coolant Temp',pid:'0105'}},
        {id:`s2throt_${ts}`,type:'OBD2_THROTTLE',x:710,y:155,w:210,h:85,props:{label:'Throttle Position',pid:'0111'}},
        {id:`s2batt_${ts}`,type:'OBD2_BATTERY_VOLTAGE',x:490,y:250,w:210,h:85,props:{label:'Battery Voltage',pid:'0142'}},
        {id:`s2load_${ts}`,type:'OBD2_ENGINE_LOAD',x:710,y:250,w:210,h:85,props:{label:'Engine Load',pid:'0104'}},
        // Navigation button
        {id:`s2next_${ts}`,type:'BUTTON',x:260,y:385,w:440,h:45,props:{label:'LANJUT KE INSPEKSI FISIK →',text:'LANJUT KE INSPEKSI FISIK →',backgroundColor:'#2563eb',color:'white',fontSize:14,fontWeight:'bold',
            triggers:[{name:'GoInspStep',event:'ON_CLICK',actions:[{type:'NEXT_STEP'}]}]}}
    ]};

    const step3 = { id:`s3_${ts}`, title:'3. Inspeksi Fisik', stepType:'Step', components:[
        {id:`s3h_${ts}`,type:'TEXT',x:0,y:0,w:960,h:28,props:{text:'🔍 Multi-Point Vehicle Physical Inspection',fontSize:18,fontWeight:'bold',color:'#7c3aed',textAlign:'center'}},
        {id:`s3sub_${ts}`,type:'TEXT',x:0,y:28,w:960,h:16,props:{text:'Periksa komponen mekanis & fisik kendaraan — disimpan ke tabel Vehicle_Inspections',fontSize:10,color:'#64748b',textAlign:'center'}},
        // left column
        {id:`s3e_${ts}`,type:'RADIO_GROUP',x:20,y:55,w:440,h:42,props:{label:'🔧 Ruang Mesin / Engine & Transmission',options:['✅ Lolos / Good','⚠️ Butuh Perhatian','❌ Rusak / Poor','🔄 N/A'],targetVariable:'Insp_Engine'}},
        {id:`s3b_${ts}`,type:'RADIO_GROUP',x:20,y:110,w:440,h:42,props:{label:'🛑 Sistem Rem & Rotor / Brakes',options:['✅ Lolos / Good','⚠️ Butuh Perhatian','❌ Rusak / Poor','🔄 N/A'],targetVariable:'Insp_Brakes'}},
        {id:`s3t_${ts}`,type:'RADIO_GROUP',x:20,y:165,w:440,h:42,props:{label:'🛞 Ban & Kelurusan Roda / Tires',options:['✅ Lolos / Good','⚠️ Butuh Perhatian','❌ Rusak / Poor','🔄 N/A'],targetVariable:'Insp_Tires'}},
        // right column
        {id:`s3f_${ts}`,type:'RADIO_GROUP',x:500,y:55,w:440,h:42,props:{label:'💧 Kebocoran & Level Oli / Fluids',options:['✅ Lolos / Good','⚠️ Butuh Perhatian','❌ Rusak / Poor','🔄 N/A'],targetVariable:'Insp_Fluids'}},
        {id:`s3l_${ts}`,type:'RADIO_GROUP',x:500,y:110,w:440,h:42,props:{label:'💡 Lampu & Kelistrikan Bodi / Lights',options:['✅ Lolos / Good','⚠️ Butuh Perhatian','❌ Rusak / Poor','🔄 N/A'],targetVariable:'Insp_Lights'}},
        {id:`s3s_${ts}`,type:'RADIO_GROUP',x:500,y:165,w:440,h:42,props:{label:'🔩 Kaki-Kaki & Suspensi / Suspension',options:['✅ Lolos / Good','⚠️ Butuh Perhatian','❌ Rusak / Poor','🔄 N/A'],targetVariable:'Insp_Suspension'}},
        // Notes
        {id:`s3n_${ts}`,type:'TEXT_INPUT',x:20,y:225,w:920,h:50,props:{label:'Catatan & Rekomendasi Inspektur / Inspection Findings',targetVariable:'Insp_Notes',placeholder:'Ketik temuan inspeksi...',multiline:true}},
        // Photo
        {id:`s3ph_${ts}`,type:'IMAGE_CAPTURE',x:20,y:290,w:440,h:50,props:{label:'📷 Foto Kendaraan / Capture Photo',targetVariable:'Vehicle_Photo'}},
        // Save
        {id:`s3sv_${ts}`,type:'BUTTON',x:160,y:355,w:640,h:50,props:{label:'💾 SIMPAN HASIL INSPEKSI & LANJUT →',text:'💾 SIMPAN HASIL INSPEKSI & LANJUT →',backgroundColor:'#7c3aed',color:'white',fontSize:16,fontWeight:'bold',
            triggers:[{name:'SaveInsp',event:'ON_CLICK',actions:[
                {type:'SET_VARIABLE',payload:{variable:'Timestamp',valueType:'EXPRESSION',value:'new Date().toISOString()'}},
                {type:'TABLE_RECORD_CREATE',payload:{placeholderId:`rp_insp_${ts}`}},
                {type:'SHOW_MESSAGE',payload:{message:'✅ Inspeksi fisik disimpan → Vehicle_Inspections',msgType:'success'}},
                {type:'NEXT_STEP'}
            ]}]}}
    ]};

    const step4 = { id:`s4_${ts}`, title:'4. Pekerjaan & Part', stepType:'Step', components:[
        {id:`s4h_${ts}`,type:'TEXT',x:0,y:0,w:960,h:28,props:{text:'🔧 Layanan & Penggunaan Suku Cadang',fontSize:18,fontWeight:'bold',color:'#dc2626'}},
        // Vehicle badge
        {id:`s4vb_${ts}`,type:'TEXT_INPUT',x:0,y:30,w:180,h:25,props:{label:'',targetVariable:'License_Plate',readOnly:true,dataSourceType:'VARIABLE',varSource:'License_Plate',fontSize:14,fontWeight:'bold'}},
        {id:`s4vm_${ts}`,type:'TEXT_INPUT',x:190,y:30,w:200,h:25,props:{label:'',targetVariable:'Vehicle_Make',readOnly:true,dataSourceType:'VARIABLE',varSource:'Vehicle_Make',fontSize:12}},
        {id:`s4vs_${ts}`,type:'TEXT_INPUT',x:400,y:30,w:120,h:25,props:{label:'',targetVariable:'WO_Status',readOnly:true,fontSize:12,fontWeight:'bold'}},
        // LEFT: Add Service
        {id:`s4sh_${ts}`,type:'TEXT',x:0,y:65,w:460,h:20,props:{text:'➕ Tambah Jasa Service / Add Labor',fontSize:12,fontWeight:'bold',color:'#1e40af'}},
        {id:`s4st_${ts}`,type:'RADIO_GROUP',x:0,y:88,w:460,h:40,props:{label:'Tipe Service',options:['Oil Change','Brake Service','Tune Up','Engine Repair','AC Service','DTC Diagnostic','General Repair'],targetVariable:'Service_Type',fontSize:10}},
        {id:`s4sd_${ts}`,type:'TEXT_INPUT',x:0,y:138,w:280,h:35,props:{label:'Deskripsi',targetVariable:'Service_Desc',placeholder:'Detail perbaikan...'}},
        {id:`s4lh_${ts}`,type:'TEXT_INPUT',x:290,y:138,w:80,h:35,props:{label:'Jam',targetVariable:'Labor_Hours',inputType:'number'}},
        {id:`s4lr_${ts}`,type:'TEXT_INPUT',x:380,y:138,w:80,h:35,props:{label:'Rate/Jam ($)',targetVariable:'Labor_Rate',inputType:'number'}},
        {id:`s4sb_${ts}`,type:'BUTTON',x:0,y:182,w:460,h:32,props:{label:'💾 Simpan Jasa Service',text:'💾 Simpan Jasa Service',backgroundColor:'#2563eb',color:'white',fontSize:13,fontWeight:'bold',
            triggers:[{name:'AddSvc',event:'ON_CLICK',actions:[
                {type:'SET_VARIABLE',payload:{variable:'Timestamp',valueType:'EXPRESSION',value:'new Date().toISOString()'}},
                {type:'TABLE_RECORD_CREATE',payload:{placeholderId:`rp_svc_${ts}`}},
                {type:'SHOW_MESSAGE',payload:{message:'✅ Jasa service ditambahkan → Service_Items',msgType:'success'}}
            ]}]}},
        // LEFT: Add Part
        {id:`s4ph_${ts}`,type:'TEXT',x:0,y:225,w:460,h:20,props:{text:'🔩 Tambah Suku Cadang / Add Parts Used',fontSize:12,fontWeight:'bold',color:'#ea580c'}},
        {id:`s4pn_${ts}`,type:'TEXT_INPUT',x:0,y:248,w:180,h:35,props:{label:'Nama Part',targetVariable:'Part_Name',placeholder:'Filter Oli / Kampas Rem'}},
        {id:`s4pq_${ts}`,type:'TEXT_INPUT',x:190,y:248,w:70,h:35,props:{label:'Qty',targetVariable:'Part_Qty',inputType:'number'}},
        {id:`s4pp_${ts}`,type:'TEXT_INPUT',x:270,y:248,w:90,h:35,props:{label:'Harga ($)',targetVariable:'Part_Price',inputType:'number'}},
        {id:`s4ppb_${ts}`,type:'BUTTON',x:370,y:253,w:90,h:30,props:{label:'Tambah Part',text:'Tambah Part',backgroundColor:'#ea580c',color:'white',fontSize:11,fontWeight:'bold',
            triggers:[{name:'AddPart',event:'ON_CLICK',actions:[
                {type:'TABLE_RECORD_CREATE',payload:{placeholderId:`rp_part_${ts}`}},
                {type:'SHOW_MESSAGE',payload:{message:'🔩 Suku cadang ditambahkan → Parts_Used',msgType:'success'}}
            ]}]}},
        // RIGHT: Service log table
        {id:`s4th_${ts}`,type:'TEXT',x:480,y:65,w:480,h:20,props:{text:'📋 Rincian Jasa & Part',fontSize:12,fontWeight:'bold',color:'#334155'}},
        {id:`s4tbl_${ts}`,type:'INTERACTIVE_TABLE',x:480,y:88,w:480,h:120,props:{tableId:T.services,label:'Jasa Service',visibleColumns:['Service_Type','Description','Labor_Hours','Labor_Cost'],fontSize:10}},
        {id:`s4ptbl_${ts}`,type:'INTERACTIVE_TABLE',x:480,y:215,w:480,h:80,props:{tableId:T.parts,label:'Suku Cadang',visibleColumns:['Part_Name','Qty','Unit_Price','Line_Total'],fontSize:10}},
        // Bottom Navigation
        {id:`s4back_${ts}`,type:'BUTTON',x:0,y:320,w:310,h:40,props:{label:'🔌 Kembali ke OBD-II / Inspeksi',text:'🔌 Kembali ke OBD-II / Inspeksi',backgroundColor:'#475569',color:'white',fontSize:13,fontWeight:'bold',
            triggers:[{name:'GoBack',event:'ON_CLICK',actions:[{type:'PREV_STEP'}]}]}},
        {id:`s4fin_${ts}`,type:'BUTTON',x:650,y:320,w:310,h:40,props:{label:'📋 Lanjut ke Rincian & Invoice →',text:'📋 Lanjut ke Rincian & Invoice →',backgroundColor:'#16a34a',color:'white',fontSize:13,fontWeight:'bold',
            triggers:[{name:'GoInvoice',event:'ON_CLICK',actions:[
                {type:'SET_VARIABLE',payload:{variable:'WO_Status',value:'INVOICED'}},
                {type:'NEXT_STEP'}
            ]}]}}
    ]};

    const step5 = { id:`s5_${ts}`, title:'5. Invoice & Penyerahan', stepType:'Step', components:[
        {id:`s5h_${ts}`,type:'TEXT',x:50,y:10,w:860,h:30,props:{text:'📋 Ringkasan Pekerjaan & Rincian Invoice',fontSize:20,fontWeight:'bold',color:'#0f172a',textAlign:'center'}},
        {id:`s5sub_${ts}`,type:'TEXT',x:50,y:40,w:860,h:16,props:{text:'Tinjau jasa perbaikan, suku cadang terpakai, dan hasil inspeksi sebelum menyelesaikan pekerjaan',fontSize:11,color:'#64748b',textAlign:'center'}},
        // Badges
        {id:`s5lp_${ts}`,type:'TEXT_INPUT',x:50,y:70,w:150,h:38,props:{label:'Plat Nomor',targetVariable:'License_Plate',readOnly:true,dataSourceType:'VARIABLE',varSource:'License_Plate',fontSize:15,fontWeight:'bold'}},
        {id:`s5mk_${ts}`,type:'TEXT_INPUT',x:220,y:70,w:180,h:38,props:{label:'Merek & Model',targetVariable:'Vehicle_Make',readOnly:true,dataSourceType:'VARIABLE',varSource:'Vehicle_Make'}},
        {id:`s5vin_${ts}`,type:'TEXT_INPUT',x:420,y:70,w:180,h:38,props:{label:'Nomor VIN',targetVariable:'VIN',readOnly:true,dataSourceType:'VARIABLE',varSource:'VIN'}},
        {id:`s5cn_${ts}`,type:'TEXT_INPUT',x:620,y:70,w:150,h:38,props:{label:'Customer',targetVariable:'Customer_Name',readOnly:true,dataSourceType:'VARIABLE',varSource:'Customer_Name'}},
        {id:`s5sts_${ts}`,type:'TEXT_INPUT',x:790,y:70,w:120,h:38,props:{label:'Status',targetVariable:'WO_Status',readOnly:true,dataSourceType:'VARIABLE',varSource:'WO_Status',fontWeight:'bold'}},
        // Tables
        {id:`s5st_${ts}`,type:'TEXT',x:50,y:118,w:400,h:18,props:{text:'🔧 Jasa Perbaikan / Services Performed',fontSize:12,fontWeight:'bold',color:'#1e40af'}},
        {id:`s5stbl_${ts}`,type:'INTERACTIVE_TABLE',x:50,y:135,w:860,h:90,props:{tableId:T.services,label:'Jasa Service',visibleColumns:['Service_Type','Description','Labor_Hours','Labor_Cost'],fontSize:11}},
        {id:`s5pt_${ts}`,type:'TEXT',x:50,y:235,w:400,h:18,props:{text:'🔩 Suku Cadang Terpakai / Parts Used',fontSize:12,fontWeight:'bold',color:'#ea580c'}},
        {id:`s5ptbl_${ts}`,type:'INTERACTIVE_TABLE',x:50,y:252,w:860,h:70,props:{tableId:T.parts,label:'Suku Cadang',visibleColumns:['Part_Name','Qty','Unit_Price','Line_Total'],fontSize:11}},
        // Close status choice & button
        {id:`s5fsts_${ts}`,type:'RADIO_GROUP',x:50,y:330,w:860,h:40,props:{label:'Status Akhir Penyerahan / Final Status',options:['COMPLETED','WAITING_PARTS','CUSTOMER_PICKUP','WARRANTY'],targetVariable:'WO_Status'}},
        {id:`s5btn_${ts}`,type:'BUTTON',x:200,y:385,w:560,h:45,props:{label:'✅ TUTUP WORK ORDER & SERAHKAN KENDARAAN',text:'✅ TUTUP WORK ORDER & SERAHKAN KENDARAAN',backgroundColor:'#16a34a',color:'white',fontSize:16,fontWeight:'bold',
            triggers:[{name:'Close',event:'ON_CLICK',actions:[
                {type:'SET_VARIABLE',payload:{variable:'Timestamp',valueType:'EXPRESSION',value:'new Date().toISOString()'}},
                {type:'TABLE_RECORD_CREATE',payload:{placeholderId:`rp_wo_final_${ts}`}},
                {type:'SHOW_MESSAGE',payload:{message:'✅ Work Order ditutup! Pelanggan telah dinotifikasi. Rincian invoice tersimpan.',msgType:'success'}},
                {type:'COMPLETE_APP'}
            ]}]}}
    ]};

    const automations = [
        { id:`auto_jc_${ts}`, name:'Job Complete Notification', description:'Notify customer when WO status changes to COMPLETED',
          active:true, triggers:[{id:`t1_${ts}`,type:'TABLE_ROW_UPDATED',config:{tableId:T.orders,condition:{field:'WO_Status',operator:'==',value:'COMPLETED'}}}],
          nodes:[
            {id:'start',type:'event',position:{x:250,y:50},data:{label:'WO Updated'}},
            {id:'check',type:'decision',position:{x:250,y:180},data:{label:'Status=COMPLETED?',condition:{field:'WO_Status',operator:'==',value:'COMPLETED'}}},
            {id:'notify',type:'action',position:{x:250,y:320},data:{type:'SEND_NOTIFICATION',recipient:'customer',message:'Your vehicle is ready for pickup!'}},
            {id:'log',type:'action',position:{x:250,y:440},data:{type:'LOG_MESSAGE',message:'Customer notified: vehicle ready'}}
          ],
          edges:[{source:'start',target:'check'},{source:'check',target:'notify',sourceHandle:'yes'},{source:'notify',target:'log',sourceHandle:'success'}]
        },
        { id:`auto_lp_${ts}`, name:'Low Parts Stock Alert', description:'Alert when part stock drops below 5 units',
          active:true, triggers:[{id:`t2_${ts}`,type:'TABLE_ROW_UPDATED',config:{tableId:T.parts,condition:{field:'Stock_Qty',operator:'<',value:'5'}}}],
          actions:[{type:'SEND_NOTIFICATION',recipient:'parts_manager@workshop.com',message:'LOW STOCK: Part below minimum threshold!'},{type:'LOG_MESSAGE',message:'Low parts stock alert triggered'}]
        }
    ];

    const functions = [
        { id:`fn_lc_${ts}`, name:'Calc_Labor_Cost', description:'Labor_Hours × Labor_Rate', type:'function', active:true,
          triggers:[{id:`ft1_${ts}`,type:'TABLE_ROW_ADDED',config:{tableId:T.services}}],
          nodes:[
            {id:'start',type:'functionCall',position:{x:250,y:50},data:{}},
            {id:'calc',type:'expression',position:{x:250,y:180},data:{expression:'Labor_Hours * Labor_Rate',outputVar:'Labor_Cost'}},
            {id:'done',type:'action',position:{x:250,y:320},data:{type:'LOG_MESSAGE',message:'Labor cost calculated'}}
          ],
          edges:[{source:'start',target:'calc'},{source:'calc',target:'done',sourceHandle:'success'}]
        }
    ];

    return {
        id:`app_ws_${ts}`, name:'Car Workshop Pro',
        description:'Complete car workshop management with multi-table linked records, OBD-II vehicle diagnostics, physical inspection, invoicing, formulas & automations',
        category:'Automotive', type:'FRONT-LINE', published:true, approvalStatus:'APPROVED',
        createdAt:iso, updatedAt:iso,
        config:{
            appVariables:V,
            recordPlaceholders:[
                {id:`rp_wo_${ts}`,name:'WO_Record',tableId:T.orders,description:'Work order'},
                {id:`rp_svc_${ts}`,name:'Service_Record',tableId:T.services,description:'Service item'},
                {id:`rp_part_${ts}`,name:'Part_Record',tableId:T.parts,description:'Part used'},
                {id:`rp_insp_${ts}`,name:'Inspection_Record',tableId:T.inspections,description:'Vehicle inspection'},
                {id:`rp_wo_final_${ts}`,name:'WO_Final',tableId:T.orders,description:'Final WO update'}
            ],
            appTables:[T.orders,T.services,T.inspections,T.parts],
            appTriggers:[{id:`trg_${ts}`,name:'Workshop Start',event:'ON_APP_START',actions:[{type:'SHOW_MESSAGE',payload:{message:'🚗 Car Workshop Pro — Ready',msgType:'info'}}]}],
            steps:[step1,step2,step3,step4,step5],
            automations, functions,
            linkedTables:{
                orders:{placeholder:T.orders,description:'Master work orders'},
                services:{placeholder:T.services,description:'Service items linked to WO',linkedTo:T.orders},
                inspections:{placeholder:T.inspections,description:'Multi-point inspections linked to WO',linkedTo:T.orders},
                parts:{placeholder:T.parts,description:'Parts used linked to WO',linkedTo:T.orders}
            }
        }
    };
}
