import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  X, 
  Video, 
  User, 
  AlertCircle,
  Minimize2,
  Maximize2,
  Clock,
  Paperclip,
  File,
  Loader2,
  Check,
  CheckCheck,
  Plus,
  Camera,
  Trash2,
  ShieldAlert,
  HardHat,
  Settings,
  ExternalLink,
  MessageCircle,
  Smartphone,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { uploadManualImage, getSupabaseClient, isSupabaseReady, deleteChatMedia } from '../utils/supabaseManualDB';
import { getStations } from '../utils/database';
import { getCurrentUser } from '../utils/auth';
import whatsappService, { WA_PROVIDERS } from '../utils/whatsappService';

const ChatWidget = ({ currentStation, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [stations, setStations] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [view, setView] = useState('CONTACTS');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showWaSettings, setShowWaSettings] = useState(false);
  const [waConfig, setWaConfig] = useState(() => whatsappService.getConfig());
  const [waStatusMsg, setWaStatusMsg] = useState(null);
  const [isTestingWa, setIsTestingWa] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleSaveWaConfig = (updates) => {
    const next = whatsappService.saveConfig(updates);
    setWaConfig(next);
    setWaStatusMsg('✅ Pengaturan WhatsApp tersimpan!');
    setTimeout(() => setWaStatusMsg(null), 3000);
  };

  const handleTestWhatsApp = async () => {
    setIsTestingWa(true);
    setWaStatusMsg(null);
    try {
      const res = await whatsappService.sendMessage({
        sender: currentUser || 'Operator',
        station: currentStation || 'Station-01',
        targetName: selectedContact?.name || 'Supervisor',
        message: '🔔 Test Notification from MAVI MES Chat Widget!'
      });
      if (res.success) {
        setWaStatusMsg('✅ Pesan Test WhatsApp Berhasil Terkirim!');
        if (res.url) {
          window.open(res.url, '_blank');
        }
      } else {
        setWaStatusMsg('⚠️ ' + (res.reason || res.error || 'Gagal mengirim'));
      }
    } catch (e) {
      setWaStatusMsg('❌ Error: ' + e.message);
    } finally {
      setIsTestingWa(false);
    }
  };

  const handleOpenDirectWhatsApp = (targetContact) => {
    const contact = targetContact || selectedContact;
    const targetName = contact?.name || contact?.id || 'Support';
    const lastMsg = filteredMessages[filteredMessages.length - 1]?.content || 'Halo, ada kendala di station ' + currentStation;
    whatsappService.openWhatsAppWeb({
      sender: currentUser,
      station: currentStation,
      targetName,
      message: lastMsg
    });
  };

  const handleFileAttach = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    setShowAttachMenu(false);
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `chat/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from('manuals').upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('manuals').getPublicUrl(path);
      const isImage = file.type.startsWith('image/');
      const targetId = selectedContact?.id === 'ALL' ? null : selectedContact?.id;
      await supabase.from('chat_messages').insert([{
        sender_id: currentUser, sender_name: currentUser, station_id: currentStation,
        target_station_id: targetId, content: urlData.publicUrl,
        type: isImage ? 'IMAGE' : 'FILE', metadata: JSON.stringify({ fileName: file.name, fileSize: file.size, fileType: file.type }),
        created_at: new Date().toISOString()
      }]);

      // Auto-forward to WhatsApp if enabled
      if (waConfig.enabled && waConfig.autoForwardOnSend) {
        whatsappService.sendMessage({
          sender: currentUser,
          station: currentStation,
          targetName: selectedContact?.name || targetId,
          message: isImage ? '📷 [Foto Terkirim]' : '📁 [File Lampiran: ' + file.name + ']',
          mediaUrl: urlData.publicUrl
        }).catch(err => console.warn('WA Forward failed:', err));
      }
    } catch (err) { alert('Upload gagal: ' + err.message); }
    setUploading(false);
    e.target.value = '';
  };

  const handleCameraCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowAttachMenu(false);
    setUploading(true);
    try {
      const path = `chat/cam_${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('manuals').upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('manuals').getPublicUrl(path);
      const targetId = selectedContact?.id === 'ALL' ? null : selectedContact?.id;
      await supabase.from('chat_messages').insert([{
        sender_id: currentUser, sender_name: currentUser, station_id: currentStation,
        target_station_id: targetId, content: urlData.publicUrl, type: 'IMAGE',
        metadata: JSON.stringify({ fileName: 'Camera Photo', fileSize: file.size }),
        created_at: new Date().toISOString()
      }]);

      // Auto-forward photo to WhatsApp
      if (waConfig.enabled && waConfig.autoForwardOnSend) {
        whatsappService.sendMessage({
          sender: currentUser,
          station: currentStation,
          targetName: selectedContact?.name || targetId,
          message: '📷 [Foto Kamera Shopfloor]',
          mediaUrl: urlData.publicUrl
        }).catch(err => console.warn('WA Forward failed:', err));
      }
    } catch (err) { alert('Camera upload gagal: ' + err.message); }
    setUploading(false);
    e.target.value = '';
  };
  
  const userSession = getCurrentUser();
  const userRole = userSession?.role?.toUpperCase() || 'OPERATOR';
  const username = userSession?.username?.toLowerCase() || '';

  const ready = isSupabaseReady();
  const supabase = ready ? getSupabaseClient() : null;

  useEffect(() => {
    if (!ready) return;
    fetchMessages();
    loadStations();
    
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages' 
      }, (payload) => {
        const msg = payload.new;
        const targetId = String(msg.target_station_id || '').toLowerCase();
        
        const isAdminTarget = ['ADMINISTRATOR', 'ACCOUNT_OWNER', 'ADMIN'].includes(userRole);
        const isEngineerTarget = ['CONNECTOR_SUPERVISOR', 'STATION_SUPERVISOR', 'TABLES_SUPERVISOR', 'APPLICATION_ENGINEER', 'ENGINEER'].includes(userRole);

        const isGroup = !targetId || targetId === 'all';
        const isForMe = targetId === String(currentStation || '').toLowerCase() || 
                        (targetId === 'admin' && isAdminTarget) ||
                        (targetId === 'engineer' && isEngineerTarget) ||
                        (targetId === username);
        const amISender = String(msg.sender_id || '').toLowerCase() === username || msg.sender_id === currentUser;
        
        if (isGroup || isForMe || amISender) {
          setMessages(prev => [...prev, msg]);
          if ((isGroup || isForMe) && !amISender) {
            if (isMinimized) {
              setUnreadCount(prev => prev + 1);
            } else {
              markAsRead(msg.id);
            }
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, (payload) => {
        const updatedMsg = payload.new;
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentStation, currentUser, username, userRole, isMinimized]);

  useEffect(() => {
    if (!isMinimized && view === 'CHAT' && selectedContact && messages.length > 0) {
      const contactId = String(selectedContact.id || '').toLowerCase();
      const unreadForThisChat = messages.filter(m => {
        const mTargetId = String(m.target_station_id || '').toLowerCase();
        const mSenderId = String(m.sender_id || '').toLowerCase();
        const isMeSender = mSenderId === username || m.sender_id === currentUser;
        
        if (m.is_read || isMeSender) return false;
        
        if (selectedContact.id === 'ALL') {
          return !mTargetId || mTargetId === 'all';
        } else {
          return m.station_id === selectedContact.id || mSenderId === contactId;
        }
      });
      if (unreadForThisChat.length > 0) {
        unreadForThisChat.forEach(m => markAsRead(m.id));
      }
    }
    const totalUnread = messages.filter(m => !m.is_read && String(m.sender_id || '').toLowerCase() !== username && m.sender_id !== currentUser).length;
    setUnreadCount(totalUnread);
  }, [isMinimized, view, selectedContact, messages.length, username]);

  const markAsRead = async (msgId) => {
    if (!msgId || !supabase) return;
    await supabase.from('chat_messages').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', msgId);
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .or(`target_station_id.is.null,target_station_id.eq.ALL,target_station_id.eq."${currentStation}",station_id.eq."${currentStation}"`)
      .order('created_at', { ascending: true })
      .limit(200);
    if (data) setMessages(data);
  };

  const loadStations = async () => {
    try {
      const data = await getStations();
      if (data) setStations(data);
    } catch (e) { console.warn('Failed to load stations', e); }
  };

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !supabase) return;

    const targetId = selectedContact?.id === 'ALL' ? null : selectedContact?.id;
    const newMessage = {
      sender_id: currentUser,
      sender_name: currentUser,
      station_id: currentStation,
      target_station_id: targetId,
      content: inputText,
      type: 'TEXT',
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('chat_messages').insert([newMessage]);
    if (error) {
      alert('Gagal mengirim pesan.');
    } else {
      setMessages(prev => [...prev, { ...newMessage, id: 'temp-' + Date.now() }]);
      setInputText('');

      // Auto-forward message to WhatsApp
      if (waConfig.enabled && waConfig.autoForwardOnSend) {
        whatsappService.sendMessage({
          sender: currentUser,
          station: currentStation,
          targetName: selectedContact?.name || targetId,
          message: inputText
        }).catch(err => console.warn('WA Forward failed:', err));
      }
    }
  };

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setView('CHAT');
  };

  const filteredMessages = messages.filter(m => {
    if (!selectedContact) return false;
    if (selectedContact.id === 'ALL') {
      return !m.target_station_id || m.target_station_id === 'ALL';
    } else {
      const isFromMeToStation = m.station_id === currentStation && m.target_station_id === selectedContact.id;
      const isFromStationToMe = m.station_id === selectedContact.id && m.target_station_id === currentStation;
      return isFromMeToStation || isFromStationToMe;
    }
  });

  const getContactMetadata = (contactId) => {
    let chatMessages = [];
    if (contactId === 'ALL') {
      chatMessages = messages.filter(m => !m.target_station_id || m.target_station_id === 'ALL');
    } else {
      chatMessages = messages.filter(m => 
        (m.station_id === currentStation && m.target_station_id === contactId) ||
        (m.station_id === contactId && m.target_station_id === currentStation)
      );
    }
    const lastMsg = chatMessages[chatMessages.length - 1];
    const unread = chatMessages.filter(m => !m.is_read && m.sender_id !== currentUser).length;
    return { lastMsg, unread };
  };

  if (!ready) return null;

  if (isMinimized) {
    return (
      <div onClick={() => setIsMinimized(false)} style={{ position: 'fixed', bottom: '80px', right: '20px', backgroundColor: '#001e3c', color: 'white', padding: '12px 24px', borderRadius: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', zIndex: 1000 }}>
        <MessageSquare size={20} />
        {unreadCount > 0 && <div style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ef4444', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', border: '2px solid #001e3c', fontWeight: 800 }}>{unreadCount}</div>}
        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>MES Chat</span>
        {waConfig.enabled && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#25d366' }} title="WhatsApp Connected" />}
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: isMaximized ? '0' : '80px', right: isMaximized ? '0' : '20px',
      width: isMaximized ? '100vw' : '380px', height: isMaximized ? '100vh' : '550px',
      backgroundColor: '#f0f2f5', borderRadius: isMaximized ? '0' : '16px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', zIndex: 1000, overflow: 'hidden'
    }}>
      <div style={{ padding: '12px 16px', backgroundColor: '#075e54', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {view === 'CHAT' && <button onClick={() => setView('CONTACTS')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Minimize2 size={20} style={{ transform: 'rotate(90deg)' }} /></button>}
          <div style={{ width: '35px', height: '35px', backgroundColor: '#128c7e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
            {view === 'CHAT' ? (selectedContact?.name?.[0] || 'C') : (currentStation?.[0] || 'M')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{view === 'CHAT' ? selectedContact?.name : `${currentStation} Support`}</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>online</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* WhatsApp Direct Share Button */}
          {view === 'CHAT' && (
            <button
              onClick={handleOpenDirectWhatsApp}
              style={{
                background: 'rgba(37, 211, 102, 0.25)',
                border: '1px solid rgba(37, 211, 102, 0.5)',
                color: '#25d366',
                borderRadius: '6px',
                padding: '4px 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.65rem',
                fontWeight: 700
              }}
              title="Kirim / Buka di WhatsApp"
            >
              <MessageCircle size={14} />
              <span>WA</span>
            </button>
          )}

          {/* WhatsApp Settings Modal Toggle */}
          <button
            onClick={() => setShowWaSettings(prev => !prev)}
            style={{
              background: showWaSettings ? 'rgba(255,255,255,0.2)' : 'none',
              border: 'none',
              color: waConfig.enabled ? '#4ade80' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="WhatsApp Integration Settings"
          >
            <Settings size={18} />
          </button>

          {view === 'CHAT' && (
            <>
              <button onClick={() => alert('Video call coming soon!')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.9 }} title="Video Call"><Video size={18} /></button>
              <button onClick={() => alert('Voice call coming soon!')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.9 }} title="Voice Call">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </button>
            </>
          )}
          <button onClick={() => setIsMaximized(!isMaximized)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>{isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={18} /></button>
        </div>
      </div>

      {/* WhatsApp Integration Settings Modal */}
      {showWaSettings && (
        <div style={{
          position: 'absolute',
          top: '56px',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          zIndex: 50,
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={16} color="white" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>WhatsApp Integration</span>
            </div>
            <button onClick={() => setShowWaSettings(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
          </div>

          {waStatusMsg && (
            <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', fontSize: '0.78rem', fontWeight: 600 }}>
              {waStatusMsg}
            </div>
          )}

          {/* Enable Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Enable WhatsApp Gateway</div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Forward chat messages directly to WhatsApp</div>
            </div>
            <input
              type="checkbox"
              checked={waConfig.enabled}
              onChange={e => handleSaveWaConfig({ enabled: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          {/* Provider Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>WhatsApp Provider</label>
            <select
              value={waConfig.provider}
              onChange={e => {
                const p = WA_PROVIDERS.find(x => x.id === e.target.value);
                handleSaveWaConfig({ provider: e.target.value, apiUrl: p?.defaultUrl || waConfig.apiUrl });
              }}
              style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.82rem', outline: 'none' }}
            >
              {WA_PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* API Key / Token (for Fonnte / Wablas / Custom) */}
          {waConfig.provider !== 'DIRECT_LINK' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>API Key / Token</label>
                <input
                  type="password"
                  placeholder="Paste your Fonnte / Wablas API Token here"
                  value={waConfig.apiKey || ''}
                  onChange={e => setWaConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  onBlur={() => handleSaveWaConfig({ apiKey: waConfig.apiKey })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Gateway Endpoint URL</label>
                <input
                  type="text"
                  placeholder="https://api.fonnte.com/send"
                  value={waConfig.apiUrl || ''}
                  onChange={e => setWaConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                  onBlur={() => handleSaveWaConfig({ apiUrl: waConfig.apiUrl })}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </>
          )}

          {/* Department WhatsApp Numbers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #334155', paddingTop: '10px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>Target Phone Numbers (628...)</span>
            
            {['LOGISTIC', 'MAINTENANCE', 'QUALITY', 'SUPERVISOR'].map(dept => (
              <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '100px', fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1' }}>{dept}:</span>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={waConfig.departmentPhones?.[dept] || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setWaConfig(prev => ({
                      ...prev,
                      departmentPhones: { ...prev.departmentPhones, [dept]: val }
                    }));
                  }}
                  onBlur={() => handleSaveWaConfig({ departmentPhones: waConfig.departmentPhones })}
                  style={{ flex: 1, padding: '6px 10px', backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}
                />
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '12px' }}>
            <button
              onClick={handleTestWhatsApp}
              disabled={isTestingWa}
              style={{
                flex: 1,
                padding: '9px 12px',
                backgroundColor: '#25d366',
                color: '#0f172a',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {isTestingWa ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
              Test Kirim WhatsApp
            </button>
            <button
              onClick={() => setShowWaSettings(false)}
              style={{
                padding: '9px 16px',
                backgroundColor: '#334155',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {view === 'CONTACTS' ? (
        <div style={{ flex: 1, backgroundColor: 'white', overflowY: 'auto' }}>
          {/* Quick Access to Linked WhatsApp Web */}
          <div style={{ padding: '8px 12px', backgroundColor: '#e7fce8', borderBottom: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={14} color="white" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>WhatsApp Web Terpaut</span>
                <span style={{ fontSize: '0.62rem', color: '#15803d' }}>Session aktif di browser ini</span>
              </div>
            </div>
            <button
              onClick={() => whatsappService.openWhatsAppWeb()}
              style={{
                padding: '4px 8px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Buka WhatsApp Web di popup / tab aktif"
            >
              <ExternalLink size={11} /> Buka Web
            </button>
          </div>

          <div style={{ padding: '10px 15px', backgroundColor: '#f6f6f6' }}>
            <input placeholder="Cari station..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.85rem' }} />
          </div>
          <ContactItem contact={{ id: 'ALL', name: 'Group Chat' }} metadata={getContactMetadata('ALL')} onClick={() => handleSelectContact({ id: 'ALL', name: 'Group Chat' })} isGroup />
          
          <div style={{ padding: '8px 15px', fontSize: '0.65rem', fontWeight: 800, color: '#00a884', borderBottom: '1px solid #f0f2f5' }}>SUPPORT</div>
          <ContactItem contact={{ id: 'admin', name: 'System Admin' }} metadata={getContactMetadata('admin')} onClick={() => handleSelectContact({ id: 'admin', name: 'System Admin' })} isSupport icon={<ShieldAlert size={18}/>} />
          <ContactItem contact={{ id: 'engineer', name: 'Manufacturing Engineer' }} metadata={getContactMetadata('engineer')} onClick={() => handleSelectContact({ id: 'engineer', name: 'Manufacturing Engineer' })} isSupport icon={<HardHat size={18}/>} />
          <ContactItem contact={{ id: 'logistic', name: 'Logistic Support' }} metadata={getContactMetadata('logistic')} onClick={() => handleSelectContact({ id: 'logistic', name: 'Logistic Support' })} isSupport icon={<Smartphone size={18}/>} />

          <div style={{ padding: '8px 15px', fontSize: '0.65rem', fontWeight: 800, color: '#00a884', borderBottom: '1px solid #f0f2f5' }}>STATIONS</div>
          {stations.filter(s => s.id !== currentStation && (s.name || s.id).toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
            <ContactItem key={s.id} contact={s} metadata={getContactMetadata(s.id)} onClick={() => handleSelectContact(s)} />
          ))}
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundImage: 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-doodle-patterns-whatsapp-background.jpg")', backgroundSize: '400px' }}>
            {filteredMessages.map((msg, i) => {
              const isMe = msg.sender_id === currentUser;
              return (
                <div key={msg.id || i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%', marginBottom: '2px' }}>
                  <div style={{ padding: '6px 9px', borderRadius: '8px', backgroundColor: isMe ? '#dcf8c6' : 'white', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)', fontSize: '0.88rem' }}>
                    {!isMe && selectedContact.id === 'ALL' && <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#075e54', marginBottom: '2px' }}>{msg.sender_name} @ {msg.station_id}</div>}
                    {msg.type === 'IMAGE' ? (
                      <img src={msg.content} alt="photo" style={{ maxWidth: '100%', borderRadius: '6px', cursor: 'pointer' }} onClick={() => window.open(msg.content, '_blank')} />
                    ) : msg.type === 'FILE' ? (
                      <a href={msg.content} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: isMe ? '#c5e8b0' : '#f5f5f5', borderRadius: '6px', textDecoration: 'none', color: '#1e293b' }}>
                        <File size={24} color="#6b7280" />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(() => { try { return JSON.parse(msg.metadata)?.fileName; } catch { return 'File'; } })()}</div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{(() => { try { const s = JSON.parse(msg.metadata)?.fileSize; return s ? (s/1024).toFixed(1)+' KB' : ''; } catch { return ''; } })()}</div>
                        </div>
                      </a>
                    ) : (
                      <div>{msg.content}</div>
                    )}
                    <div style={{ fontSize: '0.6rem', color: '#667781', textAlign: 'right', marginTop: '2px' }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          {/* Attachment Menu Popup */}
          {showAttachMenu && (
            <div style={{ position: 'absolute', bottom: '65px', left: '16px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 8px 25px rgba(0,0,0,0.15)', padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', zIndex: 10, minWidth: '220px' }}>
              {[
                { icon: <File size={22}/>, label: 'Document', color: '#7c3aed', action: () => fileInputRef.current?.click() },
                { icon: <Camera size={22}/>, label: 'Camera', color: '#ec4899', action: () => cameraInputRef.current?.click() },
                { icon: <Plus size={22}/>, label: 'Gallery', color: '#2563eb', action: () => { const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.onchange=(e)=>handleFileAttach(e); inp.click(); }},
              ].map((item, i) => (
                <button key={i} onClick={item.action} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', border: 'none', background: 'none', cursor: 'pointer', padding: '10px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: item.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{item.label}</span>
                </button>
              ))}
            </div>
          )}
          {/* Hidden file inputs */}
          <input ref={fileInputRef} type="file" accept="*/*" style={{ display: 'none' }} onChange={handleFileAttach} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleCameraCapture} />
          {/* WhatsApp-style Input Bar */}
          <form onSubmit={handleSendMessage} style={{ padding: '8px 10px', backgroundColor: '#f0f2f5', display: 'flex', gap: '6px', alignItems: 'center', position: 'relative' }}>
            <button type="button" onClick={() => setShowAttachMenu(!showAttachMenu)} style={{ width: '38px', height: '38px', borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#54656f', transform: showAttachMenu ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>
              {uploading ? <Loader2 size={22} className="spin" /> : <Plus size={24} />}
            </button>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: 'white', borderRadius: '21px', padding: '4px 12px' }}>
              <input value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Ketik pesan" style={{ flex: 1, padding: '6px 0', border: 'none', outline: 'none', fontSize: '0.9rem' }} />
              <button type="button" onClick={() => cameraInputRef.current?.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#54656f', padding: '4px' }}><Camera size={20} /></button>
            </div>
            <button type="submit" style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#00a884', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Send size={20} /></button>
          </form>
        </>
      )}
    </div>
  );
};

const ContactItem = ({ contact, metadata, onClick, isGroup, isSupport, icon }) => {
  const { lastMsg, unread } = metadata;
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #f0f2f5' }}>
      <div style={{ width: '45px', height: '45px', backgroundColor: isGroup ? '#25d366' : isSupport ? '#ef4444' : '#128c7e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
        {icon || (contact.name?.[0] || 'C')}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{contact.name || contact.id}</span>
          {lastMsg && <span style={{ fontSize: '0.7rem', color: '#667781' }}>{new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', color: '#667781', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastMsg ? lastMsg.content : 'Belum ada pesan'}</span>
          {unread > 0 && <div style={{ backgroundColor: '#25d366', color: 'white', borderRadius: '10px', padding: '2px 7px', fontSize: '0.7rem', fontWeight: 700 }}>{unread}</div>}
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
