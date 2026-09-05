/**
 * MaviCore Gluestack UI Component Registry
 * Comprehensive metadata dictionary for AI Coding Agent & runtime discovery
 */

export const COMPONENT_REGISTRY = [
  {
    name: 'Button',
    category: 'Actions',
    description: 'Trigger an action or event, such as submitting a form, opening a dialog, or performing shop floor operations.',
    subComponents: ['ButtonText', 'ButtonIcon', 'ButtonGroup', 'ButtonSpinner'],
    props: {
      action: { type: 'enum', options: ['primary', 'secondary', 'positive', 'negative', 'default'], default: 'primary' },
      variant: { type: 'enum', options: ['solid', 'outline', 'link'], default: 'solid' },
      size: { type: 'enum', options: ['xs', 'sm', 'md', 'lg', 'xl'], default: 'md' },
      isDisabled: { type: 'boolean', default: false },
      isLoading: { type: 'boolean', default: false }
    },
    variants: ['solid', 'outline', 'link'],
    responsiveBehavior: 'Self-adjusting touch target with minimum 44px on mobile',
    example: `<Button action="positive" size="lg" onPress={handleSubmit}>\n  <ButtonIcon as={CheckCircle} />\n  <ButtonText>Kirim Hasil Inspeksi</ButtonText>\n</Button>`,
    sourceFile: 'src/ui-engine/components/Button.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'Input',
    category: 'Forms',
    description: 'Text input field container with icon slots and validation states.',
    subComponents: ['InputField', 'InputIcon', 'InputSlot'],
    props: {
      size: { type: 'enum', options: ['sm', 'md', 'lg', 'xl'], default: 'md' },
      variant: { type: 'enum', options: ['outline', 'rounded', 'underlinned'], default: 'outline' },
      isDisabled: { type: 'boolean', default: false },
      isInvalid: { type: 'boolean', default: false },
      isReadOnly: { type: 'boolean', default: false }
    },
    variants: ['outline', 'rounded', 'underlinned'],
    responsiveBehavior: 'Full-width on mobile screen, scalable font sizes',
    example: `<Input size="md">\n  <InputIcon as={Search} />\n  <InputField placeholder="Scan Barcode / Cari Part..." />\n</Input>`,
    sourceFile: 'src/ui-engine/components/Input.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'Textarea',
    category: 'Forms',
    description: 'Multi-line text input field for operator remarks, defect descriptions, and inspection logs.',
    subComponents: ['TextareaInput'],
    props: {
      size: { type: 'enum', options: ['sm', 'md', 'lg'], default: 'md' },
      isInvalid: { type: 'boolean', default: false },
      isDisabled: { type: 'boolean', default: false }
    },
    variants: ['outline'],
    responsiveBehavior: 'Full-width on mobile with vertical stretch',
    example: `<Textarea>\n  <TextareaInput placeholder="Catatan temuan visual cacat pada permukaan part..." rows={3} />\n</Textarea>`,
    sourceFile: 'src/ui-engine/components/Textarea.jsx',
    dependencies: []
  },
  {
    name: 'Select',
    category: 'Forms',
    description: 'Custom dropdown picker for selecting single values from an option list.',
    subComponents: ['SelectTrigger', 'SelectInput', 'SelectIcon', 'SelectPortal', 'SelectBackdrop', 'SelectContent', 'SelectItem'],
    props: {
      selectedValue: { type: 'string' },
      onValueChange: { type: 'function' },
      isDisabled: { type: 'boolean', default: false }
    },
    variants: ['outline'],
    responsiveBehavior: 'Bottom sheet / dropdown adaptive behavior on touchscreens',
    example: `<Select selectedValue={shift} onValueChange={setShift}>\n  <SelectTrigger>\n    <SelectInput placeholder="Pilih Shift Kerja" />\n    <SelectIcon />\n  </SelectTrigger>\n  <SelectPortal>\n    <SelectBackdrop />\n    <SelectContent>\n      <SelectItem label="Shift 1 (Pagi)" value="shift-1" />\n      <SelectItem label="Shift 2 (Siang)" value="shift-2" />\n    </SelectContent>\n  </SelectPortal>\n</Select>`,
    sourceFile: 'src/ui-engine/components/Select.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'Checkbox',
    category: 'Forms',
    description: 'Dual-state check controls for inspection checklists, safety verifications, and batch selection.',
    subComponents: ['CheckboxIndicator', 'CheckboxIcon', 'CheckboxLabel', 'CheckboxGroup'],
    props: {
      isChecked: { type: 'boolean', default: false },
      isDisabled: { type: 'boolean', default: false },
      size: { type: 'enum', options: ['sm', 'md', 'lg'], default: 'md' }
    },
    variants: ['solid'],
    responsiveBehavior: 'Tap-friendly 44px min area on mobile devices',
    example: `<Checkbox isChecked={checked} onChange={setChecked}>\n  <CheckboxIndicator />\n  <CheckboxLabel>Verifikasi tekanan hidrolik normal (&gt; 120 bar)</CheckboxLabel>\n</Checkbox>`,
    sourceFile: 'src/ui-engine/components/Checkbox.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'Switch',
    category: 'Forms',
    description: 'Toggle switch for boolean settings, machine runtime activation, and sensor overrides.',
    subComponents: [],
    props: {
      value: { type: 'boolean', default: false },
      onToggle: { type: 'function' },
      isDisabled: { type: 'boolean', default: false },
      size: { type: 'enum', options: ['sm', 'md', 'lg'], default: 'md' }
    },
    variants: ['default'],
    responsiveBehavior: 'Smooth animated pill switch with immediate visual feedback',
    example: `<Switch value={isAutoScan} onToggle={setIsAutoScan} size="md" />`,
    sourceFile: 'src/ui-engine/components/Switch.jsx',
    dependencies: []
  },
  {
    name: 'Card',
    category: 'Surfaces',
    description: 'Structural container for grouping related content, KPI summaries, and part specifications.',
    subComponents: [],
    props: {
      size: { type: 'enum', options: ['sm', 'md', 'lg'], default: 'md' },
      variant: { type: 'enum', options: ['elevated', 'outline', 'filled'], default: 'elevated' }
    },
    variants: ['elevated', 'outline', 'filled'],
    responsiveBehavior: 'Fluid padding and width adapting from mobile cards to desktop grids',
    example: `<Card variant="elevated" className="p-4">\n  <h4 className="font-bold text-slate-800">Part Info: Gearbox Housing</h4>\n  <p className="text-xs text-slate-500">Drawing Rev. 3.2</p>\n</Card>`,
    sourceFile: 'src/ui-engine/components/Card.jsx',
    dependencies: []
  },
  {
    name: 'Badge',
    category: 'Data Display',
    description: 'Visual indicator for status tags, lot numbers, defect levels, and priority indicators.',
    subComponents: ['BadgeText', 'BadgeIcon'],
    props: {
      action: { type: 'enum', options: ['info', 'success', 'warning', 'error', 'muted'], default: 'info' },
      variant: { type: 'enum', options: ['solid', 'outline'], default: 'solid' },
      size: { type: 'enum', options: ['sm', 'md', 'lg'], default: 'md' }
    },
    variants: ['solid', 'outline'],
    responsiveBehavior: 'Inline compact badges with high contrast typography',
    example: `<Badge action="success" size="sm">\n  <BadgeIcon as={ShieldCheck} />\n  <BadgeText>PASSED</BadgeText>\n</Badge>`,
    sourceFile: 'src/ui-engine/components/Badge.jsx',
    dependencies: []
  },
  {
    name: 'Avatar',
    category: 'Data Display',
    description: 'User, technician, or operator profile picture with fallback initials and active presence badge.',
    subComponents: ['AvatarFallbackText', 'AvatarImage', 'AvatarBadge'],
    props: {
      size: { type: 'enum', options: ['xs', 'sm', 'md', 'lg', 'xl'], default: 'md' }
    },
    variants: ['circular'],
    responsiveBehavior: 'Scales proportionally across headers and lists',
    example: `<Avatar size="md">\n  <AvatarFallbackText>AG</AvatarFallbackText>\n  <AvatarBadge />\n</Avatar>`,
    sourceFile: 'src/ui-engine/components/Avatar.jsx',
    dependencies: []
  },
  {
    name: 'Modal',
    category: 'Overlays',
    description: 'Dialog window that overlays the screen for confirmations, signature captures, and critical alerts.',
    subComponents: ['ModalBackdrop', 'ModalContent', 'ModalHeader', 'ModalCloseButton', 'ModalBody', 'ModalFooter'],
    props: {
      isOpen: { type: 'boolean', default: false },
      onClose: { type: 'function' },
      size: { type: 'enum', options: ['sm', 'md', 'lg', 'full'], default: 'md' }
    },
    variants: ['default'],
    responsiveBehavior: 'Centered card on desktop, full-screen or bottom-docked on mobile',
    example: `<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>\n  <ModalBackdrop />\n  <ModalContent>\n    <ModalHeader>Konfirmasi Reject Lot</ModalHeader>\n    <ModalBody>Apakah Anda yakin akan menandai Lot #882 sebagai NG?</ModalBody>\n    <ModalFooter>\n      <Button action="negative" onPress={handleReject}><ButtonText>Ya, Reject</ButtonText></Button>\n    </ModalFooter>\n  </ModalContent>\n</Modal>`,
    sourceFile: 'src/ui-engine/components/Modal.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'Drawer',
    category: 'Overlays',
    description: 'Slide-in panel from screen edges for filters, secondary navigation, and inspector toolboxes.',
    subComponents: ['DrawerBackdrop', 'DrawerContent', 'DrawerHeader', 'DrawerBody', 'DrawerFooter'],
    props: {
      isOpen: { type: 'boolean', default: false },
      onClose: { type: 'function' },
      anchor: { type: 'enum', options: ['left', 'right', 'top', 'bottom'], default: 'right' }
    },
    variants: ['bottom-sheet', 'side-panel'],
    responsiveBehavior: 'Bottom sheet on mobile, slide drawer on tablet/desktop',
    example: `<Drawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} anchor="bottom">\n  <DrawerBackdrop />\n  <DrawerContent>\n    <DrawerHeader>Filter Riwayat Inspeksi</DrawerHeader>\n    <DrawerBody>Pilihan filter status, tanggal, dan operator</DrawerBody>\n  </DrawerContent>\n</Drawer>`,
    sourceFile: 'src/ui-engine/components/Drawer.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'Tabs',
    category: 'Navigation',
    description: 'Tabbed interface for switching between views like Drawing, Characteristics, and Measurements.',
    subComponents: ['TabsTabList', 'TabsTab', 'TabsTabPanels', 'TabsTabPanel'],
    props: {
      value: { type: 'string' },
      defaultValue: { type: 'string' },
      onTabChange: { type: 'function' }
    },
    variants: ['line'],
    responsiveBehavior: 'Horizontal scroll with hide-scrollbar on narrow mobile screens',
    example: `<Tabs defaultValue="info">\n  <TabsTabList>\n    <TabsTab value="info">Info Part</TabsTab>\n    <TabsTab value="draw">Drawing CAD</TabsTab>\n    <TabsTab value="qc">Karakteristik QC</TabsTab>\n  </TabsTabList>\n</Tabs>`,
    sourceFile: 'src/ui-engine/components/Tabs.jsx',
    dependencies: []
  },
  {
    name: 'Accordion',
    category: 'Surfaces',
    description: 'Collapsible sections for organizing complex checklists, inspection steps, or FAQ sections.',
    subComponents: ['AccordionItem', 'AccordionHeader', 'AccordionTrigger', 'AccordionTitleText', 'AccordionIcon', 'AccordionContent', 'AccordionContentText'],
    props: {
      type: { type: 'enum', options: ['single', 'multiple'], default: 'single' }
    },
    variants: ['separated', 'flush'],
    responsiveBehavior: 'Full-width collapsible cards with chevron rotation',
    example: `<Accordion type="single">\n  <AccordionItem value="step-1">\n    <AccordionTrigger>\n      <AccordionTitleText>1. Pengecekan Visual Bodi</AccordionTitleText>\n    </AccordionTrigger>\n    <AccordionContent>Pastikan tidak ada retak atau goresan.</AccordionContent>\n  </AccordionItem>\n</Accordion>`,
    sourceFile: 'src/ui-engine/components/Accordion.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'Alert',
    category: 'Feedback',
    description: 'Prominent contextual messages informing operators about machine alarms, warnings, or guidelines.',
    subComponents: ['AlertIcon', 'AlertText'],
    props: {
      action: { type: 'enum', options: ['info', 'success', 'warning', 'error', 'muted'], default: 'info' },
      variant: { type: 'enum', options: ['solid', 'outline'], default: 'solid' }
    },
    variants: ['solid', 'outline'],
    responsiveBehavior: 'Adaptive text wrapping and flexible icon alignment',
    example: `<Alert action="warning">\n  <AlertIcon />\n  <AlertText>Kalibrasi caliper akan kadaluwarsa dalam 3 hari.</AlertText>\n</Alert>`,
    sourceFile: 'src/ui-engine/components/Alert.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'Toast',
    category: 'Feedback',
    description: 'Brief, ephemeral notifications confirming operations such as save, submit, or scan successful.',
    subComponents: ['ToastTitle', 'ToastDescription'],
    props: {
      action: { type: 'enum', options: ['info', 'success', 'warning', 'error'], default: 'info' }
    },
    variants: ['floating'],
    responsiveBehavior: 'Docked bottom-right or top-center with slide animation',
    example: `<Toast action="success">\n  <ToastTitle>Data Tersimpan</ToastTitle>\n  <ToastDescription>Hasil inspeksi berhasil disinkronisasi ke MaviCore.</ToastDescription>\n</Toast>`,
    sourceFile: 'src/ui-engine/components/Toast.jsx',
    dependencies: []
  },
  {
    name: 'Progress',
    category: 'Feedback',
    description: 'Progress bar displaying current task completion percentage, shift output progress, or upload status.',
    subComponents: ['ProgressFilledTrack'],
    props: {
      value: { type: 'number', default: 0 },
      size: { type: 'enum', options: ['xs', 'sm', 'md', 'lg'], default: 'md' }
    },
    variants: ['rounded'],
    responsiveBehavior: '100% width responsive with smooth transition width animation',
    example: `<Progress value={78} size="md" />`,
    sourceFile: 'src/ui-engine/components/Progress.jsx',
    dependencies: []
  },
  {
    name: 'Spinner',
    category: 'Feedback',
    description: 'Rotating loader for asynchronous fetch, AI generating state, and file loading.',
    subComponents: [],
    props: {
      size: { type: 'enum', options: ['sm', 'md', 'lg', 'xl'], default: 'md' },
      color: { type: 'string', default: '#714b67' }
    },
    variants: ['inline'],
    responsiveBehavior: 'Centered or inline loader icon',
    example: `<Spinner size="lg" color="#008784" />`,
    sourceFile: 'src/ui-engine/components/Spinner.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'Table',
    category: 'Data Display',
    description: 'Data grid for displaying structured inspection specs, lot measurements, and inventory logs.',
    subComponents: ['TableHeader', 'TableBody', 'TableRow', 'TableHead', 'TableCell'],
    props: {},
    variants: ['striped', 'bordered'],
    responsiveBehavior: 'Horizontal overflow container with fixed table layout',
    example: `<Table>\n  <TableHeader>\n    <TableRow>\n      <TableHead>Parameter</TableHead>\n      <TableHead>Standar</TableHead>\n      <TableHead>Hasil</TableHead>\n    </TableRow>\n  </TableHeader>\n  <TableBody>\n    <TableRow>\n      <TableCell>Diameter</TableCell>\n      <TableCell>25.0 ± 0.1</TableCell>\n      <TableCell className="font-bold text-emerald-600">25.04</TableCell>\n    </TableRow>\n  </TableBody>\n</Table>`,
    sourceFile: 'src/ui-engine/components/Table.jsx',
    dependencies: []
  },
  {
    name: 'Form',
    category: 'Forms',
    description: 'Form wrapper and control elements with label, helper, and error text bindings.',
    subComponents: ['FormControl', 'FormControlLabel', 'FormControlLabelText', 'FormControlHelper', 'FormControlHelperText', 'FormControlError', 'FormControlErrorText', 'FormControlErrorIcon'],
    props: {
      onSubmit: { type: 'function' }
    },
    variants: ['vertical'],
    responsiveBehavior: 'Mobile stackable labels and inputs with instant error validation',
    example: `<FormControl isRequired isInvalid={hasError}>\n  <FormControlLabel><FormControlLabelText>Nomor Serial Part</FormControlLabelText></FormControlLabel>\n  <Input><InputField placeholder="Contoh: SN-2026-X88" /></Input>\n  <FormControlError><FormControlErrorText>Nomor serial wajib diisi</FormControlErrorText></FormControlError>\n</FormControl>`,
    sourceFile: 'src/ui-engine/components/Form.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'Dropdown',
    category: 'Actions',
    description: 'Context menu triggering additional secondary actions, export options, or machine commands.',
    subComponents: ['DropdownTrigger', 'DropdownMenu', 'MenuItem', 'MenuItemLabel'],
    props: {},
    variants: ['floating'],
    responsiveBehavior: 'Pop-over aligned to anchor on screen',
    example: `<Dropdown>\n  <DropdownTrigger><Button variant="outline"><ButtonText>Opsi...</ButtonText></Button></DropdownTrigger>\n  <DropdownMenu>\n    <MenuItem><MenuItemLabel>Export PDF</MenuItemLabel></MenuItem>\n    <MenuItem><MenuItemLabel>Cetak Label QR</MenuItemLabel></MenuItem>\n  </DropdownMenu>\n</Dropdown>`,
    sourceFile: 'src/ui-engine/components/Dropdown.jsx',
    dependencies: []
  },
  {
    name: 'Command',
    category: 'Navigation',
    description: 'Command palette and instant search bar for quick navigation, shortcut invocation, and part lookup.',
    subComponents: ['CommandInput', 'CommandList', 'CommandItem'],
    props: {},
    variants: ['dialog', 'inline'],
    responsiveBehavior: 'Full screen or modal quick-action launcher',
    example: `<Command>\n  <CommandInput placeholder="Cari modul atau part..." />\n  <CommandList>\n    <CommandItem onSelect={() => {}}>Inspeksi Baru</CommandItem>\n  </CommandList>\n</Command>`,
    sourceFile: 'src/ui-engine/components/Command.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'Navigation',
    category: 'Navigation',
    description: 'Header navigation bar with brand logo, module tabs, and action icons.',
    subComponents: ['NavigationBrand', 'NavigationItems', 'NavigationItem'],
    props: {},
    variants: ['header'],
    responsiveBehavior: 'Sticky top bar adapting to mobile header height',
    example: `<Navigation>\n  <NavigationBrand>MaviCore QC</NavigationBrand>\n  <NavigationItems>\n    <NavigationItem active>Inspeksi</NavigationItem>\n    <NavigationItem>Laporan</NavigationItem>\n  </NavigationItems>\n</Navigation>`,
    sourceFile: 'src/ui-engine/components/Navigation.jsx',
    dependencies: []
  },
  {
    name: 'BottomNavigation',
    category: 'Navigation',
    description: 'Bottom navigation tab bar optimized for single-thumb mobile operations in shop floor environments.',
    subComponents: ['BottomNavigationItem'],
    props: {},
    variants: ['fixed-bottom'],
    responsiveBehavior: 'Fixed to bottom viewport with safe-area padding for mobile screens',
    example: `<BottomNavigation>\n  <BottomNavigationItem icon={Home} label="Home" active />\n  <BottomNavigationItem icon={QrCode} label="Scan" />\n  <BottomNavigationItem icon={CheckCircle2} label="Inspeksi" badge={3} />\n  <BottomNavigationItem icon={User} label="Profil" />\n</BottomNavigation>`,
    sourceFile: 'src/ui-engine/components/BottomNavigation.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'FAB',
    category: 'Actions',
    description: 'Floating Action Button for the most prominent mobile action (e.g. Scan QR, Add Defect, Submit).',
    subComponents: ['FabLabel', 'FabIcon'],
    props: {
      placement: { type: 'enum', options: ['bottom right', 'bottom left', 'bottom center'], default: 'bottom right' },
      size: { type: 'enum', options: ['sm', 'md', 'lg'], default: 'md' },
      action: { type: 'enum', options: ['primary', 'secondary', 'positive'], default: 'primary' }
    },
    variants: ['pill', 'circular'],
    responsiveBehavior: 'Floating above bottom nav with elevation shadow',
    example: `<FAB placement="bottom right" action="positive" onPress={() => setIsScanning(true)}>\n  <FabIcon as={QrCode} />\n  <FabLabel>Scan QR</FabLabel>\n</FAB>`,
    sourceFile: 'src/ui-engine/components/FAB.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'QRCodeScanner',
    category: 'Media & Devices',
    description: 'Shop floor QR Code & Barcode Scanner with HUD reticle, animated laser sweep, torch toggle, and live camera feed.',
    subComponents: ['QRCodeScannerHUD', 'QRCodeScannerResult'],
    props: {
      label: { type: 'string', default: 'Pindai QR / Barcode Part' },
      subtitle: { type: 'string', default: 'Arahkan kamera ke QR Code label lot' },
      aspectRatio: { type: 'enum', options: ['square', 'video'], default: 'square' },
      showControls: { type: 'boolean', default: true },
      autoScan: { type: 'boolean', default: true }
    },
    variants: ['hud-square', 'hud-video'],
    responsiveBehavior: 'Self-adapting mobile viewfinder with touch-optimized controls',
    example: `<QRCodeScanner label="Pindai QR Part" onScan={(code) => console.log('Scanned:', code)} />`,
    sourceFile: 'src/ui-engine/components/QRCodeScanner.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'VideoPlayer',
    category: 'Media & Devices',
    description: 'Industrial Work Instruction & SOP Video Player with playback controls, timeline scrubber, and SOP header.',
    subComponents: [],
    props: {
      title: { type: 'string', default: 'SOP Perakitan Sub-Assy Pompa Hidrolik' },
      subtitle: { type: 'string', default: 'Instruksi Kerja Standar • Rev 2.1' },
      src: { type: 'string', default: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
      aspectRatio: { type: 'enum', options: ['16:9', '4:3'], default: '16:9' },
      autoPlay: { type: 'boolean', default: false },
      controls: { type: 'boolean', default: true }
    },
    variants: ['sop-player'],
    responsiveBehavior: 'Adaptive aspect ratio player scaling to device width',
    example: `<VideoPlayer title="SOP Perakitan" src="/videos/sop-01.mp4" />`,
    sourceFile: 'src/ui-engine/components/VideoPlayer.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'Camera',
    category: 'Media & Devices',
    description: 'Quality Inspection Camera Viewfinder & Defect Capture with alignment grid, flash effect, and audit watermark.',
    subComponents: [],
    props: {
      label: { type: 'string', default: 'Kamera Inspeksi Defek Visual' },
      subtitle: { type: 'string', default: 'Ambil foto bukti cacat atau kelayakan part' },
      showGrid: { type: 'boolean', default: true },
      showShutter: { type: 'boolean', default: true },
      aspectRatio: { type: 'enum', options: ['square', '4:3', 'video'], default: 'square' }
    },
    variants: ['viewfinder'],
    responsiveBehavior: 'Full-width mobile camera viewfinder with large touch shutter',
    example: `<Camera label="Inspeksi Part Cacat" onCapture={(img) => console.log(img)} />`,
    sourceFile: 'src/ui-engine/components/Camera.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'Timer',
    category: 'Data Display',
    description: 'Countdown, countup, and stopwatch timer for cycle time, takt time, and shift tracking.',
    subComponents: [],
    props: {
      value: { type: 'number', default: 0 },
      duration: { type: 'number', default: 0 },
      mode: { type: 'enum', options: ['countdown', 'countup', 'stopwatch'], default: 'countdown' },
      size: { type: 'enum', options: ['sm', 'md', 'lg'], default: 'md' },
      variant: { type: 'enum', options: ['default', 'pill', 'large'], default: 'default' },
      label: { type: 'string' },
      autoStart: { type: 'boolean', default: false },
      showHours: { type: 'boolean', default: true }
    },
    variants: ['default', 'pill', 'large'],
    responsiveBehavior: 'Centered display with touch-friendly controls',
    example: `<Timer value={0} duration={300} mode="countdown" label="Takt Time" onComplete={() => alert('Time is up!')} />`,
    sourceFile: 'src/ui-engine/components/Timer.jsx',
    dependencies: []
  },
  {
    name: 'Counter',
    category: 'Data Display',
    description: 'Incremental/decremental counter for part counting, good/bad parts, and quantity input.',
    subComponents: [],
    props: {
      value: { type: 'number', default: 0 },
      min: { type: 'number', default: 0 },
      max: { type: 'number', default: 99999 },
      step: { type: 'number', default: 1 },
      label: { type: 'string' },
      size: { type: 'enum', options: ['sm', 'md', 'lg'], default: 'md' },
      variant: { type: 'enum', options: ['default', 'pill', 'card', 'compact'], default: 'default' },
      showButtons: { type: 'boolean', default: true },
      colorScheme: { type: 'enum', options: ['default', 'success', 'warning', 'danger'], default: 'default' }
    },
    variants: ['default', 'pill', 'card', 'compact'],
    responsiveBehavior: 'Large touch targets for shop floor use',
    example: `<Counter value={0} min={0} max={1000} label="Good Parts" colorScheme="success" />`,
    sourceFile: 'src/ui-engine/components/Counter.jsx',
    dependencies: []
  },
  {
    name: 'NumberInput',
    category: 'Forms',
    description: 'Numeric input with increment/decrement stepper buttons for quantity and measurement entry.',
    subComponents: [],
    props: {
      value: { type: 'number', default: 0 },
      min: { type: 'number', default: 0 },
      max: { type: 'number', default: 999999 },
      step: { type: 'number', default: 1 },
      label: { type: 'string' },
      placeholder: { type: 'string', default: '0' },
      size: { type: 'enum', options: ['sm', 'md', 'lg'], default: 'md' },
      variant: { type: 'enum', options: ['outline', 'rounded', 'underlined'], default: 'outline' },
      prefix: { type: 'string' },
      suffix: { type: 'string' },
      decimals: { type: 'number', default: 0 },
      showStepper: { type: 'boolean', default: true }
    },
    variants: ['outline', 'rounded', 'underlined'],
    responsiveBehavior: 'Touch-friendly stepper with clear visual feedback',
    example: `<NumberInput value={0} min={0} max={100} step={1} label="Quantity" suffix="pcs" />`,
    sourceFile: 'src/ui-engine/components/NumberInput.jsx',
    dependencies: []
  },
  {
    name: 'DateTimePicker',
    category: 'Forms',
    description: 'Date, time, and datetime picker for scheduling maintenance, shift times, and delivery dates.',
    subComponents: [],
    props: {
      value: { type: 'string' },
      mode: { type: 'enum', options: ['date', 'time', 'datetime'], default: 'date' },
      label: { type: 'string' },
      placeholder: { type: 'string', default: 'Select date...' },
      size: { type: 'enum', options: ['sm', 'md', 'lg'], default: 'md' },
      format: { type: 'enum', options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], default: 'MM/DD/YYYY' },
      showNowButton: { type: 'boolean', default: true },
      showClearButton: { type: 'boolean', default: true }
    },
    variants: ['default'],
    responsiveBehavior: 'Calendar popup with touch-optimized date/time selection',
    example: `<DateTimePicker mode="datetime" label="Scheduled Maintenance" />`,
    sourceFile: 'src/ui-engine/components/DateTimePicker.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'Gauge',
    category: 'Data Display',
    description: 'Circular gauge/dial for visualizing RPM, temperature, speed, and other sensor readings.',
    subComponents: [],
    props: {
      value: { type: 'number', default: 0 },
      min: { type: 'number', default: 0 },
      max: { type: 'number', default: 100 },
      label: { type: 'string' },
      unit: { type: 'string' },
      size: { type: 'number', default: 200 },
      warningThreshold: { type: 'number' },
      dangerThreshold: { type: 'number' },
      color: { type: 'string', default: '#714b67' },
      showValue: { type: 'boolean', default: true },
      showMinMax: { type: 'boolean', default: true },
      decimals: { type: 'number', default: 0 }
    },
    variants: ['default'],
    responsiveBehavior: 'Auto-scaling gauge with animated value transitions',
    example: `<Gauge value={75} min={0} max={100} label="RPM" unit="rpm" warningThreshold={80} dangerThreshold={95} />`,
    sourceFile: 'src/ui-engine/components/Gauge.jsx',
    dependencies: []
  },
  {
    name: 'ListItem',
    category: 'Data Display',
    description: 'List row with icon, title, subtitle, badge, and action for data lists and menus.',
    subComponents: [],
    props: {
      title: { type: 'string' },
      subtitle: { type: 'string' },
      description: { type: 'string' },
      leftIcon: { type: 'component' },
      leftAvatar: { type: 'string' },
      leftBadge: { type: 'string' },
      rightContent: { type: 'component' },
      rightBadge: { type: 'string' },
      status: { type: 'enum', options: ['success', 'warning', 'error', 'pending', 'info'] },
      size: { type: 'enum', options: ['sm', 'md', 'lg'], default: 'md' },
      variant: { type: 'enum', options: ['default', 'bordered', 'filled', 'card'], default: 'default' }
    },
    variants: ['default', 'bordered', 'filled', 'card'],
    responsiveBehavior: 'Touch-friendly row with swipe actions support',
    example: `<ListItem title="Work Order #WO-9921" subtitle="Part: Flange Bracket A" status="success" rightBadge="Completed" />`,
    sourceFile: 'src/ui-engine/components/ListItem.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'EmptyState',
    category: 'Feedback',
    description: 'Placeholder display when there is no data, no results, or an error occurred.',
    subComponents: [],
    props: {
      icon: { type: 'component' },
      title: { type: 'string' },
      description: { type: 'string' },
      actionLabel: { type: 'string' },
      size: { type: 'enum', options: ['sm', 'md', 'lg'], default: 'md' }
    },
    variants: ['default'],
    responsiveBehavior: 'Centered layout with clear call-to-action',
    example: `<EmptyState icon={FileText} title="No Records" description="Create your first record" actionLabel="Create" />`,
    sourceFile: 'src/ui-engine/components/EmptyState.jsx',
    dependencies: ['lucide-react']
  },
  {
    name: 'Skeleton',
    category: 'Feedback',
    description: 'Loading placeholder shimmer animation while data is being fetched.',
    subComponents: ['SkeletonList', 'SkeletonCard', 'SkeletonTable'],
    props: {
      variant: { type: 'enum', options: ['text', 'circular', 'rectangular', 'card'], default: 'text' },
      width: { type: 'number' },
      height: { type: 'number' },
      animation: { type: 'enum', options: ['pulse', 'wave', 'none'], default: 'pulse' },
      lines: { type: 'number', default: 3 }
    },
    variants: ['text', 'circular', 'rectangular', 'card'],
    responsiveBehavior: 'Matches the shape of actual content',
    example: `<Skeleton variant="card" lines={4} />`,
    sourceFile: 'src/ui-engine/components/Skeleton.jsx',
    dependencies: []
  },
  {
    name: 'Signature',
    category: 'Forms',
    description: 'Canvas-based digital signature capture for quality approvals and sign-offs.',
    subComponents: [],
    props: {
      value: { type: 'string' },
      label: { type: 'string', default: 'Signature' },
      placeholder: { type: 'string', default: 'Sign here' },
      width: { type: 'number', default: 400 },
      height: { type: 'number', default: 200 },
      strokeColor: { type: 'string', default: '#0f172a' },
      required: { type: 'boolean', default: false },
      showClearButton: { type: 'boolean', default: true },
      showDownloadButton: { type: 'boolean', default: false }
    },
    variants: ['default'],
    responsiveBehavior: 'Touch-friendly signature drawing with clear controls',
    example: `<Signature label="QC Approval" required onChange={(sig) => console.log(sig)} />`,
    sourceFile: 'src/ui-engine/components/Signature.jsx',
    dependencies: []
  }
];
