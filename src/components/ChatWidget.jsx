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
  Clock
} from 'lucide-react';
import { getSupabaseClient } from '../utils/supabaseManualDB';
import { getStations } from '../utils/database';

const ChatWidget = ({ currentStation, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [stations, setStations] = useState([]);
  const [targetStation, setTargetStation] = useState('ALL'); // 'ALL' or specific station_id
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const messagesEndRef = useRef(null);
  const supabase = getSupabaseClient();

  useEffect(() => {
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
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        style={{
          position: 'fixed', bottom: '20px', right: '20px',
          backgroundColor: '#001e3c', color: 'white',
          padding: '12px 20px', borderRadius: '30px',
          display: 'flex', alignItems: 'center', gap: '10px',
          cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000, transition: 'transform 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <MessageSquare size={20} />
        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Open MES Chat</span>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px',
      width: '350px', height: '500px',
      backgroundColor: 'white', borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column',
      zIndex: 1000, overflow: 'hidden',
      border: '1px solid #e2e8f0'
    }}>
      {/* Header */}
      <div style={{
        padding: '15px 20px', backgroundColor: '#001e3c',
        color: 'white', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%' }} />
          <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Shop Floor Collab</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setIsMinimized(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Minimize2 size={18} /></button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={18} /></button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ padding: '10px 15px', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#fdfdfd' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', whiteSpace: 'nowrap' }}>SEND TO:</span>
          <select 
            value={targetStation}
            onChange={e => setTargetStation(e.target.value)}
            style={{ 
              flex: 1, padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0',
              fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#f8fafc', outline: 'none'
            }}
          >
            <option value="ALL">ALL STATIONS (Broadcast)</option>
            <optgroup label="Workstations">
              {stations.map(s => (
                <option key={s.id} value={s.id}>{s.name || s.id}</option>
              ))}
            </optgroup>
          </select>
        </div>
        <button 
          onClick={handleStartVideoCall}
          style={{ 
            padding: '8px', borderRadius: '8px', 
            backgroundColor: '#eff6ff', color: '#1d4ed8',
            border: '1px solid #dbeafe', fontSize: '0.75rem',
            fontWeight: 700, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '6px', cursor: 'pointer'
          }}
        >
          <Video size={14} /> Video Support
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: '#f8fafc' }}>
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUser;
          const isAlert = msg.type === 'ALERT';
          
          if (isAlert) {
            return (
              <div key={msg.id || i} style={{ padding: '10px', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '8px', color: '#9a3412', fontSize: '0.8rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 800, marginBottom: '4px' }}>
                  <AlertCircle size={14} /> ALERT FROM {msg.station_id}
                </div>
                {msg.content}
              </div>
            );
          }

          return (
            <div key={msg.id || i} style={{ 
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              maxWidth: '85%'
            }}>
              <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '4px', textAlign: isMe ? 'right' : 'left' }}>
                {msg.sender_name} @ {msg.station_id}
              </div>
              <div style={{ 
                padding: '10px 14px',
                borderRadius: '12px',
                borderTopRightRadius: isMe ? '2px' : '12px',
                borderTopLeftRadius: isMe ? '12px' : '2px',
                backgroundColor: isMe ? '#001e3c' : 'white',
                color: isMe ? 'white' : '#0f172a',
                fontSize: '0.85rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                border: isMe ? 'none' : '1px solid #e2e8f0'
              }}>
                {msg.content}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '4px', textAlign: isMe ? 'right' : 'left', display: 'flex', alignItems: 'center', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: '4px' }}>
                <Clock size={10} /> {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} style={{ padding: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px' }}>
        <input 
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Type your message..."
          style={{ 
            flex: 1, padding: '10px 15px', borderRadius: '24px',
            backgroundColor: '#f1f5f9', border: 'none',
            fontSize: '0.85rem', outline: 'none'
          }}
        />
        <button 
          type="submit"
          style={{ 
            width: '36px', height: '36px', borderRadius: '50%',
            backgroundColor: '#001e3c', color: 'white',
            border: 'none', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer'
          }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatWidget;
