import { useEffect, useRef, useState } from 'react';
import { useAuthStore }   from '../../store/authStore';
import { useChatStore }   from '../../store/chatStore';
import { chatApi }        from '../../api/chatApi';
import { Send, Trash2, CheckCheck, Check, MoreVertical, Phone, Video } from 'lucide-react';
import type { Message }   from '../../types/chat.types';

interface Props {
  roomId     : string;
  sendTyping : (roomId: string, isTyping: boolean) => void;
}

export default function ChatWindow({ roomId, sendTyping }: Props) {
  const { user }    = useAuthStore();
  const { rooms, messages, typingUsers, addMessage, deleteMessage } = useChatStore();

  const room        = rooms.find(r => r.id === roomId);
  const roomMessages = messages[roomId] ?? [];
  const typing      = typingUsers.filter(t => t.roomId === roomId && t.userId !== user?.userId);

  const [input,       setInput]       = useState('');
  const [sending,     setSending]     = useState(false);
  const [hoveredMsg,  setHoveredMsg]  = useState<string | null>(null);
  const typingTimer   = useRef<any>(null);
  const bottomRef     = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages.length]);

  // Mark as read when room opens
  useEffect(() => {
    chatApi.markAsRead(roomId).catch(() => {});
  }, [roomId]);

  // ── Send message ──────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setSending(true);
    sendTyping(roomId, false);

    try {
      const res = await chatApi.sendMessage(roomId, text);
      addMessage(res.data);
    } catch (_) {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  // ── Typing indicator ──────────────────────────────────
  const handleInputChange = (val: string) => {
    setInput(val);
    sendTyping(roomId, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping(roomId, false), 2000);
  };

  // ── Delete message ────────────────────────────────────
  const handleDelete = async (messageId: string) => {
    try {
      await chatApi.deleteMessage(messageId);
      deleteMessage(messageId, roomId);
    } catch (_) {}
  };

  // ── Room name & other user ────────────────────────────
  const roomName = room?.isGroup
    ? room.name ?? 'Group'
    : room?.members.find(m => m.userId !== user?.userId)?.userName ?? 'Chat';

  const otherUser = room?.members.find(m => m.userId !== user?.userId);

  // Group messages by date
  const groupedMessages = groupByDate(roomMessages);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#111118', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '600', color: '#fff', flexShrink: 0 }}>
            {roomName[0]?.toUpperCase()}
          </div>
          {!room?.isGroup && otherUser?.isOnline &&
            <div style={{ position: 'absolute', bottom: '1px', right: '1px', width: '9px', height: '9px', borderRadius: '50%', background: '#4ade80', border: '2px solid #111118' }} />
          }
        </div>

        {/* Name & status */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{roomName}</div>
          <div style={{ fontSize: '11px', color: typing.length > 0 ? '#6C63FF' : '#5a5a78' }}>
            {typing.length > 0
              ? `${typing.map(t => t.userName).join(', ')} typing...`
              : room?.isGroup
                ? `${room.members.length} members`
                : otherUser?.isOnline ? 'Online' : 'Offline'
            }
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {[Phone, Video, MoreVertical].map((Icon, i) => (
            <button key={i}
              style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5a5a78' }}>
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {roomMessages.length === 0 &&
          <div style={{ margin: 'auto', textAlign: 'center', color: '#3d3d52', fontSize: '13px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>👋</div>
            Say hello to start the conversation!
          </div>
        }

        {groupedMessages.map(({ date, messages: dayMsgs }) => (
          <div key={date}>
            {/* Date separator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '12px 0 8px' }}>
              <div style={{ flex: 1, height: '1px', background: '#1a1a26' }} />
              <div style={{ fontSize: '10px', color: '#3d3d52', background: '#0a0a0f', padding: '2px 8px', borderRadius: '10px', border: '1px solid #1a1a26' }}>{date}</div>
              <div style={{ flex: 1, height: '1px', background: '#1a1a26' }} />
            </div>

            {dayMsgs.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === user?.userId}
                isHovered={hoveredMsg === msg.id}
                onHover={setHoveredMsg}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ))}

        {/* Typing dots */}
        {typing.length > 0 &&
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
            <div style={{ display: 'flex', gap: '4px', padding: '10px 14px', background: '#1a1a26', borderRadius: '16px 16px 16px 4px', border: '1px solid rgba(255,255,255,0.04)' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6C63FF', animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
            <span style={{ fontSize: '11px', color: '#5a5a78' }}>{typing[0].userName} is typing</span>
          </div>
        }

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#111118', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => handleInputChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
          placeholder="Type a message..."
          style={{ flex: 1, background: '#1a1a26', border: '1px solid #2d2d3d', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.1)'; }}
          onBlur={e => { e.target.style.borderColor = '#2d2d3d'; e.target.style.boxShadow = 'none'; }}
        />
        <button onClick={handleSend} disabled={!input.trim() || sending}
          style={{ width: '40px', height: '40px', borderRadius: '12px', background: input.trim() ? 'linear-gradient(135deg, #6C63FF, #5a4ae8)' : '#1a1a26', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: input.trim() ? '0 4px 15px rgba(108,99,255,0.3)' : 'none', flexShrink: 0 }}>
          <Send size={16} color={input.trim() ? '#fff' : '#3d3d52'} />
        </button>
      </div>

      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2d2d3d; border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────
function MessageBubble({ message, isOwn, isHovered, onHover, onDelete }: {
  message   : Message;
  isOwn     : boolean;
  isHovered : boolean;
  onHover   : (id: string | null) => void;
  onDelete  : (id: string) => void;
}) {
  const time = new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      onMouseEnter={() => onHover(message.id)}
      onMouseLeave={() => onHover(null)}
      style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '6px', marginBottom: '2px', position: 'relative' }}>

      {/* Avatar for others */}
      {!isOwn &&
        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', color: '#fff', flexShrink: 0, marginBottom: '2px' }}>
          {message.senderName[0]?.toUpperCase()}
        </div>
      }

      <div style={{ maxWidth: '65%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>

        {/* Sender name for groups */}
        {!isOwn &&
          <div style={{ fontSize: '10px', color: '#6C63FF', marginBottom: '3px', marginLeft: '4px', fontWeight: '500' }}>
            {message.senderName}
          </div>
        }

        {/* Bubble */}
        <div style={{
          padding: '8px 12px',
          borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: message.isDeleted
            ? '#1a1a26'
            : isOwn
              ? '#1a1a26'
              : '#1a1a26',
          border: '1px solid rgba(255,255,255,0.04)',
          position: 'relative'
        }}>
          {message.isDeleted
            ? <span style={{ fontSize: '12px', color: '#5a5a78', fontStyle: 'italic' }}>🚫 Message deleted</span>
            : <span style={{ fontSize: '13px', color: '#fff', lineHeight: '1.5', wordBreak: 'break-word' }}>{message.content}</span>
          }
        </div>

        {/* Time + read receipt */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', padding: '0 4px' }}>
          <span style={{ fontSize: '10px', color: '#3d3d52' }}>{time}</span>
          {isOwn && !message.isDeleted && (
            message.isRead || message.readBy.length > 0
              ? <CheckCheck size={12} color="#6C63FF" />
              : <Check size={12} color="#3d3d52" />
          )}
        </div>
      </div>

      {/* Delete button on hover */}
      {isOwn && isHovered && !message.isDeleted &&
        <button onClick={() => onDelete(message.id)}
          style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#f87171', flexShrink: 0, marginBottom: '20px' }}>
          <Trash2 size={12} />
        </button>
      }
    </div>
  );
}

// ── Group messages by date ────────────────────────────────
function groupByDate(messages: Message[]): { date: string; messages: Message[] }[] {
  const groups: Record<string, Message[]> = {};

  messages.forEach(msg => {
    const date = new Date(msg.sentAt);
    const now  = new Date();
    const diff = now.getTime() - date.getTime();

    let label: string;
    if (diff < 86400000 && date.getDate() === now.getDate()) label = 'Today';
    else if (diff < 172800000) label = 'Yesterday';
    else label = date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
  });

  return Object.entries(groups).map(([date, messages]) => ({ date, messages }));
}