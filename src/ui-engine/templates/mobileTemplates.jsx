import React, { useState } from 'react';
import {
  Button, ButtonText, ButtonIcon,
  Input, InputField, InputIcon,
  Textarea, TextareaInput,
  Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectItem,
  Checkbox, CheckboxIndicator, CheckboxLabel,
  Switch,
  Card,
  Badge, BadgeText, BadgeIcon,
  Avatar, AvatarFallbackText, AvatarBadge,
  Modal, ModalBackdrop, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  Tabs, TabsTabList, TabsTab, TabsTabPanels, TabsTabPanel,
  Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionTitleText, AccordionContent, AccordionContentText,
  Alert, AlertIcon, AlertText,
  Progress,
  Spinner,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  FormControl, FormControlLabel, FormControlLabelText, FormControlHelper, FormControlHelperText, FormControlError, FormControlErrorText,
  BottomNavigation, BottomNavigationItem,
  FAB, FabIcon, FabLabel
} from '../components';

import {
  ShieldCheck, AlertTriangle, QrCode, Search, Check, X,
  Camera, ArrowRight, Lock, User, RefreshCw, BarChart2,
  Sliders, Settings, Bell, CheckCircle2, ChevronRight,
  ClipboardCheck, Clock, Eye, AlertCircle, FileText,
  Wrench, Activity, Sparkles, LogOut, CheckCircle, Info
} from 'lucide-react';

// ==========================================
// 1. Mobile Login Template
// ==========================================
export function MobileLoginTemplate({ onLogin }) {
  const [nik, setNik] = useState('OP-4092');
  const [pin, setPin] = useState('1234');
  const [remember, setRemember] = useState(true);

  return (
    <div className="flex flex-col min-h-full p-6 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#0f111a] dark:to-[#1a1c29]">
      <div className="flex flex-col items-center justify-center my-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#714b67] text-white flex items-center justify-center shadow-lg shadow-[#714b67]/30 mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Mandor MES</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sistem Pelaksana Pabrik & Stasiun Kerja</p>
      </div>

      <Card variant="elevated" className="space-y-4">
        <FormControl isRequired>
          <FormControlLabel><FormControlLabelText>ID Operator / NIK</FormControlLabelText></FormControlLabel>
          <Input size="md">
            <InputIcon as={User} />
            <InputField placeholder="Masukkan NIK" value={nik} onChangeText={setNik} />
          </Input>
        </FormControl>

        <FormControl isRequired>
          <FormControlLabel><FormControlLabelText>PIN Keamanan Stasiun</FormControlLabelText></FormControlLabel>
          <Input size="md">
            <InputIcon as={Lock} />
            <InputField placeholder="PIN 4-6 digit" type="password" value={pin} onChangeText={setPin} />
          </Input>
        </FormControl>

        <div className="flex items-center justify-between py-1">
          <Checkbox isChecked={remember} onChange={setRemember} size="sm">
            <CheckboxIndicator />
            <CheckboxLabel>Ingat Stasiun Ini</CheckboxLabel>
          </Checkbox>
          <a href="#forgot" className="text-xs text-[#714b67] font-semibold hover:underline">Lupa PIN?</a>
        </div>

        <Button action="primary" size="lg" className="w-full mt-2" onPress={() => onLogin && onLogin({ nik, pin })}>
          <ButtonText>Masuk ke Stasiun Kerja</ButtonText>
          <ButtonIcon as={ArrowRight} />
        </Button>
      </Card>

      <div className="mt-auto pt-6 text-center text-xs text-slate-400">
        MaviCore UI Engine v2.0 • Stasiun Lini 4
      </div>
    </div>
  );
}

// ==========================================
// 2. Mobile Dashboard Template
// ==========================================
export function MobileDashboardTemplate() {
  return (
    <div className="flex flex-col min-h-full pb-20 bg-slate-50 dark:bg-[#0f111a]">
      {/* Header */}
      <div className="bg-[#714b67] text-white p-5 rounded-b-3xl shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar size="md">
              <AvatarFallbackText>AS</AvatarFallbackText>
              <AvatarBadge />
            </Avatar>
            <div>
              <div className="text-xs opacity-80">Shift 1 • Operator Machining</div>
              <div className="font-bold text-base">Agus Santoso</div>
            </div>
          </div>
          <Badge action="success" size="sm">
            <BadgeText>Lini 2 AKTIF</BadgeText>
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 bg-white/10 p-3 rounded-2xl backdrop-blur-xs text-center">
          <div>
            <div className="text-[10px] opacity-80 uppercase tracking-wide">Target Shift</div>
            <div className="text-lg font-bold">1,200</div>
          </div>
          <div className="border-x border-white/20">
            <div className="text-[10px] opacity-80 uppercase tracking-wide">Aktual</div>
            <div className="text-lg font-bold text-emerald-300">984</div>
          </div>
          <div>
            <div className="text-[10px] opacity-80 uppercase tracking-wide">Defect Rate</div>
            <div className="text-lg font-bold text-rose-300">0.8%</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Progress Shift */}
        <Card variant="elevated" className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span>Target Pencapaian Lini</span>
            <span className="text-[#714b67] dark:text-[#dcbfd3]">82% (984/1200 pcs)</span>
          </div>
          <Progress value={82} size="md" />
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Card variant="outline" className="p-3 text-center cursor-pointer hover:border-[#714b67]">
            <div className="w-10 h-10 mx-auto rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[#714b67] flex items-center justify-center mb-2">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold">Scan QR Part</div>
            <div className="text-[10px] text-slate-400">Verifikasi Lot</div>
          </Card>
          <Card variant="outline" className="p-3 text-center cursor-pointer hover:border-[#008784]">
            <div className="w-10 h-10 mx-auto rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#008784] flex items-center justify-center mb-2">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold">Checksheet QC</div>
            <div className="text-[10px] text-slate-400">12 Item Menunggu</div>
          </Card>
        </div>

        {/* Real-Time Machine Status */}
        <Card variant="elevated" className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm">Status Stasiun CNC-04</h4>
            <Badge action="success" size="sm"><BadgeText>RUNNING</BadgeText></Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
              <div className="text-slate-400 text-[10px]">Suhu Spindle</div>
              <div className="font-semibold text-slate-800 dark:text-slate-100">42.8 °C</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
              <div className="text-slate-400 text-[10px]">Tekanan Oli</div>
              <div className="font-semibold text-slate-800 dark:text-slate-100">145 Bar</div>
            </div>
          </div>
        </Card>
      </div>

      <BottomNavigation>
        <BottomNavigationItem icon={Activity} label="Home" active />
        <BottomNavigationItem icon={QrCode} label="Scan" />
        <BottomNavigationItem icon={ClipboardCheck} label="Inspeksi" badge={2} />
        <BottomNavigationItem icon={User} label="Profil" />
      </BottomNavigation>
    </div>
  );
}

// ==========================================
// 3. Mobile List Template
// ==========================================
export function MobileListTemplate() {
  const [search, setSearch] = useState('');
  const items = [
    { id: 'LOT-901', part: 'Crankshaft Bearing 4A', status: 'Passed', qty: 250, time: '10:42' },
    { id: 'LOT-902', part: 'Piston Ring Type C', status: 'Inspecting', qty: 500, time: '11:15' },
    { id: 'LOT-903', part: 'Connecting Rod M8', status: 'Rejected', qty: 80, time: '11:50' },
    { id: 'LOT-904', part: 'Cylinder Head Cover', status: 'Pending', qty: 150, time: '12:10' }
  ];

  return (
    <div className="p-4 space-y-3 pb-20">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Daftar Lot Produksi</h3>
        <Badge action="info"><BadgeText>{items.length} Lot Aktif</BadgeText></Badge>
      </div>

      <Input size="md">
        <InputIcon as={Search} />
        <InputField placeholder="Cari lot atau nama part..." value={search} onChangeText={setSearch} />
      </Input>

      <div className="space-y-2.5 pt-1">
        {items.map((item) => (
          <Card key={item.id} variant="outline" className="p-3.5 hover:shadow-xs transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono font-bold text-xs text-[#714b67] dark:text-[#dcbfd3]">{item.id}</span>
              <Badge
                action={item.status === 'Passed' ? 'success' : (item.status === 'Rejected' ? 'error' : 'warning')}
                size="sm"
              >
                <BadgeText>{item.status}</BadgeText>
              </Badge>
            </div>
            <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">{item.part}</div>
            <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
              <span>Jumlah: <b>{item.qty} pcs</b></span>
              <span>Waktu: {item.time}</span>
            </div>
          </Card>
        ))}
      </div>

      <FAB action="primary" placement="bottom right">
        <FabIcon as={QrCode} />
        <FabLabel>Scan Lot Baru</FabLabel>
      </FAB>
    </div>
  );
}

// ==========================================
// 4. Mobile Detail Template
// ==========================================
export function MobileDetailTemplate() {
  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold text-[#714b67] dark:text-[#dcbfd3]">PART #CR-7882</span>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Gearbox Drive Shaft</h3>
        </div>
        <Badge action="success" size="md"><BadgeText>READY TO SHIP</BadgeText></Badge>
      </div>

      <Tabs defaultValue="specs">
        <TabsTabList>
          <TabsTab value="specs">Spesifikasi</TabsTab>
          <TabsTab value="history">Riwayat QC</TabsTab>
          <TabsTab value="drawings">Drawing</TabsTab>
        </TabsTabList>

        <TabsTabPanels>
          <TabsTabPanel value="specs">
            <Card variant="outline" className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-slate-400">Material</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">SCM440 Chromoly</div>
                </div>
                <div>
                  <div className="text-slate-400">Berat Bersih</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">4.85 kg</div>
                </div>
                <div>
                  <div className="text-slate-400">Stasiun Pengerjaan</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">Lathe CNC-02</div>
                </div>
                <div>
                  <div className="text-slate-400">Toleransi Luar</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">± 0.025 mm</div>
                </div>
              </div>
            </Card>
          </TabsTabPanel>

          <TabsTabPanel value="history">
            <Card variant="outline" className="p-3 text-xs space-y-2">
              <div className="flex justify-between border-b pb-1">
                <span className="font-semibold">Inspeksi Dimensi</span>
                <span className="text-emerald-600 font-bold">PASS (Agus S.)</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="font-semibold">Uji Kekerasan HRC</span>
                <span className="text-emerald-600 font-bold">52 HRC (OK)</span>
              </div>
            </Card>
          </TabsTabPanel>

          <TabsTabPanel value="drawings">
            <Card variant="outline" className="p-4 text-center text-xs text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              CAD Drawing DWG/PDF Rev 3.2 tersedia untuk diunduh.
            </Card>
          </TabsTabPanel>
        </TabsTabPanels>
      </Tabs>

      <div className="flex gap-2">
        <Button action="positive" size="lg" className="flex-1">
          <ButtonIcon as={Check} />
          <ButtonText>Approve Part</ButtonText>
        </Button>
        <Button action="negative" variant="outline" size="lg">
          <ButtonIcon as={X} />
          <ButtonText>Reject</ButtonText>
        </Button>
      </div>
    </div>
  );
}

// ==========================================
// 5. Mobile Form Template
// ==========================================
export function MobileFormTemplate() {
  const [operator, setOperator] = useState('Deni Setiawan');
  const [shift, setShift] = useState('1');
  const [remarks, setRemarks] = useState('');

  return (
    <div className="p-4 space-y-4 pb-20">
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Form Laporan Deviasi</h3>
        <p className="text-xs text-slate-400">Catat ketidaksesuaian parameter mesin atau material</p>
      </div>

      <Card variant="elevated" className="space-y-4">
        <FormControl isRequired>
          <FormControlLabel><FormControlLabelText>Nama Operator</FormControlLabelText></FormControlLabel>
          <Input size="md">
            <InputField value={operator} onChangeText={setOperator} />
          </Input>
        </FormControl>

        <FormControl isRequired>
          <FormControlLabel><FormControlLabelText>Shift Kerja</FormControlLabelText></FormControlLabel>
          <Select selectedValue={shift} onValueChange={setShift}>
            <SelectTrigger>
              <SelectInput placeholder="Pilih Shift" />
              <SelectIcon />
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
                <SelectItem label="Shift 1 (07:00 - 15:00)" value="1" />
                <SelectItem label="Shift 2 (15:00 - 23:00)" value="2" />
                <SelectItem label="Shift 3 (23:00 - 07:00)" value="3" />
              </SelectContent>
            </SelectPortal>
          </Select>
        </FormControl>

        <FormControl>
          <FormControlLabel><FormControlLabelText>Keterangan Masalah / Deviasi</FormControlLabelText></FormControlLabel>
          <Textarea>
            <TextareaInput placeholder="Tuliskan temuan deviasi secara rinci..." rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </Textarea>
        </FormControl>

        <Button action="primary" size="lg" className="w-full">
          <ButtonText>Kirim Laporan Deviasi</ButtonText>
        </Button>
      </Card>
    </div>
  );
}

// ==========================================
// 6. Mobile Inspection Form Template (Core User Target)
// ==========================================
export function MobileInspectionFormTemplate() {
  const [diameter, setDiameter] = useState('25.04');
  const [depth, setDepth] = useState('12.48');
  const [status, setStatus] = useState('OK'); // OK | NG
  const [comment, setComment] = useState('Permukaan halus, toleransi masuk standar.');

  return (
    <div className="flex flex-col min-h-full p-4 space-y-4 pb-24 bg-slate-50 dark:bg-[#0f111a]">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Inspeksi Mobile Part</h2>
          <span className="text-xs text-slate-400">Stasiun QC • Quality Control Line</span>
        </div>
        <Badge action={status === 'OK' ? 'success' : 'error'} size="md">
          <BadgeText>{status === 'OK' ? 'STATUS: OK' : 'STATUS: REJECT'}</BadgeText>
        </Badge>
      </div>

      {/* 2. Part Information */}
      <Card variant="elevated" className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-[#714b67] dark:text-[#dcbfd3]">SN-2026-X889</span>
          <span className="text-xs text-slate-400">Lot: #LT-842</span>
        </div>
        <div className="font-bold text-sm text-slate-800 dark:text-slate-100">Hydraulic Cylinder Rod 30mm</div>
        <div className="text-xs text-slate-500">Target Spec: DIN-2391 • Toleransi ±0.05 mm</div>
      </Card>

      {/* 3. Drawing Preview */}
      <Card variant="outline" className="p-3 bg-slate-900 text-white rounded-2xl">
        <div className="flex justify-between items-center mb-2 text-xs">
          <span className="font-bold text-teal-400 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Drawing CAD Preview</span>
          <span className="text-[10px] text-slate-400">Rev. 2.4</span>
        </div>
        <div className="h-28 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col items-center justify-center p-2 text-center">
          <div className="w-16 h-8 border-2 border-dashed border-teal-400/80 rounded-md flex items-center justify-center text-[10px] font-mono text-teal-300">
            ⌀ 25.0 ±0.1
          </div>
          <span className="text-[10px] text-slate-400 mt-2">Ketuk untuk memperbesar blueprint teknis</span>
        </div>
      </Card>

      {/* 4. Inspection Characteristics & 5. Measurement Input */}
      <Card variant="elevated" className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pengukuran Dimensi Aktual</h4>

        <FormControl isRequired>
          <div className="flex justify-between text-xs font-semibold">
            <span>Diameter Luar (Standar: 25.00 ± 0.05 mm)</span>
            <span className="text-emerald-600 font-bold">PASS</span>
          </div>
          <Input size="md">
            <InputField placeholder="0.00" value={diameter} onChangeText={setDiameter} />
            <span className="text-xs text-slate-400 font-mono pr-2">mm</span>
          </Input>
        </FormControl>

        <FormControl isRequired>
          <div className="flex justify-between text-xs font-semibold">
            <span>Kedalaman Lubang (Standar: 12.50 ± 0.10 mm)</span>
            <span className="text-emerald-600 font-bold">PASS</span>
          </div>
          <Input size="md">
            <InputField placeholder="0.00" value={depth} onChangeText={setDepth} />
            <span className="text-xs text-slate-400 font-mono pr-2">mm</span>
          </Input>
        </FormControl>

        {/* 6. OK / NG Selector */}
        <div>
          <label className="text-xs font-semibold block mb-2 text-slate-700 dark:text-slate-300">Keputusan Hasil Akhir</label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              action="positive"
              variant={status === 'OK' ? 'solid' : 'outline'}
              onPress={() => setStatus('OK')}
              className="w-full py-3"
            >
              <ButtonIcon as={Check} />
              <ButtonText>PASS (OK)</ButtonText>
            </Button>
            <Button
              action="negative"
              variant={status === 'NG' ? 'solid' : 'outline'}
              onPress={() => setStatus('NG')}
              className="w-full py-3"
            >
              <ButtonIcon as={X} />
              <ButtonText>REJECT (NG)</ButtonText>
            </Button>
          </div>
        </div>

        {/* 7. Photo Capture */}
        <div>
          <label className="text-xs font-semibold block mb-1 text-slate-700 dark:text-slate-300">Foto Bukti Inspeksi</label>
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center cursor-pointer hover:border-[#714b67] transition-colors">
            <Camera className="w-6 h-6 mx-auto text-slate-400 mb-1" />
            <div className="text-xs font-medium text-slate-600 dark:text-slate-300">Ambil Foto dengan Kamera</div>
            <div className="text-[10px] text-slate-400">Resolusi otomatis dikompres untuk audit MES</div>
          </div>
        </div>

        {/* 8. Comment */}
        <FormControl>
          <FormControlLabel><FormControlLabelText>Catatan Inspector</FormControlLabelText></FormControlLabel>
          <Textarea>
            <TextareaInput value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
          </Textarea>
        </FormControl>

        {/* 9. Inspector Info */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Avatar size="sm"><AvatarFallbackText>IR</AvatarFallbackText></Avatar>
            <div>
              <div className="font-bold">Irfan Raditya (QC-2)</div>
              <div className="text-[10px] text-slate-400">Sertifikasi Kaliber Level 3</div>
            </div>
          </div>
          <span className="text-[10px] text-slate-400">{new Date().toLocaleTimeString()}</span>
        </div>

        {/* 10. Submit */}
        <Button action="primary" size="lg" className="w-full shadow-md">
          <ButtonIcon as={CheckCircle2} />
          <ButtonText>Kirim Hasil Inspeksi QC</ButtonText>
        </Button>
      </Card>
    </div>
  );
}

// ==========================================
// 7. Mobile Checklist Template
// ==========================================
export function MobileChecklistTemplate() {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Cek level oli hidrolik pada tangki utama', done: true },
    { id: 2, title: 'Bersihkan sisa gram/chip pada meja ragum', done: true },
    { id: 3, title: 'Uji fungsi emergency stop button lini', done: false },
    { id: 4, title: 'Verifikasi tekanan angin kompresor (min 6 bar)', done: false }
  ]);

  const toggle = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Checksheet TPM Harian</h3>
          <p className="text-xs text-slate-400">Sebelum Mulai Shift Kerja Mesin CNC</p>
        </div>
        <Badge action={doneCount === tasks.length ? 'success' : 'warning'}>
          <BadgeText>{doneCount}/{tasks.length} Selesai</BadgeText>
        </Badge>
      </div>

      <Progress value={(doneCount / tasks.length) * 100} size="md" />

      <div className="space-y-2 pt-2">
        {tasks.map((task) => (
          <Card
            key={task.id}
            variant="outline"
            className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${task.done ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20' : ''}`}
            onClick={() => toggle(task.id)}
          >
            <Checkbox isChecked={task.done} onChange={() => toggle(task.id)}>
              <CheckboxIndicator />
            </Checkbox>
            <span className={`text-sm font-medium flex-1 ${task.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
              {task.title}
            </span>
          </Card>
        ))}
      </div>

      <Button action="positive" size="lg" className="w-full mt-4" isDisabled={doneCount !== tasks.length}>
        <ButtonText>Konfirmasi Checklist Shift</ButtonText>
      </Button>
    </div>
  );
}

// ==========================================
// 8. Mobile Barcode/QR Scan Screen Template
// ==========================================
export function MobileBarcodeScanTemplate() {
  const [scannedCode, setScannedCode] = useState('MAT-STEEL-4029-A');
  const [flash, setFlash] = useState(false);

  return (
    <div className="relative flex flex-col min-h-full bg-black text-white p-4">
      <div className="flex items-center justify-between py-2 z-10">
        <h3 className="text-base font-bold">Scanner QR & Barcode</h3>
        <Button size="xs" variant="outline" onPress={() => setFlash(!flash)} className="border-white/30 text-white">
          <ButtonText>{flash ? 'Flash ON' : 'Flash OFF'}</ButtonText>
        </Button>
      </div>

      {/* Viewfinder simulation */}
      <div className="flex-1 flex flex-col items-center justify-center my-8 relative">
        <div className="w-64 h-64 border-2 border-teal-400 rounded-3xl relative flex items-center justify-center">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-400 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-400 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-400 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-400 rounded-br-2xl" />
          <div className="w-full h-0.5 bg-red-500/80 animate-pulse shadow-md shadow-red-500" />
        </div>
        <p className="text-xs text-white/70 mt-6">Arahkan kamera tepat ke QR Code Part / Kartu Lot</p>
      </div>

      {/* Scanned Result Card */}
      <Card variant="elevated" className="bg-slate-900 border-slate-800 text-white p-4 space-y-3 z-10">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Kode Terdeteksi</span>
          <Badge action="success" size="sm"><BadgeText>VALID</BadgeText></Badge>
        </div>
        <div className="font-mono text-base font-bold text-teal-300">{scannedCode}</div>
        <div className="flex gap-2">
          <Button action="positive" size="md" className="flex-1">
            <ButtonText>Gunakan Part Ini</ButtonText>
          </Button>
          <Button action="secondary" size="md" onPress={() => setScannedCode('SCANNING...')}>
            <ButtonIcon as={RefreshCw} />
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 9. Mobile Approval Screen Template
// ==========================================
export function MobileApprovalTemplate() {
  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Persetujuan Deviasi</h3>
          <span className="text-xs text-slate-400">Tiket #DEV-2026-04</span>
        </div>
        <Badge action="warning"><BadgeText>MENUNGGU REVIEW</BadgeText></Badge>
      </div>

      <Card variant="elevated" className="space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase">Detail Permohonan</div>
        <div className="font-bold text-base text-slate-800 dark:text-slate-100">Dispensasi Material Kekerasan Rendah</div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Lot #4092 memiliki kekerasan 48 HRC (standar 50-52 HRC). Bagian Engineering mengusulkan dilakukan proses induction hardening ulang untuk 50 unit.
        </p>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-xs">
          <div className="flex justify-between"><span>Pemohon:</span><b className="text-slate-700 dark:text-slate-200">Supardi (Supervisor Machining)</b></div>
          <div className="flex justify-between"><span>Dampak Biaya:</span><b className="text-slate-700 dark:text-slate-200">Rp 450,000</b></div>
          <div className="flex justify-between"><span>Target Selesai:</span><b className="text-slate-700 dark:text-slate-200">Hari ini, 16:00</b></div>
        </div>
      </Card>

      <div className="flex gap-2 pt-2">
        <Button action="positive" size="lg" className="flex-1">
          <ButtonIcon as={Check} />
          <ButtonText>Setujui (Approve)</ButtonText>
        </Button>
        <Button action="negative" variant="outline" size="lg" className="flex-1">
          <ButtonIcon as={X} />
          <ButtonText>Tolak (Reject)</ButtonText>
        </Button>
      </div>
    </div>
  );
}

// ==========================================
// 10. Mobile Profile Template
// ==========================================
export function MobileProfileTemplate() {
  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="flex flex-col items-center p-6 bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3">
        <Avatar size="xl">
          <AvatarFallbackText>AS</AvatarFallbackText>
          <AvatarBadge />
        </Avatar>
        <div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Agus Santoso</h3>
          <p className="text-xs text-slate-500">NIK: OP-4092 • Stasiun Machining Line 2</p>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-center">
          <Badge action="info" size="sm"><BadgeText>CNC Lathe Lv 3</BadgeText></Badge>
          <Badge action="success" size="sm"><BadgeText>K3 Certified</BadgeText></Badge>
          <Badge action="warning" size="sm"><BadgeText>QC Inspector</BadgeText></Badge>
        </div>
      </div>

      <Card variant="outline" className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
        <div className="py-3 flex justify-between"><span>Jam Kerja Shift Ini:</span><b>6 Jam 45 Menit</b></div>
        <div className="py-3 flex justify-between"><span>Total Part Dikerjakan:</span><b>14,820 pcs</b></div>
        <div className="py-3 flex justify-between"><span>Rasio Kualitas (Quality %):</span><b className="text-emerald-600">99.4%</b></div>
      </Card>

      <Button action="negative" variant="outline" size="lg" className="w-full">
        <ButtonIcon as={LogOut} />
        <ButtonText>Keluar Stasiun (Log Out)</ButtonText>
      </Button>
    </div>
  );
}

// ==========================================
// 11. Mobile Settings Template
// ==========================================
export function MobileSettingsTemplate() {
  const [autoScan, setAutoScan] = useState(true);
  const [soundFeedback, setSoundFeedback] = useState(true);
  const [highContrast, setHighContrast] = useState(false);

  return (
    <div className="p-4 space-y-4 pb-20">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Pengaturan Stasiun</h3>

      <Card variant="elevated" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Auto-Focus Scanner QR</div>
            <div className="text-xs text-slate-400">Scan otomatis saat part di depan kamera</div>
          </div>
          <Switch value={autoScan} onToggle={setAutoScan} />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          <div>
            <div className="text-sm font-semibold">Suara Beep OK / NG</div>
            <div className="text-xs text-slate-400">Feedback audio saat input inspeksi selesai</div>
          </div>
          <Switch value={soundFeedback} onToggle={setSoundFeedback} />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          <div>
            <div className="text-sm font-semibold">Mode Kontras Tinggi (High Contrast)</div>
            <div className="text-xs text-slate-400">Visibilitas maksimal di area pabrik terang</div>
          </div>
          <Switch value={highContrast} onToggle={setHighContrast} />
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 12. Mobile Notification Template
// ==========================================
export function MobileNotificationTemplate() {
  const notifs = [
    { id: 1, title: 'Alarm Tekanan Oli Mesin CNC-02', text: 'Tekanan turun di bawah 110 bar. Cek level tangki pelumas.', time: '10m lalu', type: 'error' },
    { id: 2, title: 'Lot Baru Siap Diinspeksi', text: '50 unit Crankshaft Rod tiba dari stasiun turning.', time: '35m lalu', type: 'info' },
    { id: 3, title: 'Target Shift Tercapai', text: 'Lini 2 telah menyelesaikan 1,000 part.', time: '2j lalu', type: 'success' }
  ];

  return (
    <div className="p-4 space-y-3 pb-20">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Pusat Notifikasi</h3>
        <Badge action="info"><BadgeText>3 Baru</BadgeText></Badge>
      </div>

      {notifs.map((n) => (
        <Alert key={n.id} action={n.type}>
          <AlertIcon action={n.type} />
          <AlertText>
            <div className="font-bold text-sm">{n.title}</div>
            <div className="text-xs opacity-90 mt-0.5">{n.text}</div>
            <div className="text-[10px] opacity-60 mt-1">{n.time}</div>
          </AlertText>
        </Alert>
      ))}
    </div>
  );
}

// ==========================================
// 13. Mobile Search Template
// ==========================================
export function MobileSearchTemplate() {
  const [q, setQ] = useState('');
  const tags = ['Cylinder Rod', 'Piston Ring', 'Bearing 4A', 'SCM440', 'Lot #889'];

  return (
    <div className="p-4 space-y-4 pb-20">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Pencarian Cepat</h3>
      <Input size="lg">
        <InputIcon as={Search} />
        <InputField placeholder="Ketik nomor seri, nama part, atau lot..." value={q} onChangeText={setQ} />
      </Input>

      <div>
        <div className="text-xs font-semibold text-slate-400 mb-2">PENCARIAN SERING DIGUNAKAN</div>
        <div className="flex gap-2 flex-wrap">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setQ(t)}
              className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 14. Mobile Empty State Template
// ==========================================
export function MobileEmptyStateTemplate({ onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
        <ClipboardCheck className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Belum Ada Antrean Inspeksi</h3>
      <p className="text-xs text-slate-400 max-w-xs mt-1 mb-6">
        Semua lot pengerjaan shift saat ini telah selesai diperiksa dan disimpan ke server MaviCore.
      </p>
      <Button action="primary" size="md" onPress={onAction}>
        <ButtonIcon as={QrCode} />
        <ButtonText>Scan Part Baru</ButtonText>
      </Button>
    </div>
  );
}

// ==========================================
// 15. Mobile Error State Template
// ==========================================
export function MobileErrorStateTemplate({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
      <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Kamera / Koneksi Terputus</h3>
      <p className="text-xs text-slate-400 max-w-xs mt-1 mb-6">
        Gagal menghubungkan feed video scanner atau koneksi lokal MES terputus sementara.
      </p>
      <Button action="primary" size="md" onPress={onRetry}>
        <ButtonIcon as={RefreshCw} />
        <ButtonText>Coba Hubungkan Ulang</ButtonText>
      </Button>
    </div>
  );
}

// ==========================================
// 16. Mobile Loading State Template
// ==========================================
export function MobileLoadingStateTemplate() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px] space-y-4">
      <Spinner size="xl" color="#714b67" />
      <div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Memuat Data Stasiun Kerja...</h4>
        <p className="text-xs text-slate-400 mt-0.5">Sinkronisasi parameter inspeksi dan gambar CAD</p>
      </div>
    </div>
  );
}
