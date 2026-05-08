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
  Camera
} from 'lucide-react';
import { uploadManualImage, getSupabaseClient, isSupabaseReady } from '../utils/supabaseManualDB';
import { getStations } from '../utils/database';

const ChatWidget = ({ currentStation, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [stations, setStations] = useState([]);
  const [targetStation, setTargetStation] = useState('ALL'); // 'ALL' or specific station_id
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  const ready = isSupabaseReady();
  const supabase = ready ? getSupabaseClient() : null;

  useEffect(() => {
    if (!ready) return;
    fetchMessages();
    loadStations();
    
    // Subscribe to real-time messages
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages' 
      }, (payload) => {
        const msg = payload.new;
        // Filter: Show if broadcast, or if it's meant for this station, or if I sent it
        const isForMe = !msg.target_station_id || msg.target_station_id === 'ALL' || msg.target_station_id === currentStation;
        const amISender = msg.sender_id === currentUser;
        
        if (isForMe || amISender) {
          setMessages(prev => [...prev, msg]);
          if (isForMe && !amISender) {
            if (isMinimized) {
              setUnreadCount(prev => prev + 1);
              // Play a subtle notification sound if possible
              try { new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3').play(); } catch(e){}
            } else {
              markAsRead(msg.id);
            }
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const updatedMsg = payload.new;
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentStation, currentUser, isMinimized]);

  useEffect(() => {
    if (!isMinimized && messages.length > 0) {
      const unread = messages.filter(m => !m.is_read && m.sender_id !== currentUser);
      if (unread.length > 0) {
        unread.forEach(m => markAsRead(m.id));
      }
    }
  }, [isMinimized, messages.length]);

  const markAsRead = async (msgId) => {
    if (!msgId) return;
    await supabase
      .from('chat_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', msgId);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .or(`target_station_id.is.null,target_station_id.eq.ALL,target_station_id.eq.${currentStation},sender_id.eq.${currentUser}`)
      .order('created_at', { ascending: true })
      .limit(50);
    
    if (data) setMessages(data);
  };

  const loadStations = async () => {
    try {
      const data = await getStations();
      if (data) setStations(data);
    } catch (e) {
      console.warn('Failed to load stations for chat', e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage = {
      sender_id: currentUser,
      sender_name: currentUser,
      station_id: currentStation,
      target_station_id: targetStation === 'ALL' ? null : targetStation,
      content: inputText,
      type: 'TEXT',
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('chat_messages')
      .insert([newMessage]);

    if (error) {
      console.error('Error sending message:', error);
    } else {
      // Optimistic update
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
    }
  };

  const handleStartVideoCall = () => {
    // We'll use Jitsi Meet for a quick robust implementation
    // Generate a unique room name based on the station
    const roomName = `MaviMES_Help_${currentStation.replace(/\s+/g, '_')}_${Date.now()}`;
    const jitsiUrl = `https://meet.jit.si/${roomName}`;
    window.open(jitsiUrl, '_blank', 'width=800,height=600');
    
    // Also send an alert message to the chat
    supabase.from('chat_messages').insert([{
      sender_id: currentUser,
      sender_name: currentUser,
      station_id: currentStation,
      target_station_id: targetStation === 'ALL' ? null : targetStation,
      content: `🚨 **VIDEO CALL REQUESTED** - Station: ${currentStation}. Click to join: ${jitsiUrl}`,
      type: 'ALERT',
      created_at: new Date().toISOString()
    }]);
  };
  
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Create a unique path for the chat media
      const storagePath = `chat-media/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const fileUrl = await uploadManualImage(storagePath, file);
      
      let msgType = 'FILE';
      if (file.type.startsWith('image/')) msgType = 'IMAGE';
      if (file.type.startsWith('video/')) msgType = 'VIDEO';

      const newMessage = {
        sender_id: currentUser,
        sender_name: currentUser,
        station_id: currentStation,
        target_station_id: targetStation === 'ALL' ? null : targetStation,
        content: fileUrl,
        type: msgType,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('chat_messages').insert([newMessage]);
      if (error) throw error;

      // Optimistic update
      setMessages(prev => [...prev, newMessage]);
      console.log('File message sent successfully:', newMessage);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Check Supabase storage settings.');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };
  
  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Cannot access camera. Please check permissions.');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    stopCamera();

    setIsUploading(true);
    try {
      const storagePath = `chat-media/cam_${Date.now()}.jpg`;
      const fileUrl = await uploadManualImage(storagePath, dataUrl);
      
      const newMessage = {
        sender_id: currentUser,
        sender_name: currentUser,
        station_id: currentStation,
        target_station_id: targetStation === 'ALL' ? null : targetStation,
        content: fileUrl,
        type: 'IMAGE',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('chat_messages').insert([newMessage]);
      if (error) throw error;
      setMessages(prev => [...prev, newMessage]);
    } catch (err) {
      console.error('Camera upload failed:', err);
      alert('Failed to upload photo.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!ready) {
    return (
      <div style={{
        position: 'fixed', bottom: '20px', right: '20px',
        width: '350px', height: '500px', backgroundColor: 'white',
        borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '30px', textAlign: 'center',
        zIndex: 1000, border: '1px solid #e2e8f0'
      }}>
        <div style={{ backgroundColor: '#fff1f2', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}>
          <AlertCircle size={40} color="#e11d48" />
        </div>
        <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Supabase Belum Dikonfigurasi</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' }}>
          Fitur chat memerlukan koneksi Supabase. Silakan buka: <br/>
          <strong>System -> Supabase Settings</strong> <br/>
          untuk memasukkan URL dan API Key Anda.
        </p>
        <button 
          onClick={onClose}
          style={{ 
            marginTop: '20px', padding: '10px 20px', borderRadius: '8px',
            backgroundColor: '#0f172a', color: 'white', border: 'none', cursor: 'pointer'
          }}
        >
          Tutup
        </button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div 
        onClick={handleExpand}
        style={{
          position: 'fixed', bottom: '20px', right: '20px',
          backgroundColor: '#001e3c', color: 'white',
          padding: '12px 24px', borderRadius: '30px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '10px',
          cursor: 'pointer', zIndex: 1000, transition: 'all 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <div style={{ position: 'relative' }}>
          <MessageSquare size={20} />
          {unreadCount > 0 && (
            <div style={{
              position: 'absolute', top: '-8px', right: '-8px',
              backgroundColor: '#ef4444', color: 'white',
              fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px',
              border: '2px solid #001e3c', fontWeight: 800,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              {unreadCount}
            </div>
          )}
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Open MES Chat</span>
      </div>
    );
  }

  const handleExpand = () => {
    setUnreadCount(0);
  };

  return (
    <div style={{
      position: 'fixed', 
      bottom: isMaximized ? '0' : '20px', 
      right: isMaximized ? '0' : '20px',
      width: isMaximized ? '100vw' : '380px', 
      height: isMaximized ? '100vh' : '550px',
      backgroundColor: '#e5ddd5', 
      borderRadius: isMaximized ? '0' : '16px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column',
      zIndex: 1000, overflow: 'hidden',
      border: isMaximized ? 'none' : '1px solid #e2e8f0',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Header */}
      <div style={{
        padding: isMaximized ? '20px 30px' : '12px 16px', 
        backgroundColor: '#075e54',
        color: 'white', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: isMaximized ? '45px' : '35px', 
            height: isMaximized ? '45px' : '35px', 
            backgroundColor: '#128c7e', 
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', fontWeight: 900
          }}>
            {currentStation?.[0] || 'M'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: isMaximized ? '1.1rem' : '0.95rem' }}>{currentStation} Support</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 500 }}>online</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button 
            onClick={() => {
              setIsMaximized(!isMaximized);
              setIsMinimized(false);
            }} 
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0.8 }}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          {!isMaximized && (
            <button onClick={() => setIsMinimized(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}><Minimize2 size={20} /></button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}><X size={20} /></button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f0f2f5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#54656f', whiteSpace: 'nowrap' }}>KE STATION:</span>
          <select 
            value={targetStation}
            onChange={e => setTargetStation(e.target.value)}
            style={{ 
              flex: 1, padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d7db',
              fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'white', outline: 'none',
              color: '#111b21'
            }}
          >
            <option value="ALL">SIARKAN KE SEMUA</option>
            <optgroup label="Daftar Station">
              {stations.map(s => (
                <option key={s.id} value={s.id}>{s.name || s.id}</option>
              ))}
            </optgroup>
          </select>
        </div>
        <button 
          onClick={handleStartVideoCall}
          style={{ 
            padding: '6px 12px', borderRadius: '20px', 
            backgroundColor: '#128c7e', color: 'white',
            border: 'none', fontSize: '0.7rem',
            fontWeight: 700, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '6px', cursor: 'pointer'
          }}
        >
          <Video size={12} /> Call
        </button>
      </div>

      {/* Messages Area */}
      <div style={{ 
        flex: 1, overflowY: 'auto', padding: '15px 20px', 
        display: 'flex', flexDirection: 'column', gap: '4px', 
        backgroundImage: 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-doodle-patterns-whatsapp-background.jpg")',
        backgroundSize: '400px'
      }}>
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUser;
          const isAlert = msg.type?.toUpperCase() === 'ALERT';
          
          if (isAlert) {
            return (
              <div key={msg.id || i} style={{ 
                padding: '6px 12px', backgroundColor: '#fff5c4', 
                borderRadius: '8px', color: '#111b21', 
                fontSize: '0.75rem', textAlign: 'center',
                margin: '10px auto', maxWidth: '80%',
                boxShadow: '0 1px 1px rgba(0,0,0,0.1)'
              }}>
                {msg.content}
              </div>
            );
          }

          return (
            <div key={msg.id || i} style={{ 
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              marginBottom: '2px'
            }}>
              <div style={{ 
                padding: '6px 7px 8px 9px',
                borderRadius: '8px',
                borderTopRightRadius: isMe ? '0' : '8px',
                borderTopLeftRadius: isMe ? '8px' : '0',
                backgroundColor: isMe ? '#dcf8c6' : '#ffffff',
                color: '#111b21',
                fontSize: '0.88rem',
                boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                position: 'relative',
                minWidth: '60px'
              }}>
                {!isMe && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#075e54', marginBottom: '2px' }}>
                    {msg.sender_name} @ {msg.station_id}
                  </div>
                )}
                {msg.type?.toUpperCase() === 'IMAGE' && (
                  <img 
                    src={msg.content} 
                    style={{ maxWidth: '100%', borderRadius: '8px', cursor: 'pointer' }} 
                    alt="Chat media" 
                    onClick={() => window.open(msg.content, '_blank')}
                  />
                )}
                {msg.type?.toUpperCase() === 'VIDEO' && (
                  <video 
                    src={msg.content} 
                    controls 
                    style={{ maxWidth: '100%', borderRadius: '8px' }} 
                  />
                )}
                {msg.type?.toUpperCase() === 'FILE' && (
                  <a 
                    href={msg.content} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ 
                      color: isMe ? 'white' : '#2563eb', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      textDecoration: 'underline',
                      fontWeight: 700
                    }}
                  >
                    <File size={16} /> Download File
                  </a>
                )}
                {(msg.type?.toUpperCase() === 'TEXT' || !msg.type) && (
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
                )}
                <div style={{ 
                  fontSize: '0.6rem', 
                  color: '#667781', 
                  marginTop: '2px', 
                  textAlign: 'right', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'flex-end', 
                  gap: '3px'
                }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isMe && (
                    <span style={{ color: msg.is_read ? '#53bdeb' : '#8696a0' }}>
                      {msg.is_read ? <CheckCheck size={14} /> : <Check size={14} />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '10px 16px', backgroundColor: '#f0f2f5', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileUpload}
        />
        
        <button 
          type="button"
          onClick={handleFileSelect}
          disabled={isUploading}
          style={{ 
            background: 'none', border: 'none', color: '#54656f', cursor: 'pointer',
            padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {isUploading ? <Loader2 size={22} className="animate-spin" /> : <Plus size={22} />}
        </button>

        <button 
          type="button"
          onClick={startCamera}
          style={{ 
            background: 'none', border: 'none', color: '#54656f', cursor: 'pointer',
            padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <Camera size={22} />
        </button>

        <form onSubmit={handleSendMessage} style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Ketik pesan"
            style={{ 
              flex: 1, padding: '9px 15px', borderRadius: '8px',
              backgroundColor: 'white', border: 'none',
              fontSize: '0.92rem', outline: 'none',
              color: '#111b21'
            }}
          />
          <button 
            type="submit"
            style={{ 
              width: '42px', height: '42px', borderRadius: '50%',
              backgroundColor: '#00a884', color: 'white',
              border: 'none', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 1px 1px rgba(0,0,0,0.1)'
            }}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
      {/* Camera Modal */}
      {showCamera && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'black', zIndex: 1100, display: 'flex', flexDirection: 'column'
        }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', flex: 1, objectFit: 'cover' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div style={{ 
            padding: '20px', display: 'flex', justifyContent: 'space-around', 
            alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' 
          }}>
            <button 
              onClick={stopCamera}
              style={{ padding: '10px 20px', borderRadius: '30px', border: 'none', backgroundColor: '#54656f', color: 'white', fontWeight: 700, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              onClick={capturePhoto}
              style={{ 
                width: '60px', height: '60px', borderRadius: '50%', border: '4px solid white', 
                backgroundColor: 'red', cursor: 'pointer' 
              }}
            />
            <div style={{ width: '70px' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
