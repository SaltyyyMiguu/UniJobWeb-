import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import api, { API_BASE_URL } from '../../api/axios';
import StudentLayout from '../../components/layouts/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Send, MessageSquare, Wifi, WifiOff, Building2, Lock, ArrowLeft } from 'lucide-react';

// Strip a trailing /api if present — Socket.IO treats any path segment
// after the origin as a namespace, so a URL ending in /api would try to
// connect to an "/api" namespace (which the server never registers)
// instead of the default namespace, and fail silently into a reconnect
// loop. API_BASE_URL itself is just the bare origin in this codebase, but
// this guards against VITE_API_URL ever being configured with /api on the
// hosting side.
const SOCKET_URL = API_BASE_URL.replace(/\/api$/, '');

export default function StudentMessages() {
  const { user } = useAuth();
  const { c } = useTheme();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadByRoom, setUnreadByRoom] = useState({}); // roomId → count
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const activeRoomRef = useRef(null);

  useEffect(() => { activeRoomRef.current = activeRoom; }, [activeRoom]);

  useEffect(() => {
    api.get('/student/chats').then(res => {
      setRooms(res.data);
      // Seed unread badges from persisted state, so conversations with unread
      // messages from before this page was opened show up immediately.
      setUnreadByRoom(prev => {
        const seeded = { ...prev };
        res.data.forEach(room => { if (room.unreadCount > 0) seeded[room.id] = room.unreadCount; });
        return seeded;
      });
    }).catch(console.error);

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Register user for personal notification room
      if (user?.id) socket.emit('register', { userId: user.id });
      if (activeRoomRef.current) {
        socket.emit('joinRoom', { roomId: activeRoomRef.current.id });
      }
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socket.on('messageHistory', (history) => {
      setMessages(history);
      setLoading(false);
    });

    socket.on('receiveMessage', (msg) => {
      if (activeRoomRef.current && msg.chatRoomId === activeRoomRef.current.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    // Real-time unread notification from another room
    socket.on('new_unread_message', ({ roomId }) => {
      setUnreadByRoom(prev => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }));
    });

    return () => socket.disconnect();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const joinRoom = useCallback((room) => {
    if (activeRoomRef.current?.id === room.id) return;
    setMessages([]);
    setLoading(true);
    setActiveRoom(room);
    // Clear unread badge for this room
    setUnreadByRoom(prev => ({ ...prev, [room.id]: 0 }));
    socketRef.current.emit('joinRoom', { roomId: room.id });
    socketRef.current.emit('getHistory', { roomId: room.id, userId: user?.id });
  }, [user]);

  // Mobile-only: return to the conversation list without losing socket state
  const closeChat = useCallback(() => {
    if (activeRoomRef.current && socketRef.current) {
      socketRef.current.emit('leaveRoom', { roomId: activeRoomRef.current.id });
    }
    setActiveRoom(null);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !activeRoomRef.current || !socketRef.current?.connected) return;
    if (activeRoomRef.current.isLocked) return;
    socketRef.current.emit('sendMessage', {
      roomId: activeRoomRef.current.id,
      senderUserId: user.id,
      content: trimmed,
    });
    setInput('');
  }, [input, user]);

  const avatarLetter = (name) => name?.[0]?.toUpperCase() || '?';
  const isLocked = activeRoom?.isLocked;

  return (
    <StudentLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 className="page-title">Messages</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: connected ? c.green : '#EF4444', fontWeight: '600' }}>
          {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
          {connected ? 'Connected' : 'Reconnecting…'}
        </div>
      </div>

      <div
        className="h-[calc(100dvh-190px)] md:h-[calc(100vh-230px)]"
        style={{ display: 'flex', gap: '12px', minHeight: '420px' }}>
        {/* Conversation list — full-width on mobile, hides once a chat is opened */}
        <div
          className={`card w-full md:w-[230px] md:flex-shrink-0 ${activeRoom ? 'max-md:hidden' : ''}`}
          style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${c.border}` }}>
            <p className="section-label">Conversations</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
            {rooms.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center' }}>
                <Building2 size={24} style={{ color: c.border, margin: '0 auto 8px' }} />
                <p style={{ fontSize: '12px', color: c.txt3, lineHeight: '1.5', margin: 0 }}>
                  No conversations yet.<br />Get invited to an interview to unlock chat.
                </p>
              </div>
            ) : rooms.map(room => {
              const isActive = activeRoom?.id === room.id;
              const badge = unreadByRoom[room.id] || 0;
              return (
                <button key={room.id} onClick={() => joinRoom(room)} style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px',
                  background: isActive ? c.red : 'transparent',
                  border: 'none', cursor: 'pointer',
                  borderLeft: `3px solid ${isActive ? c.red : 'transparent'}`,
                  display: 'flex', alignItems: 'center', gap: '10px',
                  transition: 'background 0.1s',
                }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: '32px', height: '32px', background: isActive ? 'rgba(255,255,255,0.2)' : c.surface2, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: isActive ? '#fff' : c.red }}>
                      {avatarLetter(room.Company?.companyName)}
                    </div>
                    {badge > 0 && (
                      <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: c.red, color: '#fff', fontSize: '9px', fontWeight: '700', borderRadius: '10px', padding: '1px 4px', minWidth: '14px', textAlign: 'center' }}>
                        {badge}
                      </span>
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: isActive ? '#fff' : c.txt1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {room.Company?.companyName}
                    </p>
                    {room.isLocked && (
                      <p style={{ fontSize: '10px', color: isActive ? 'rgba(255,255,255,0.6)' : '#EF4444', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Lock size={9} /> Closed
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat panel — hidden on mobile until a conversation is opened */}
        <div className={`card ${!activeRoom ? 'max-md:hidden' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!activeRoom ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: c.txt3 }}>
              <MessageSquare size={40} style={{ color: c.border }} />
              <p style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>Select a conversation</p>
              <p style={{ fontSize: '12px', color: c.txt3, margin: 0 }}>Choose a company from the list to start chatting</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: '10px', background: c.surface }}>
                <button onClick={closeChat} className="md:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.txt2, display: 'flex', padding: '4px', marginLeft: '-4px', flexShrink: 0 }}>
                  <ArrowLeft size={18} />
                </button>
                <div style={{ width: '36px', height: '36px', background: c.red, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>
                  {avatarLetter(activeRoom.Company?.companyName)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: c.txt1, margin: 0 }}>{activeRoom.Company?.companyName}</p>
                  {isLocked ? (
                    <p style={{ fontSize: '11px', color: '#EF4444', margin: '2px 0 0', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={10} /> Application Closed
                    </p>
                  ) : (
                    <p style={{ fontSize: '11px', color: c.green, margin: '2px 0 0', fontWeight: '500' }}>● Active</p>
                  )}
                </div>
              </div>

              {/* Locked notice */}
              {isLocked && (
                <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.06)', borderBottom: `1px solid rgba(239,68,68,0.2)`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
                  <p style={{ fontSize: '12px', color: '#EF4444', margin: 0, fontWeight: '500' }}>
                    This conversation has been closed. Your application was not selected.
                  </p>
                </div>
              )}

              {/* Messages area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', background: c.bg }}>
                {loading ? (
                  <div style={{ textAlign: 'center', color: c.txt3, fontSize: '12px', marginTop: '20px' }}>Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: c.txt3, fontSize: '12px', marginTop: '20px' }}>
                    No messages yet. Say hello! 👋
                  </div>
                ) : messages.map((msg, i) => {
                  const isMine = msg.senderUserId === user.id;
                  const showTime = i === 0 || new Date(msg.createdAt).getTime() - new Date(messages[i - 1]?.createdAt).getTime() > 5 * 60 * 1000;
                  return (
                    <div key={msg.id}>
                      {showTime && (
                        <p style={{ textAlign: 'center', fontSize: '10px', color: c.txt3, margin: '4px 0 8px', fontWeight: '600' }}>
                          {new Date(msg.createdAt).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '65%', padding: '9px 14px',
                          fontSize: '13px', lineHeight: '1.5',
                          background: isMine ? c.red : c.surface,
                          color: isMine ? '#fff' : c.txt1,
                          border: isMine ? 'none' : `1px solid ${c.border}`,
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input — disabled when locked */}
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${c.border}`, display: 'flex', gap: '10px', background: c.surface }}>
                {isLocked ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: c.surface2, border: `1px solid ${c.border}`, fontSize: '12px', color: c.txt3 }}>
                    <Lock size={13} /> Messaging is disabled for closed applications.
                  </div>
                ) : (
                  <>
                    <input
                      className="input" value={input} placeholder="Type a message…" style={{ flex: 1 }}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    />
                    <button className="btn btn-primary" onClick={sendMessage} disabled={!input.trim() || !connected}
                      style={{ padding: '8px 16px', flexShrink: 0 }}>
                      <Send size={14} />
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
