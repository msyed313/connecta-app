import { useState }       from 'react';
import { useAuthStore }   from '../../store/authStore';
import { useChatStore }   from '../../store/chatStore';
import { chatApi }        from '../../api/chatApi';
import { authApi }        from '../../api/authApi';
import { useNavigate }    from 'react-router-dom';
import toast              from 'react-hot-toast';
import { Search, Plus, LogOut, Users, MessageSquare, X } from 'lucide-react';
import type { ChatRoom }  from '../../types/chat.types';
import axiosInstance from '../../api/axiosInstance';

interface Props { onRoomSelect: (roomId: string) => void; }

export default function Sidebar({ onRoomSelect }: Props) {
  const navigate                        = useNavigate();
  const { user, clearAuth }             = useAuthStore();
  const { rooms, activeRoomId, setActiveRoom, addRoom, setMessages } = useChatStore();

  const [search,       setSearch]       = useState('');
  const [showNewChat,  setShowNewChat]  = useState(false);
  const [allUsers,     setAllUsers]     = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // ── Filter rooms by search ────────────────────────────
  const filtered = rooms.filter(r => {
    const name = getRoomName(r, user?.userId ?? '');
    return name.toLowerCase().includes(search.toLowerCase());
  });

  // ── Select a room ─────────────────────────────────────
  const handleSelectRoom = async (room: ChatRoom) => {
    setActiveRoom(room.id);
    onRoomSelect(room.id);
    try {
      const messages = await chatApi.getMessages(room.id);
      setMessages(room.id, messages);
      await chatApi.markAsRead(room.id);
    } catch (_) {}
  };

  // ── Load users for new chat ───────────────────────────
  const handleOpenNewChat = async () => {
  setShowNewChat(true);
  setUsersLoading(true);
  try {
    const res = await axiosInstance.get('/auth/users');
    setAllUsers(res.data);
  } catch (_) {
    toast.error('Failed to load users.');
  } finally {
    setUsersLoading(false);
  }
};

  // ── Start direct chat ─────────────────────────────────
  const handleStartChat = async (targetUserId: string) => {
    try {
      const res = await chatApi.createDirectRoom(targetUserId);
      addRoom(res.data);
      setActiveRoom(res.data.id);
      onRoomSelect(res.data.id);
      setShowNewChat(false);
    } catch (_) { toast.error('Failed to start chat.'); }
  };

  // ── Logout ────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      const rt = localStorage.getItem('refreshToken');
      if (rt) await authApi.logout(rt);
    } catch (_) {}
    clearAuth();
    toast.success('Logged out.');
    navigate('/login');
  };

  return (
    <div style={{ width: '300px', minWidth: '300px', height: '100vh', background: '#111118', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={16} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>connecta</div>
              <div style={{ fontSize: '11px', color: '#5a5a78' }}>{user?.userName}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={handleOpenNewChat}
              style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6C63FF' }}>
              <Plus size={16} />
            </button>
            <button onClick={handleLogout}
              style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#f87171' }}>
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#5a5a78' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chats..."
            style={{ width: '100%', background: '#1a1a26', border: '1px solid #2d2d3d', borderRadius: '10px', padding: '8px 12px 8px 30px', fontSize: '12px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Room list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0
          ? <div style={{ padding: '32px 16px', textAlign: 'center', color: '#3d3d52', fontSize: '13px' }}>
              No chats yet.<br />
              <span style={{ color: '#6C63FF', cursor: 'pointer' }} onClick={handleOpenNewChat}>Start a new chat</span>
            </div>
          : filtered.map(room => (
            <RoomItem
              key={room.id}
              room={room}
              currentUserId={user?.userId ?? ''}
              isActive={room.id === activeRoomId}
              onClick={() => handleSelectRoom(room)}
            />
          ))
        }
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '20px', width: '320px', maxHeight: '480px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>New Chat</div>
              <button onClick={() => setShowNewChat(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a78', padding: 0 }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {usersLoading
                ? <div style={{ textAlign: 'center', color: '#5a5a78', fontSize: '13px', padding: '20px' }}>Loading users...</div>
                : allUsers.length === 0
                  ? <div style={{ textAlign: 'center', color: '#5a5a78', fontSize: '13px', padding: '20px' }}>No users found.</div>
                  : allUsers.map(u => (
                    <div key={u.id} onClick={() => handleStartChat(u.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1a1a26')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600', color: '#fff', flexShrink: 0 }}>
                        {u.userName?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#fff' }}>{u.userName}</div>
                        <div style={{ fontSize: '11px', color: '#5a5a78' }}>{u.email}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: u.isOnline ? '#4ade80' : '#3d3d52', flexShrink: 0 }} />
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Room Item ─────────────────────────────────────────────
function RoomItem({ room, currentUserId, isActive, onClick }: {
  room: ChatRoom; currentUserId: string; isActive: boolean; onClick: () => void;
}) {
  const name   = getRoomName(room, currentUserId);
  const initials = name?.[0]?.toUpperCase() ?? '?';
  const time   = room.lastMessageAt ? formatTime(room.lastMessageAt) : '';

  return (
    <div onClick={onClick}
      style={{ padding: '10px 14px', cursor: 'pointer', background: isActive ? 'rgba(108,99,255,0.1)' : 'transparent', borderLeft: isActive ? '2px solid #6C63FF' : '2px solid transparent', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '10px' }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>

      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '600', color: '#fff' }}>
          {room.isGroup ? <Users size={18} color="white" /> : initials}
        </div>
        {/* Online dot for direct chats */}
        {!room.isGroup && (() => {
          const other = room.members.find(m => m.userId !== currentUserId);
          return other?.isOnline
            ? <div style={{ position: 'absolute', bottom: '1px', right: '1px', width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80', border: '2px solid #111118' }} />
            : null;
        })()}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ fontSize: '10px', color: '#3d3d52', flexShrink: 0, marginLeft: '6px' }}>{time}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: '#5a5a78', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {room.lastMessage ?? 'No messages yet'}
          </div>
          {room.unreadCount > 0 &&
            <div style={{ marginLeft: '6px', minWidth: '18px', height: '18px', borderRadius: '9px', background: '#6C63FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600', color: '#fff', padding: '0 4px', flexShrink: 0 }}>
              {room.unreadCount}
            </div>
          }
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────
function getRoomName(room: ChatRoom, currentUserId: string): string {
  if (room.isGroup) return room.name ?? 'Group';
  const other = room.members.find(m => m.userId !== currentUserId);
  return other?.userName ?? 'Unknown';
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now  = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
}