# Mavi Builder - Tauri Desktop Edition

## 🎯 Overview

Mavi Builder sekarang bisa jalan sebagai **Desktop App** menggunakan **Tauri** - framework yang memberikan native performance dengan footprint kecil (~5MB).

```
┌─────────────────────────────────────────────────────────┐
│                  MAVI BUILDER                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Browser Mode (Development):                           │
│   🌐 http://localhost:5173                             │
│                                                         │
│   Desktop Mode (Production):                            │
│   💻 mavi-builder.exe (~5MB)                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Development Mode (Browser)
```bash
npm run dev
# Buka http://localhost:5173
```

### Tauri Development Mode
```bash
npm run tauri dev
# Membuka desktop app window
```

### Build Desktop App
```bash
npm run tauri build
# Output: src-tauri/target/release/mavi-builder.exe
```

## 📁 Project Structure

```
mavi-core/
├── src/                    # React frontend (SAMA)
├── src-tauri/             # Tauri wrapper (BARU)
│   ├── src/
│   │   └── main.rs       # Rust backend commands
│   ├── Cargo.toml         # Rust dependencies
│   ├── tauri.conf.json   # App configuration
│   ├── build.rs          # Build script
│   ├── capabilities/      # Permission config
│   └── icons/            # App icons
├── package.json           # Updated dengan Tauri scripts
└── vite.config.js         # Updated dengan Tauri config
```

## ✨ Fitur Desktop Mode

| Fitur | Browser | Tauri Desktop |
|-------|---------|---------------|
| Drag-Drop UI Builder | ✅ | ✅ |
| AI Code Generator | ✅ | ✅ |
| Live Preview | ✅ | ✅ |
| File System Access | ❌ | ✅ |
| Native Dialogs | ❌ | ✅ |
| Local Project Storage | ❌ | ✅ |
| System Tray | ❌ | ✅ |
| Offline Mode | ❌ | ✅ |

## 🛠️ Tauri Commands

### File System
```javascript
import { TauriFS } from './utils/tauri';

// Read file
const content = await TauriFS.readFile('/path/to/file.txt');

// Write file
await TauriFS.writeFile('/path/to/file.txt', 'content');

// List directory
const files = await TauriFS.listDirectory('/path/to/dir');

// Check if exists
const exists = await TauriFS.exists('/path/to/file.txt');
```

### System
```javascript
import { TauriSystem } from './utils/tauri';

// Get system info
const info = await TauriSystem.getSystemInfo();
// { os: 'windows', arch: 'x86_64' }

// Get app data directory
const appDir = await TauriSystem.getAppDataDir();
// C:\\Users\\...\\AppData\\Roaming\\com.mavicore.builder
```

### Dialog
```javascript
import { TauriDialog } from './utils/tauri';

// Open file picker
const files = await TauriDialog.openFile({
  multiple: true,
  filters: [{ name: 'Images', extensions: ['png', 'jpg'] }]
});

// Save file dialog
const savePath = await TauriDialog.saveFile({
  defaultPath: 'project.json',
  filters: [{ name: 'JSON', extensions: ['json'] }]
});
```

## 📦 Build Output

```
src-tauri/target/release/
├── mavi-builder.exe       # Main executable (~5MB)
├── mavi-builder.msi      # Windows installer
├── mavi-builder.dmg      # macOS app (on macOS build)
└── mavi-builder.deb      # Linux package (on Linux build)
```

## 🔧 Configuration

### Window Settings (tauri.conf.json)
```json
{
  "app": {
    "windows": [{
      "title": "MaviCore MES Builder",
      "width": 1400,
      "height": 900,
      "minWidth": 1024,
      "minHeight": 700,
      "center": true
    }]
  }
}
```

### Permissions (capabilities/default.json)
```json
{
  "permissions": [
    "fs:allow-read",
    "fs:allow-write",
    "dialog:allow-open",
    "dialog:allow-save"
  ]
}
```

## 🐛 Troubleshooting

### Rust not found
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verify
rustc --version
```

### Build fails
```bash
# Update Rust
rustup update

# Clean and rebuild
cargo clean
npm run tauri build
```

### Icons missing
```bash
# Generate placeholder icons
node scripts/generate-icons.js

# Or download default icons from Tauri docs
```

## 📚 Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Tauri 2.0 Migration Guide](https://tauri.app/v2/guides/migration/)
- [Tauri Plugins](https://tauri.app/v1/plugins/)

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Test in both browser and Tauri modes
5. Submit pull request

## 📄 License

MIT
