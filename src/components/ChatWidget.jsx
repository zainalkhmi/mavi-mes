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
  HardHat
} from 'lucide-react';
import { uploadManualImage, getSupabaseClient, isSupabaseReady, deleteChatMedia } from '../utils/supabaseManualDB';
import { getStations } from '../utils/database';
import { getCurrentUser } from '../utils/auth';

const ChatWidget = ({ currentStation, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [stations, setStations] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null); // { id: 'ALL', name: 'Group Chat' } or station object
  const [view, setView] = useState('CONTACTS'); // 'CONTACTS' or 'CHAT'
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); 
  const messagesEndRef = useRef(null);
  
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
        
        const isGroup = !targetId || targetId === 'all';
        const isForMe = targetId === String(currentStation || '').toLowerCase() || 
                        (targetId === 'admin' && userRole === 'ADMIN') ||
                        (targetId === 'engineer' && userRole === 'ENGINEER') ||
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
      <div onClick={() => setIsMinimized(false)} style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: '#001e3c', color: 'white', padding: '12px 24px', borderRadius: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', zIndex: 1000 }}>
        <MessageSquare size={20} />
        {unreadCount > 0 && <div style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ef4444', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', border: '2px solid #001e3c', fontWeight: 800 }}>{unreadCount}</div>}
        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>MES Chat</span>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: isMaximized ? '0' : '20px', right: isMaximized ? '0' : '20px',
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
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setIsMaximized(!isMaximized)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>{isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}</button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
        </div>
      </div>

      {view === 'CONTACTS' ? (
        <div style={{ flex: 1, backgroundColor: 'white', overflowY: 'auto' }}>
          <div style={{ padding: '10px 15px', backgroundColor: '#f6f6f6' }}>
            <input placeholder="Cari station..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.85rem' }} />
          </div>
          <ContactItem contact={{ id: 'ALL', name: 'Group Chat' }} metadata={getContactMetadata('ALL')} onClick={() => handleSelectContact({ id: 'ALL', name: 'Group Chat' })} isGroup />
          
          <div style={{ padding: '8px 15px', fontSize: '0.65rem', fontWeight: 800, color: '#00a884', borderBottom: '1px solid #f0f2f5' }}>SUPPORT</div>
          <ContactItem contact={{ id: 'admin', name: 'System Admin' }} metadata={getContactMetadata('admin')} onClick={() => handleSelectContact({ id: 'admin', name: 'System Admin' })} isSupport icon={<ShieldAlert size={18}/>} />
          <ContactItem contact={{ id: 'engineer', name: 'Manufacturing Engineer' }} metadata={getContactMetadata('engineer')} onClick={() => handleSelectContact({ id: 'engineer', name: 'Manufacturing Engineer' })} isSupport icon={<HardHat size={18}/>} />

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
                    <div>{msg.content}</div>
                    <div style={{ fontSize: '0.6rem', color: '#667781', textAlign: 'right', marginTop: '2px' }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} style={{ padding: '10px 16px', backgroundColor: '#f0f2f5', display: 'flex', gap: '8px' }}>
            <input value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Ketik pesan" style={{ flex: 1, padding: '9px 15px', borderRadius: '8px', border: 'none', outline: 'none' }} />
            <button type="submit" style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#00a884', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={20} /></button>
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
