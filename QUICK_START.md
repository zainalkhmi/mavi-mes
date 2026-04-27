# QUICK START - Project Management System

Panduan cepat untuk memulai menggunakan sistem manajemen project yang baru di Mavi-MES.

## ⚡ Quick Start (5 menit)

### 1. Export Project (Backup)
```javascript
// UI: Klik tombol "Manajemen Proyek" > "Export JSON"
// File akan otomatis diunduh

// Code:
import * as projectMgmt from '../utils/projectManagement';

const app = getCurrentApp();
await projectMgmt.exportProjectToJSON(app);
// Download: MyApp-1682522400000.json
```

### 2. Import Project (Restore)
```javascript
// UI: Klik "Manajemen Proyek" > "Import" > Pilih file JSON

// Code:
const file = /* dari file input */;
const result = await projectMgmt.importProjectFromJSON(file);
handleImportProject(result.data);  // Load ke editor
```

### 3. Backup & Restore
```javascript
// Create Backup
const backup = await projectMgmt.backupProjectToLocalStorage(app);
// Disimpan ke localStorage

// List Backups
const backups = projectMgmt.getProjectBackups(app.id);

// Restore
const restored = await projectMgmt.restoreProjectFromBackup(
  app.id,
  backups[0].key
);
```

### 4. Duplicate Project
```javascript
// UI: Klik "Manajemen Proyek" > "Duplikasi"

// Code:
const dup = projectMgmt.duplicateProject(app, 'New Name');
handleDuplicateProject(dup);
await handleSave();  // Save sebagai project baru
```

## 📁 File Structure

```
src/
├── utils/
│   └── projectManagement.js          ← Core functions
├── components/
│   ├── ProjectManager.jsx             ← UI Component
│   └── AppBuilder.jsx                 ← Integration (modified)
│
Documentation/
├── PROJECT_MANAGEMENT_GUIDE.md        ← User guide
├── IMPLEMENTATION_SUMMARY.md          ← Technical summary
├── API_REFERENCE.js                   ← Complete API docs
└── QUICK_START.md                     ← This file
```

## 🎯 Key Functions

| Function | Purpose | Return |
|----------|---------|--------|
| `exportProjectToJSON(app)` | Export to JSON file | Promise<{success, filename}> |
| `importProjectFromJSON(file)` | Import from file | Promise<{success, data}> |
| `duplicateProject(app, name)` | Clone project | Object (new project) |
| `backupProjectToLocalStorage(app)` | Create backup | Promise<{success, key, time}> |
| `restoreProjectFromBackup(id, key)` | Restore backup | Promise<{success, data}> |
| `getProjectBackups(id)` | List all backups | Array<{time, key, displayTime}> |
| `autoSaveDraft(app)` | Auto-save draft | void |
| `getAutoSavedDraft(id)` | Get draft | Object \| null |
| `validateProjectData(app)` | Check integrity | {isValid, issues} |

## 💾 Storage

### localStorage Keys
```javascript
project_backup_app_123_1    // Backup data
project_backup_app_123_2    // Another backup
project_backups             // Backup index
draft_app_123               // Auto-saved draft
```

### Data Size Estimate
- Small project: ~200KB
- Medium project: ~1-2MB
- Large project: ~5MB+

⚠️ **Note:** Browser localStorage limit ~5-10MB

## 🔧 Integration in AppBuilder

```jsx
// Import
import ProjectManager from './ProjectManager';
import * as projectMgmt from '../utils/projectManagement';

// Add handler functions
const handleImportProject = async (data) => {
  setAppName(data.name);
  setAppCategory(data.category);
  setSteps(data.config.steps || []);
  // ... load all state
};

const handleDuplicateProject = (data) => {
  handleImportProject(data);
};

const getCurrentApp = () => ({
  id: currentAppId,
  name: appName,
  category: appCategory,
  config: { steps, baseComponents, ... }
});

// Add to JSX
{currentAppId && (
  <ProjectManager
    app={getCurrentApp()}
    onImport={handleImportProject}
    onDuplicate={handleDuplicateProject}
  />
)}
```

## ⚠️ Important Notes

### Do's ✅
- ✅ Export JSON regularly untuk backup jangka panjang
- ✅ Create backup sebelum perubahan besar
- ✅ Use meaningful names untuk backup
- ✅ Validate project sebelum export

### Don'ts ❌
- ❌ Jangan edit JSON file secara manual
- ❌ Jangan andalkan localStorage sebagai backup utama
- ❌ Jangan punya >5 backup per project (auto-delete)
- ❌ Jangan share file JSON tanpa enkripsi jika sensitif

## 🐛 Common Issues

### Issue: "File JSON invalid"
```javascript
// Check: JSON valid format
JSON.parse(fileContent);

// Check: Has required keys
if (!json.project || !json.config) {
  throw new Error('Invalid format');
}
```

### Issue: "Backup not found"
```javascript
// Check: Backup exists
const backups = projectMgmt.getProjectBackups(appId);
console.log(backups);  // Empty array?

// Check: localStorage not cleared
console.log(localStorage.getItem('project_backups'));
```

### Issue: "Auto-save not working"
```javascript
// Check: Draft is being saved
const draft = projectMgmt.getAutoSavedDraft(appId);
console.log('Draft:', draft);  // null?

// Check: Storage space
console.log('Storage available:', navigator.storage.estimate());
```

## 📊 Feature Comparison

| Feature | Storage | Size | Speed | Recovery |
|---------|---------|------|-------|----------|
| Export JSON | File system | Variable | Fast | Manual |
| Backup Local | localStorage | Up to 5 | Instant | Quick |
| Auto-save | localStorage | Auto-trim | Auto | Automatic |
| Cloud* | Supabase | Unlimited | Depends | Fastest |

*Cloud backup planned for future

## 🚀 Advanced Usage

### Programmatic Export
```javascript
// Export multiple apps at once
const apps = [app1, app2, app3];
await projectMgmt.exportMultipleProjects(apps);
```

### Validate Before Export
```javascript
const validation = projectMgmt.validateProjectData(app);
if (!validation.isValid) {
  console.warn('Issues:', validation.issues);
  // Fix issues before export
}
```

### Custom Auto-save Interval
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    projectMgmt.autoSaveDraft(getCurrentApp());
  }, 60000);  // Save every 60 seconds
  
  return () => clearInterval(interval);
}, [currentAppId]);
```

### Recovery Flow
```javascript
useEffect(() => {
  const draft = projectMgmt.getAutoSavedDraft(appId);
  if (draft && confirmRecovery()) {
    handleImportProject(draft.data);
    projectMgmt.clearAutoSavedDraft(appId);
  }
}, [appId]);
```

## 📈 Performance Tips

1. **Reduce backup size:**
   - Delete old backups
   - Export non-critical projects to archive
   - Use CSV for documentation

2. **Optimize auto-save:**
   - Increase interval to 60+ seconds
   - Disable for very large projects
   - Monitor localStorage usage

3. **Browser optimization:**
   - Use modern browsers (Chrome, Firefox, Safari)
   - Keep dev tools closed when not needed
   - Clear old drafts regularly

## 🎓 Learning Path

1. **Beginner:** Export → Import → Backup/Restore
2. **Intermediate:** Duplicate → Auto-save → Validation
3. **Advanced:** Programmatic usage → Custom workflows

## 📚 Next Steps

1. Read [PROJECT_MANAGEMENT_GUIDE.md](PROJECT_MANAGEMENT_GUIDE.md) untuk detail lengkap
2. Check [API_REFERENCE.js](API_REFERENCE.js) untuk semua functions
3. See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) untuk technical details

## 💡 Tips & Tricks

### Backup & Share Workflow
```
1. Export JSON → backup.json
2. Send to team member
3. Team imports → LoadProject
4. Modify & Save → New Version
5. Export → Updated backup
```

### Template Creation
```
1. Create template project
2. Duplicate untuk setiap instance
3. Customize per instance
4. Save as final version
5. Export untuk documentation
```

### Safe Testing
```
1. Backup current project
2. Duplicate untuk testing
3. Make experimental changes
4. If good → Keep
5. If bad → Restore original
```

## ❓ FAQ

**Q: Dimana data disimpan?**
A: Di browser localStorage (local device only)

**Q: Apakah backup terus-menerus?**
A: Ada dua: Manual backup + Auto-save draft

**Q: Bisa berapa backup?**
A: Max 5 per project, automatically delete old ones

**Q: Data hilang jika clear cache?**
A: Ya, gunakan export JSON untuk long-term backup

**Q: Bisa backup ke cloud?**
A: Planned feature, currently local only

**Q: Berapa lama backup disimpan?**
A: Sampai manual delete atau clear browser cache

## 📞 Support

Jika ada pertanyaan:
1. Check dokumentasi di atas
2. Lihat console (F12) untuk error details
3. Contact development team

---

**Last Updated:** 27 April 2026
**Status:** ✅ Ready to Use
