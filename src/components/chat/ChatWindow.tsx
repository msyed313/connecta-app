import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { chatApi } from '../../api/chatApi';
import { useSignalR } from '../../hooks/useSignalR';
import toast from 'react-hot-toast';
import { Send, MoreVertical, Loader2 } from 'lucide-react';
import GroupInfoPanel from './GroupInfoPanel';

interface Props {
  roomId: string;
}

export default function ChatWindow({ roomId }: Props) {
  const { user } = useAuthStore();
  const { rooms, messages, typingUsers, addMessage, markRoomAsRead } = useChatStore();
  const { joinRoom, sendTyping } = useSignalR();

  const room = rooms.find(r => r.id === roomId);
  const roomMessages = messages[roomId] || [];
  const currentTyping = typingUsers.filter(t => t.roomId === roomId && t.userId !== user?.userId);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [sentMessageIds, setSentMessageIds] = useState<Set<string>>(new Set());
  const markAsReadRef = useRef(false);

  useEffect(() => {
    joinRoom(roomId);
  }, [roomId, joinRoom]);

  // Mark room as read when opening
  useEffect(() => {
    if (!markAsReadRef.current && roomId && user) {
      markAsReadRef.current = true;
      handleMarkAsRead();
    }
  }, [roomId]);

  const handleMarkAsRead = async () => {
    try {
      await chatApi.markAsRead(roomId);
      markRoomAsRead(roomId, user?.userId ?? '');
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);

    if (typingTimeout) clearTimeout(typingTimeout);
    sendTyping(roomId, true);

    const timeout = setTimeout(() => {
      sendTyping(roomId, false);
    }, 2000);

    setTypingTimeout(timeout);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const messageContent = input.trim();
    setInput('');

    if (typingTimeout) clearTimeout(typingTimeout);
    sendTyping(roomId, false);

    setLoading(true);
    try {
      const res = await chatApi.sendMessage(roomId, {
        content: messageContent,
        messageType: 'text',
      });

      // Check if message already exists (prevent duplicates)
      const messageExists = roomMessages.some(m => m.id === res.data.id);
      if (!messageExists) {
        // Add the real message directly
        addMessage(res.data);
        setSentMessageIds(prev => new Set([...prev, res.data.id]));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  if (!room) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', color: '#5a5a78', fontSize: '14px' }}>
        Room not found
      </div>
    );
  }

  const getRoomName = (): string => {
    if (room.isGroup) return room.name ?? 'Group';
    const other = room.members.find(m => m.userId !== user?.userId);
    return other?.userName ?? 'Unknown';
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Main chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#0a0a0f' }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111118' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{getRoomName()}</div>
            <div style={{ fontSize: '11px', color: '#5a5a78', marginTop: '2px' }}>
              {room.members.filter(m => m.isOnline).length} online
            </div>
          </div>

          {room.isGroup && (
            <button
              onClick={() => setShowGroupInfo(!showGroupInfo)}
              style={{ width: '34px', height: '34px', borderRadius: '8px', background: showGroupInfo ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showGroupInfo ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: showGroupInfo ? '#6C63FF' : '#5a5a78' }}>
              <MoreVertical size={16} />
            </button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
          {roomMessages.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#3d3d52', fontSize: '13px' }}>
              No messages yet. Start the conversation!
            </div>
          ) : (
            roomMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: msg.senderId === user?.userId ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-end',
                    flexDirection: msg.senderId === user?.userId ? 'row-reverse' : 'row',
                  }}
                >
                  {msg.senderId !== user?.userId && (
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {msg.senderName[0]?.toUpperCase()}
                    </div>
                  )}

                  <div>
                    {msg.senderId !== user?.userId && room.isGroup && (
                      <div style={{ fontSize: '11px', color: '#6C63FF', marginBottom: '2px', fontWeight: '500' }}>
                        {msg.senderName}
                      </div>
                    )}
                    <div
                      style={{
                        background: msg.senderId === user?.userId ? '#6C63FF' : '#1a1a26',
                        border: msg.senderId === user?.userId ? 'none' : '1px solid #2d2d3d',
                        color: msg.senderId === user?.userId ? '#fff' : '#e8e8f0',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                    >
                      {msg.content}
                    </div>

                    {msg.senderId === user?.userId && (
                      <div style={{ marginTop: '2px', fontSize: '11px', color: msg.isRead ? '#6C63FF' : '#5a5a78', textAlign: 'right' }}>
                        {msg.isRead ? '✓✓' : '✓'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {currentTyping.length > 0 && (
            <div style={{ marginTop: '8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: '#5a5a78' }}>
                {currentTyping.map(t => t.userName).join(', ')} typing
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#5a5a78', animation: 'bounce 1.4s infinite' }} />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#5a5a78', animation: 'bounce 1.4s infinite 0.2s' }} />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#5a5a78', animation: 'bounce 1.4s infinite 0.4s' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#111118' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <input
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              placeholder="Type a message..."
              style={{ flex: 1, background: '#1a1a26', border: '1px solid #2d2d3d', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              style={{ width: '38px', height: '38px', borderRadius: '10px', background: input.trim() ? 'linear-gradient(135deg, #6C63FF, #5a4ae8)' : '#1a1a26', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', color: input.trim() ? '#fff' : '#3d3d52' }}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Group info panel */}
      {showGroupInfo && room.isGroup && (
        <GroupInfoPanel
          roomId={roomId}
          onClose={() => setShowGroupInfo(false)}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 80%, 100% { opacity: 0.6; } 40% { opacity: 1; } }
      `}</style>
    </div>
  );
}