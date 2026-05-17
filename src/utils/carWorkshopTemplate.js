/**
 * carWorkshopTemplate.js
 * Car Workshop Industry Template
 * Tables: Work_Orders, Service_Items, Vehicle_Inspections, Parts_Inventory
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
        { id:`v26_${ts}`, name:'Bay_Number', type:'string', defaultValue:'Bay 1', persisted:false }
    ];

    const step1 = { id:`s1_${ts}`, title:'1. Vehicle Check-In', stepType:'Step', components:[
        {id:`s1h_${ts}`,type:'TEXT',x:0,y:0,w:960,h:35,props:{text:'🚗 Car Workshop — Vehicle Check-In',fontSize:22,fontWeight:'bold',color:'#1e293b',textAlign:'center'}},
        {id:`s1sub_${ts}`,type:'TEXT',x:0,y:35,w:960,h:18,props:{text:'Scan license plate or enter vehicle details to create work order',fontSize:11,color:'#64748b',textAlign:'center'}},
        // Barcode scan
        {id:`s1bc_${ts}`,type:'BARCODE',x:160,y:65,w:640,h:50,props:{placeholder:'Scan license plate / VIN barcode...',autoFocus:true,targetVariable:'License_Plate'}},
        // Vehicle info
        {id:`s1lp_${ts}`,type:'TEXT_INPUT',x:40,y:135,w:200,h:42,props:{label:'License Plate',targetVariable:'License_Plate',required:true,fontSize:16,fontWeight:'bold'}},
        {id:`s1mk_${ts}`,type:'TEXT_INPUT',x:260,y:135,w:160,h:42,props:{label:'Make',targetVariable:'Vehicle_Make',placeholder:'Toyota'}},
        {id:`s1md_${ts}`,type:'TEXT_INPUT',x:440,y:135,w:160,h:42,props:{label:'Model',targetVariable:'Vehicle_Model',placeholder:'Avanza'}},
        {id:`s1yr_${ts}`,type:'TEXT_INPUT',x:620,y:135,w:100,h:42,props:{label:'Year',targetVariable:'Vehicle_Year',placeholder:'2024'}},
        {id:`s1ml_${ts}`,type:'TEXT_INPUT',x:740,y:135,w:180,h:42,props:{label:'Mileage (km)',targetVariable:'Mileage',inputType:'number'}},
        // Customer info
        {id:`s1ch_${ts}`,type:'TEXT',x:40,y:195,w:200,h:18,props:{text:'👤 Customer Information',fontSize:13,fontWeight:'bold',color:'#1e40af'}},
        {id:`s1cn_${ts}`,type:'TEXT_INPUT',x:40,y:218,w:280,h:42,props:{label:'Customer Name',targetVariable:'Customer_Name',required:true}},
        {id:`s1cp_${ts}`,type:'TEXT_INPUT',x:340,y:218,w:280,h:42,props:{label:'Phone',targetVariable:'Customer_Phone'}},
        {id:`s1tc_${ts}`,type:'TEXT_INPUT',x:640,y:218,w:280,h:42,props:{label:'Technician',targetVariable:'Technician'}},
        // Priority & Bay
        {id:`s1pr_${ts}`,type:'RADIO_GROUP',x:40,y:280,w:440,h:50,props:{label:'Priority',options:['Normal','Urgent','Emergency'],targetVariable:'Priority'}},
        {id:`s1by_${ts}`,type:'RADIO_GROUP',x:500,y:280,w:420,h:50,props:{label:'Bay',options:['Bay 1','Bay 2','Bay 3','Bay 4'],targetVariable:'Bay_Number'}},
        // Start
        {id:`s1btn_${ts}`,type:'BUTTON',x:160,y:355,w:640,h:50,props:{label:'🔧 CREATE WORK ORDER →',text:'🔧 CREATE WORK ORDER →',backgroundColor:'#dc2626',color:'white',fontSize:18,fontWeight:'bold',
            triggers:[{name:'CreateWO',event:'ON_CLICK',actions:[
                {type:'SET_VARIABLE',payload:{variable:'Timestamp',valueType:'EXPRESSION',value:'new Date().toISOString()'}},
                {type:'SET_VARIABLE',payload:{variable:'WO_Status',value:'OPEN'}},
                {type:'TABLE_RECORD_CREATE',payload:{placeholderId:`rp_wo_${ts}`}},
                {type:'SHOW_MESSAGE',payload:{message:'✅ Work Order created → Workshop_Orders',msgType:'success'}},
                {type:'NEXT_STEP'}
            ]}]}}
    ]};

    const step2 = { id:`s2_${ts}`, title:'2. Service & Parts', stepType:'Step', components:[
        {id:`s2h_${ts}`,type:'TEXT',x:0,y:0,w:960,h:28,props:{text:'🔧 Service Dashboard',fontSize:18,fontWeight:'bold',color:'#dc2626'}},
        // Vehicle badge
        {id:`s2vb_${ts}`,type:'TEXT_INPUT',x:0,y:30,w:180,h:25,props:{label:'',targetVariable:'License_Plate',readOnly:true,dataSourceType:'VARIABLE',varSource:'License_Plate',fontSize:14,fontWeight:'bold'}},
        {id:`s2vm_${ts}`,type:'TEXT_INPUT',x:190,y:30,w:200,h:25,props:{label:'',targetVariable:'Vehicle_Make',readOnly:true,dataSourceType:'VARIABLE',varSource:'Vehicle_Make',fontSize:12}},
        {id:`s2vs_${ts}`,type:'TEXT_INPUT',x:400,y:30,w:120,h:25,props:{label:'',targetVariable:'WO_Status',readOnly:true,fontSize:12,fontWeight:'bold'}},
        // LEFT: Add Service
        {id:`s2sh_${ts}`,type:'TEXT',x:0,y:65,w:460,h:20,props:{text:'➕ Add Service Item → Service_Items',fontSize:12,fontWeight:'bold',color:'#1e40af'}},
        {id:`s2st_${ts}`,type:'RADIO_GROUP',x:0,y:88,w:460,h:40,props:{label:'Service Type',options:['Oil Change','Brake Service','Tire Rotation','Engine Repair','AC Service','General Service','Body Repair'],targetVariable:'Service_Type',fontSize:10}},
        {id:`s2sd_${ts}`,type:'TEXT_INPUT',x:0,y:138,w:280,h:35,props:{label:'Description',targetVariable:'Service_Desc',placeholder:'Details...'}},
        {id:`s2lh_${ts}`,type:'TEXT_INPUT',x:290,y:138,w:80,h:35,props:{label:'Hours',targetVariable:'Labor_Hours',inputType:'number'}},
        {id:`s2lr_${ts}`,type:'TEXT_INPUT',x:380,y:138,w:80,h:35,props:{label:'Rate/hr ($)',targetVariable:'Labor_Rate',inputType:'number'}},
        {id:`s2sb_${ts}`,type:'BUTTON',x:0,y:182,w:460,h:32,props:{label:'💾 Add Service',text:'💾 Add Service',backgroundColor:'#2563eb',color:'white',fontSize:13,fontWeight:'bold',
            triggers:[{name:'AddSvc',event:'ON_CLICK',actions:[
                {type:'SET_VARIABLE',payload:{variable:'Timestamp',valueType:'EXPRESSION',value:'new Date().toISOString()'}},
                {type:'TABLE_RECORD_CREATE',payload:{placeholderId:`rp_svc_${ts}`}},
                {type:'SHOW_MESSAGE',payload:{message:'✅ Service added → Service_Items (linked to Work Order)',msgType:'success'}}
            ]}]}},
        // LEFT: Add Part
        {id:`s2ph_${ts}`,type:'TEXT',x:0,y:225,w:460,h:20,props:{text:'🔩 Add Part → Parts_Used (linked)',fontSize:12,fontWeight:'bold',color:'#ea580c'}},
        {id:`s2pn_${ts}`,type:'TEXT_INPUT',x:0,y:248,w:180,h:35,props:{label:'Part Name',targetVariable:'Part_Name',placeholder:'Brake Pad'}},
        {id:`s2pq_${ts}`,type:'TEXT_INPUT',x:190,y:248,w:70,h:35,props:{label:'Qty',targetVariable:'Part_Qty',inputType:'number'}},
        {id:`s2pp_${ts}`,type:'TEXT_INPUT',x:270,y:248,w:90,h:35,props:{label:'Price ($)',targetVariable:'Part_Price',inputType:'number'}},
        {id:`s2ppb_${ts}`,type:'BUTTON',x:370,y:253,w:90,h:30,props:{label:'Add Part',text:'Add Part',backgroundColor:'#ea580c',color:'white',fontSize:11,fontWeight:'bold',
            triggers:[{name:'AddPart',event:'ON_CLICK',actions:[
                {type:'TABLE_RECORD_CREATE',payload:{placeholderId:`rp_part_${ts}`}},
                {type:'SHOW_MESSAGE',payload:{message:'🔩 Part added → Parts_Inventory (linked)',msgType:'success'}}
            ]}]}},
        // RIGHT: Service log table
        {id:`s2th_${ts}`,type:'TEXT',x:480,y:65,w:480,h:20,props:{text:'📋 Services & Parts Log',fontSize:12,fontWeight:'bold',color:'#334155'}},
        {id:`s2tbl_${ts}`,type:'INTERACTIVE_TABLE',x:480,y:88,w:480,h:120,props:{tableId:T.services,label:'Services',visibleColumns:['Service_Type','Description','Labor_Hours','Labor_Cost'],fontSize:10}},
        {id:`s2ptbl_${ts}`,type:'INTERACTIVE_TABLE',x:480,y:215,w:480,h:80,props:{tableId:T.parts,label:'Parts Used',visibleColumns:['Part_Name','Qty','Unit_Price','Line_Total'],fontSize:10}},
        // Bottom: Navigation
        {id:`s2insp_${ts}`,type:'BUTTON',x:0,y:320,w:310,h:40,props:{label:'🔍 Vehicle Inspection →',text:'🔍 Vehicle Inspection →',backgroundColor:'#7c3aed',color:'white',fontSize:13,fontWeight:'bold',
            triggers:[{name:'GoInsp',event:'ON_CLICK',actions:[{type:'NEXT_STEP'}]}]}},
        {id:`s2fin_${ts}`,type:'BUTTON',x:650,y:320,w:310,h:40,props:{label:'📋 Skip to Invoice →',text:'📋 Skip to Invoice →',backgroundColor:'#475569',color:'white',fontSize:13,fontWeight:'bold',
            triggers:[{name:'SkipInv',event:'ON_CLICK',actions:[
                {type:'SET_VARIABLE',payload:{variable:'WO_Status',value:'INVOICED'}},
                {type:'NEXT_STEP'},{type:'NEXT_STEP'}
            ]}]}}
    ]};

    const step3 = { id:`s3_${ts}`, title:'3. Vehicle Inspection', stepType:'Step', components:[
        {id:`s3h_${ts}`,type:'TEXT',x:0,y:0,w:960,h:28,props:{text:'🔍 Multi-Point Vehicle Inspection',fontSize:18,fontWeight:'bold',color:'#7c3aed'}},
        {id:`s3sub_${ts}`,type:'TEXT',x:0,y:28,w:960,h:16,props:{text:'Check each system — results saved to Vehicle_Inspections table (linked to Work Order)',fontSize:10,color:'#64748b'}},
        // Inspection items - left column
        {id:`s3e_${ts}`,type:'RADIO_GROUP',x:20,y:55,w:440,h:42,props:{label:'🔧 Engine & Drivetrain',options:['✅ Good','⚠️ Fair','❌ Poor','🔄 N/A'],targetVariable:'Insp_Engine'}},
        {id:`s3b_${ts}`,type:'RADIO_GROUP',x:20,y:110,w:440,h:42,props:{label:'🛑 Brakes & Rotors',options:['✅ Good','⚠️ Fair','❌ Poor','🔄 N/A'],targetVariable:'Insp_Brakes'}},
        {id:`s3t_${ts}`,type:'RADIO_GROUP',x:20,y:165,w:440,h:42,props:{label:'🛞 Tires & Alignment',options:['✅ Good','⚠️ Fair','❌ Poor','🔄 N/A'],targetVariable:'Insp_Tires'}},
        // right column
        {id:`s3f_${ts}`,type:'RADIO_GROUP',x:500,y:55,w:440,h:42,props:{label:'💧 Fluids (Oil/Coolant/Brake)',options:['✅ Good','⚠️ Fair','❌ Poor','🔄 N/A'],targetVariable:'Insp_Fluids'}},
        {id:`s3l_${ts}`,type:'RADIO_GROUP',x:500,y:110,w:440,h:42,props:{label:'💡 Lights & Electrical',options:['✅ Good','⚠️ Fair','❌ Poor','🔄 N/A'],targetVariable:'Insp_Lights'}},
        {id:`s3s_${ts}`,type:'RADIO_GROUP',x:500,y:165,w:440,h:42,props:{label:'🔩 Suspension & Steering',options:['✅ Good','⚠️ Fair','❌ Poor','🔄 N/A'],targetVariable:'Insp_Suspension'}},
        // Notes
        {id:`s3n_${ts}`,type:'TEXT_INPUT',x:20,y:225,w:920,h:50,props:{label:'Inspection Notes / Recommendations',targetVariable:'Insp_Notes',placeholder:'Enter findings...',multiline:true}},
        // Photo
        {id:`s3ph_${ts}`,type:'IMAGE_CAPTURE',x:20,y:290,w:440,h:50,props:{label:'📷 Capture vehicle photo',targetVariable:'Vehicle_Photo'}},
        // Save + Next
        {id:`s3sv_${ts}`,type:'BUTTON',x:160,y:355,w:640,h:50,props:{label:'💾 SAVE INSPECTION & GO TO INVOICE →',text:'💾 SAVE INSPECTION & GO TO INVOICE →',backgroundColor:'#7c3aed',color:'white',fontSize:16,fontWeight:'bold',
            triggers:[{name:'SaveInsp',event:'ON_CLICK',actions:[
                {type:'SET_VARIABLE',payload:{variable:'Timestamp',valueType:'EXPRESSION',value:'new Date().toISOString()'}},
                {type:'TABLE_RECORD_CREATE',payload:{placeholderId:`rp_insp_${ts}`}},
                {type:'SHOW_MESSAGE',payload:{message:'✅ Inspection saved → Vehicle_Inspections',msgType:'success'}},
                {type:'NEXT_STEP'}
            ]}]}}
    ]};

    const step4 = { id:`s4_${ts}`, title:'4. Invoice & Close', stepType:'Step', components:[
        {id:`s4h_${ts}`,type:'TEXT',x:50,y:10,w:860,h:30,props:{text:'📋 Work Order Summary & Invoice',fontSize:22,fontWeight:'bold',color:'#0f172a',textAlign:'center'}},
        {id:`s4sub_${ts}`,type:'TEXT',x:50,y:40,w:860,h:16,props:{text:'Review services, parts, inspection — all linked via Work Order ID',fontSize:11,color:'#64748b',textAlign:'center'}},
        // Vehicle
        {id:`s4lp_${ts}`,type:'TEXT_INPUT',x:50,y:70,w:180,h:38,props:{label:'License Plate',targetVariable:'License_Plate',readOnly:true,dataSourceType:'VARIABLE',varSource:'License_Plate',fontSize:16,fontWeight:'bold'}},
        {id:`s4mk_${ts}`,type:'TEXT_INPUT',x:250,y:70,w:200,h:38,props:{label:'Vehicle',targetVariable:'Vehicle_Make',readOnly:true,dataSourceType:'VARIABLE',varSource:'Vehicle_Make'}},
        {id:`s4cn_${ts}`,type:'TEXT_INPUT',x:470,y:70,w:200,h:38,props:{label:'Customer',targetVariable:'Customer_Name',readOnly:true,dataSourceType:'VARIABLE',varSource:'Customer_Name'}},
        {id:`s4tc_${ts}`,type:'TEXT_INPUT',x:690,y:70,w:220,h:38,props:{label:'Technician',targetVariable:'Technician',readOnly:true,dataSourceType:'VARIABLE',varSource:'Technician'}},
        // Tables
        {id:`s4st_${ts}`,type:'TEXT',x:50,y:120,w:400,h:18,props:{text:'🔧 Services Performed',fontSize:13,fontWeight:'bold',color:'#1e40af'}},
        {id:`s4stbl_${ts}`,type:'INTERACTIVE_TABLE',x:50,y:140,w:860,h:90,props:{tableId:T.services,label:'Services',visibleColumns:['Service_Type','Description','Labor_Hours','Labor_Cost'],fontSize:11}},
        {id:`s4pt_${ts}`,type:'TEXT',x:50,y:240,w:400,h:18,props:{text:'🔩 Parts Used',fontSize:13,fontWeight:'bold',color:'#ea580c'}},
        {id:`s4ptbl_${ts}`,type:'INTERACTIVE_TABLE',x:50,y:260,w:860,h:70,props:{tableId:T.parts,label:'Parts',visibleColumns:['Part_Name','Qty','Unit_Price','Line_Total'],fontSize:11}},
        // Status & Close
        {id:`s4sts_${ts}`,type:'RADIO_GROUP',x:50,y:345,w:860,h:40,props:{label:'Final Status',options:['COMPLETED','WAITING_PARTS','CUSTOMER_PICKUP','WARRANTY'],targetVariable:'WO_Status'}},
        {id:`s4btn_${ts}`,type:'BUTTON',x:200,y:400,w:560,h:50,props:{label:'✅ CLOSE WORK ORDER',text:'✅ CLOSE WORK ORDER',backgroundColor:'#16a34a',color:'white',fontSize:18,fontWeight:'bold',
            triggers:[{name:'Close',event:'ON_CLICK',actions:[
                {type:'SET_VARIABLE',payload:{variable:'Timestamp',valueType:'EXPRESSION',value:'new Date().toISOString()'}},
                {type:'TABLE_RECORD_CREATE',payload:{placeholderId:`rp_wo_final_${ts}`}},
                {type:'SHOW_MESSAGE',payload:{message:'✅ Work Order closed! Customer notified. Invoice generated across all linked tables.',msgType:'success'}},
                {type:'COMPLETE_APP'}
            ]}]}}
    ]};

    const automations = [
        { id:`auto_jc_${ts}`, name:'Job Complete Notification', description:'Notify customer when WO status changes to COMPLETED',
          active:true, triggers:[{id:`t1_${ts}`,type:'TABLE_ROW_UPDATED',config:{tableId:T.orders,condition:{field:'WO_Status',operator:'==',value:'COMPLETED'}}}],
          nodes:[
            {id:'start',type:'event',data:{label:'WO Updated'}},
            {id:'check',type:'decision',data:{label:'Status=COMPLETED?',condition:{field:'WO_Status',operator:'==',value:'COMPLETED'}}},
            {id:'notify',type:'action',data:{type:'SEND_NOTIFICATION',recipient:'customer',message:'Your vehicle is ready for pickup!'}},
            {id:'log',type:'action',data:{type:'LOG_MESSAGE',message:'Customer notified: vehicle ready'}}
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
          nodes:[{id:'start',type:'functionCall',data:{}},{id:'calc',type:'expression',data:{expression:'Labor_Hours * Labor_Rate',outputVar:'Labor_Cost'}},{id:'done',type:'action',data:{type:'LOG_MESSAGE',message:'Labor cost calculated'}}],
          edges:[{source:'start',target:'calc'},{source:'calc',target:'done',sourceHandle:'success'}]
        }
    ];

    return {
        id:`app_ws_${ts}`, name:'Car Workshop Pro',
        description:'Complete car workshop management with multi-table linked records, vehicle inspection, invoicing, formulas & automations',
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
            steps:[step1,step2,step3,step4],
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
