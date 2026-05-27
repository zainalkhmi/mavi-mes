import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder,
  FolderOpen,
  FileCode,
  Search,
  Grid,
  List as ListIcon,
  ArrowUpDown,
  Plus,
  Upload,
  Play,
  Edit3,
  Trash2,
  Copy,
  FileJson,
  FileSpreadsheet,
  Info,
  Calendar,
  Activity,
  CheckCircle,
  Clock,
  Terminal,
  Settings,
  X,
  ChevronRight,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import {
  getAllFrontlineApps,
  saveFrontlineApp,
  deleteFrontlineApp
} from '../utils/supabaseFrontlineDB';
import * as projectMgmt from '../utils/projectManagement';
import toast from 'react-hot-toast';

const FileExplorer = () => {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('updated_at'); // 'name' | 'created_at' | 'updated_at'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'DRAFT' | 'PUBLISHED' | 'PENDING'

  // Folder/Category structure
  const [expandedFolders, setExpandedFolders] = useState({
    root: true,
  });
  const [selectedFolder, setSelectedFolder] = useState('ALL'); // 'ALL', 'Uncategorized', or specific category

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    category: 'Shop Floor',
    description: ''
  });

  const fileInputRef = useRef(null);

  // Load apps
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getAllFrontlineApps();
      setApps(data || []);
      // If selected app is still in the list, refresh it
      if (selectedApp) {
        const updatedSelected = data.find(a => a.id === selectedApp.id);
        setSelectedApp(updatedSelected || null);
      }
    } catch (error) {
      console.error('Failed to load apps:', error);
      toast.error('Gagal memuat daftar project.');
    } finally {
      setLoading(false);
    }
  };

  // Categories list derived from apps
  const categories = Array.from(
    new Set(apps.map(app => app.category || 'Uncategorized'))
  ).sort();

  // Toggle folder expansion
  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  // Filter apps
  const filteredApps = apps
    .filter(app => {
      // Category filter
      if (selectedFolder !== 'ALL') {
        const appCat = app.category || 'Uncategorized';
        if (appCat !== selectedFolder) return false;
      }
      // Status filter
      if (statusFilter !== 'ALL') {
        if (app.approval_status !== statusFilter) return false;
      }
      // Search filter
      if (searchTerm.trim() !== '') {
        const search = searchTerm.toLowerCase();
        const matchesName = (app.name || '').toLowerCase().includes(search);
        const matchesDesc = (app.description || '').toLowerCase().includes(search);
        const matchesCat = (app.category || '').toLowerCase().includes(search);
        return matchesName || matchesDesc || matchesCat;
      }
      return true;
    })
    .sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';

      if (sortBy === 'name') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Project count in each category
  const getCategoryCount = (cat) => {
    return apps.filter(app => (app.category || 'Uncategorized') === cat).length;
  };

  // Create Project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectData.name.trim()) {
      toast.error('Nama project tidak boleh kosong');
      return;
    }

    const defaultApp = {
      name: newProjectData.name.trim(),
      category: newProjectData.category || 'Shop Floor',
      description: newProjectData.description.trim(),
      config: {
        steps: [
          {
            id: 'screen_1',
            title: 'Screen 1',
            stepType: 'Screen',
            cycleTimeSeconds: 60,
            formSubmit: {
              isEnabled: false,
              targetTable: '',
              mapping: []
            },
            components: [],
            triggers: []
          }
        ]
      },
      version: 1,
      approval_status: 'DRAFT',
      is_published: false
    };

    const loadingToast = toast.loading('Membuat project baru...');
    try {
      const saved = await saveFrontlineApp(defaultApp);
      toast.success('Project berhasil dibuat!', { id: loadingToast });
      setShowCreateModal(false);
      setNewProjectData({ name: '', category: 'Shop Floor', description: '' });
      await loadProjects();
      setSelectedApp(saved);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Gagal membuat project: ' + error.message, { id: loadingToast });
    }
  };

  // Duplicate Project
  const handleDuplicate = async (app) => {
    const newName = prompt('Masukkan nama untuk duplikat project:', `${app.name} (Copy)`);
    if (newName === null) return;
    if (!newName.trim()) {
      toast.error('Nama project tidak boleh kosong');
      return;
    }

    const loadingToast = toast.loading('Menduplikasi project...');
    try {
      const duplicatedData = projectMgmt.duplicateProject(app, newName.trim());
      const saved = await saveFrontlineApp(duplicatedData);
      toast.success('Project berhasil diduplikasi!', { id: loadingToast });
      await loadProjects();
      setSelectedApp(saved);
    } catch (error) {
      console.error('Duplication failed:', error);
      toast.error('Gagal menduplikasi project: ' + error.message, { id: loadingToast });
    }
  };

  // Rename Project
  const handleRename = async (app) => {
    const newName = prompt('Ubah nama project:', app.name);
    if (newName === null) return;
    if (!newName.trim()) {
      toast.error('Nama project tidak boleh kosong');
      return;
    }

    const loadingToast = toast.loading('Mengubah nama project...');
    try {
      const updated = {
        ...app,
        name: newName.trim()
      };
      const saved = await saveFrontlineApp(updated);
      toast.success('Project berhasil diubah nama!', { id: loadingToast });
      await loadProjects();
      setSelectedApp(saved);
    } catch (error) {
      console.error('Rename failed:', error);
      toast.error('Gagal mengubah nama project: ' + error.message, { id: loadingToast });
    }
  };

  // Delete Project
  const handleDelete = async (app) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus project "${app.name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) {
      const loadingToast = toast.loading('Menghapus project...');
      try {
        await deleteFrontlineApp(app.id);
        toast.success('Project berhasil dihapus!', { id: loadingToast });
        setSelectedApp(null);
        loadProjects();
      } catch (error) {
        console.error('Deletion failed:', error);
        toast.error('Gagal menghapus project: ' + error.message, { id: loadingToast });
      }
    }
  };

  // Export JSON
  const handleExportJSON = (app) => {
    try {
      projectMgmt.exportProjectToJSON(app);
      toast.success('JSON project berhasil di-export');
    } catch (error) {
      toast.error('Gagal export JSON: ' + error.message);
    }
  };

  // Export CSV
  const handleExportCSV = (app) => {
    try {
      projectMgmt.exportProjectAsCSV(app);
      toast.success('CSV summary project berhasil di-export');
    } catch (error) {
      toast.error('Gagal export CSV: ' + error.message);
    }
  };

  // Import JSON click
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Import file selected
  const handleFileImported = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading('Membaca file JSON...');
    try {
      const result = await projectMgmt.importProjectFromJSON(file);
      
      // Save imported app to Supabase
      const saved = await saveFrontlineApp(result.data);
      toast.success('Project berhasil di-import!', { id: loadingToast });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      await loadProjects();
      setSelectedApp(saved);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Gagal import project: ' + error.message, { id: loadingToast });
    }
  };

  // Helper to count components inside steps
  const getComponentCount = (app) => {
    if (!app?.config?.steps) return 0;
    return app.config.steps.reduce((sum, step) => sum + (step.components?.length || 0), 0);
  };

  return (
    <div style={{ height: '100%', display: 'flex', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
      
      {/* LEFT SIDEBAR: Folder Tree */}
      <div style={{
        width: '280px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Project Navigator
          </h3>
        </div>

        {/* Tree List */}
        <div style={{ padding: '16px 8px', flex: 1, overflowY: 'auto' }}>
          
          {/* ROOT FOLDER */}
          <div style={{ marginBottom: '8px' }}>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: selectedFolder === 'ALL' ? '#f1f5f9' : 'transparent',
                fontWeight: selectedFolder === 'ALL' ? 700 : 500,
                color: selectedFolder === 'ALL' ? '#1e293b' : '#475569',
                transition: 'all 0.15s'
              }}
              onClick={() => {
                setSelectedFolder('ALL');
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FolderOpen size={18} color="#3b82f6" />
                <span style={{ fontSize: '0.9rem' }}>Semua Project</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', backgroundColor: '#f8fafc', padding: '2px 6px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                {apps.length}
              </span>
            </div>
          </div>

          {/* FOLDERS LIST */}
          <div style={{ paddingLeft: '8px' }}>
            <div 
              onClick={() => toggleFolder('root')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 4px',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {expandedFolders.root ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>Kategori</span>
            </div>

            {expandedFolders.root && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px', paddingLeft: '4px' }}>
                {categories.map((cat, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedFolder(cat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px 8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: selectedFolder === cat ? '#eff6ff' : 'transparent',
                      color: selectedFolder === cat ? '#2563eb' : '#475569',
                      fontWeight: selectedFolder === cat ? 700 : 500,
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedFolder !== cat) e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedFolder !== cat) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <Folder size={16} color={selectedFolder === cat ? '#2563eb' : '#64748b'} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.85rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {cat}
                      </span>
                    </div>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: selectedFolder === cat ? '#2563eb' : '#94a3b8', 
                      backgroundColor: selectedFolder === cat ? '#dbeafe' : '#f1f5f9',
                      padding: '1px 6px', 
                      borderRadius: '10px',
                      fontWeight: 600
                    }}>
                      {getCategoryCount(cat)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CENTER REGION: Project list/grid */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Toolbar */}
        <div style={{
          padding: '20px 32px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              File Explorer
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              {selectedFolder === 'ALL' ? 'Semua Proyek' : `Kategori: ${selectedFolder}`} &bull; {filteredApps.length} item
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleImportClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                backgroundColor: 'white',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            >
              <Upload size={15} />
              Import Project
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImported}
              accept=".json"
              style={{ display: 'none' }}
            />

            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                backgroundColor: '#2563eb',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              <Plus size={16} />
              New Project
            </button>
          </div>
        </div>

        {/* Filters and Sorting bar */}
        <div style={{
          padding: '12px 32px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexShrink: 0
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '320px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={16} />
            <input
              type="text"
              placeholder="Cari nama project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                outline: 'none',
                transition: 'border-color 0.15s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">Semua</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>

            {/* Sort options */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpDown size={14} style={{ color: '#64748b' }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="name">Nama Proyek</option>
                <option value="updated_at">Modifikasi Terakhir</option>
                <option value="created_at">Tanggal Dibuat</option>
              </select>

              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                style={{
                  padding: '6px 8px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>

            {/* Grid / List View Toggle */}
            <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'grid' ? 'white' : 'transparent',
                  color: viewMode === 'grid' ? '#0f172a' : '#94a3b8',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'list' ? 'white' : 'transparent',
                  color: viewMode === 'list' ? '#0f172a' : '#94a3b8',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                <ListIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Apps Workspace Area */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ border: '3px solid #e2e8f0', borderTop: '3px solid #2563eb', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite' }}></div>
              <span>Memuat data project...</span>
            </div>
          ) : filteredApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 40px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <FileCode size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem', fontWeight: 700 }}>Tidak ada project ditemukan</h3>
              <p style={{ color: '#64748b', margin: '8px 0 0 0', fontSize: '0.9rem' }}>
                Buat project baru atau pasang dari App Store untuk memulai.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {filteredApps.map(app => {
                const isSelected = selectedApp && selectedApp.id === app.id;
                const status = app.approval_status || 'DRAFT';
                
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      padding: '20px',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.08)' : '0 2px 4px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '180px',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.04)';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{
                        backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                        color: isSelected ? '#2563eb' : '#64748b',
                        padding: '8px',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FileCode size={20} />
                      </div>
                      
                      {/* Status badge */}
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '20px',
                        backgroundColor: 
                          status === 'PUBLISHED' ? '#dcfce7' :
                          status === 'PENDING' ? '#ffedd5' : '#f1f5f9',
                        color:
                          status === 'PUBLISHED' ? '#15803d' :
                          status === 'PENDING' ? '#c2410c' : '#475569'
                      }}>
                        {status}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {app.name}
                    </h4>

                    <p style={{
                      margin: 0,
                      fontSize: '0.8rem',
                      color: '#64748b',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1
                    }}>
                      {app.description || 'Tidak ada deskripsi.'}
                    </p>

                    <div style={{ 
                      marginTop: '12px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      fontSize: '0.75rem', 
                      color: '#94a3b8', 
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '8px'
                    }}>
                      <span>v{app.version || 1} &bull; {getComponentCount(app)} Komponen</span>
                      <span>{new Date(app.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Nama Project</th>
                    <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Kategori</th>
                    <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Screens</th>
                    <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Terakhir Diperbarui</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map(app => {
                    const isSelected = selectedApp && selectedApp.id === app.id;
                    const status = app.approval_status || 'DRAFT';
                    
                    return (
                      <tr
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td style={{ padding: '14px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FileCode size={18} color="#64748b" />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{app.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                                {app.description || 'Tidak ada deskripsi.'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 24px', fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
                          {app.category || 'Uncategorized'}
                        </td>
                        <td style={{ padding: '14px 24px' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: 
                              status === 'PUBLISHED' ? '#dcfce7' :
                              status === 'PENDING' ? '#ffedd5' : '#f1f5f9',
                            color:
                              status === 'PUBLISHED' ? '#15803d' :
                              status === 'PENDING' ? '#c2410c' : '#475569'
                          }}>
                            {status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 24px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                          {app.config?.steps?.length || 1} Layar
                        </td>
                        <td style={{ padding: '14px 24px', fontSize: '0.85rem', color: '#64748b' }}>
                          {new Date(app.updated_at).toLocaleDateString()} {new Date(app.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR: Project Details & Actions */}
      <div style={{
        width: '320px',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        {selectedApp ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* Sidebar Details Header */}
            <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid #f1f5f9', position: 'relative' }}>
              <button
                onClick={() => setSelectedApp(null)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#94a3b8'
                }}
              >
                <X size={18} />
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: '#2563eb',
                  backgroundColor: '#eff6ff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>
                  v{selectedApp.version || 1}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  {selectedApp.category || 'Uncategorized'}
                </span>
              </div>
              
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', wordBreak: 'break-word', paddingRight: '20px' }}>
                {selectedApp.name}
              </h3>
            </div>

            {/* Scrollable details */}
            <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Description */}
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Deskripsi
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {selectedApp.description || 'Tidak ada deskripsi.'}
                </p>
              </div>

              {/* Specs / Analytics */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Spesifikasi Proyek
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569' }}>
                    <span style={{ color: '#94a3b8' }}>Jumlah Layar:</span>
                    <span style={{ fontWeight: 700 }}>{selectedApp.config?.steps?.length || 1}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569' }}>
                    <span style={{ color: '#94a3b8' }}>Total Komponen:</span>
                    <span style={{ fontWeight: 700 }}>{getComponentCount(selectedApp)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569' }}>
                    <span style={{ color: '#94a3b8' }}>Tabel Terkait:</span>
                    <span style={{ fontWeight: 700 }}>{selectedApp.config?.appTables?.length || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569' }}>
                    <span style={{ color: '#94a3b8' }}>Status Persetujuan:</span>
                    <span style={{ fontWeight: 700, color: selectedApp.approval_status === 'PUBLISHED' ? '#16a34a' : '#475569' }}>
                      {selectedApp.approval_status || 'DRAFT'}
                    </span>
                  </div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: 0 }} />

              {/* Core Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => navigate(`/builder?appId=${selectedApp.id}`)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '11px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#2563eb',
                    fontWeight: 700,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dbeafe'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                >
                  <Edit3 size={15} />
                  Edit di App Builder
                </button>

                <button
                  onClick={() => navigate(`/player?appId=${selectedApp.id}`)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '11px',
                    backgroundColor: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    fontWeight: 700,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#bbf7d0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#dcfce7'; }}
                >
                  <Play size={15} />
                  Jalankan (App Player)
                </button>

                <button
                  onClick={() => navigate(`/terminal/${selectedApp.id}`)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '11px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    fontWeight: 700,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                >
                  <Terminal size={15} />
                  Buka di Live Terminal
                </button>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: 0 }} />

              {/* Maintenance / Project Actions */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Utilitas Proyek
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  
                  {/* Duplicate */}
                  <button
                    onClick={() => handleDuplicate(selectedApp)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: '#475569',
                      borderRadius: '6px',
                      textAlign: 'left',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Copy size={14} color="#64748b" />
                    Duplikasi Project
                  </button>

                  {/* Rename */}
                  <button
                    onClick={() => handleRename(selectedApp)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: '#475569',
                      borderRadius: '6px',
                      textAlign: 'left',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Edit3 size={14} color="#64748b" />
                    Ubah Nama Project
                  </button>

                  {/* Export JSON */}
                  <button
                    onClick={() => handleExportJSON(selectedApp)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: '#475569',
                      borderRadius: '6px',
                      textAlign: 'left',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FileJson size={14} color="#64748b" />
                    Export Project (JSON)
                  </button>

                  {/* Export CSV Summary */}
                  <button
                    onClick={() => handleExportCSV(selectedApp)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: '#475569',
                      borderRadius: '6px',
                      textAlign: 'left',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FileSpreadsheet size={14} color="#64748b" />
                    Export Summary (CSV)
                  </button>

                  <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(selectedApp)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: '#dc2626',
                      fontWeight: 600,
                      borderRadius: '6px',
                      textAlign: 'left',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Trash2 size={14} color="#ef4444" />
                    Hapus Project
                  </button>

                </div>
              </div>

              {/* History timestamps */}
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.7rem', color: '#94a3b8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={12} />
                  <span>Dibuat: {new Date(selectedApp.created_at).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={12} />
                  <span>Diperbarui: {new Date(selectedApp.updated_at).toLocaleString()}</span>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            padding: '40px',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            <Info size={32} style={{ marginBottom: '12px' }} />
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#64748b' }}>Project Belum Dipilih</h4>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', lineHeight: 1.4 }}>
              Pilih salah satu project dari daftar untuk melihat detail dan menjalankan tindakan.
            </p>
          </div>
        )}
      </div>

      {/* CREATE NEW PROJECT MODAL */}
      {showCreateModal && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowCreateModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(2px)',
              zIndex: 1000,
              animation: 'fadeIn 0.2s ease'
            }}
          />
          
          {/* Modal Container */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              zIndex: 1001,
              width: '460px',
              maxWidth: '90%',
              overflow: 'hidden',
              animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                Buat Project Baru
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateProject} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                
                {/* Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="proj-name" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                    Nama Project
                  </label>
                  <input
                    id="proj-name"
                    type="text"
                    required
                    placeholder="Contoh: Assembly Line Tracker"
                    value={newProjectData.name}
                    onChange={(e) => setNewProjectData(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Category */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="proj-category" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                    Kategori / Folder
                  </label>
                  <select
                    id="proj-category"
                    value={newProjectData.category}
                    onChange={(e) => setNewProjectData(prev => ({ ...prev, category: e.target.value }))}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Shop Floor">Shop Floor</option>
                    <option value="MES Production Suite">MES Production Suite</option>
                    <option value="Inventory App Suite">Inventory App Suite</option>
                    <option value="Quality">Quality</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="SmartHome / IoT">SmartHome / IoT</option>
                    <option value="Analytic">Analytic</option>
                  </select>
                </div>

                {/* Description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="proj-desc" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                    Deskripsi Project
                  </label>
                  <textarea
                    id="proj-desc"
                    rows={3}
                    placeholder="Tulis ringkasan singkat kegunaan project ini..."
                    value={newProjectData.description}
                    onChange={(e) => setNewProjectData(prev => ({ ...prev, description: e.target.value }))}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 20px',
                    backgroundColor: '#2563eb',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'white',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                  }}
                >
                  Buat Project
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Embedded CSS for spinner & modal animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from {
            transform: translate(-50%, -48%) scale(0.96);
            opacity: 0;
          }
          to {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
      `}</style>
      
    </div>
  );
};

export default FileExplorer;
