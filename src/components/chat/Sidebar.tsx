import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { chatApi } from '../../api/chatApi';
import { authApi } from '../../api/authApi';
import { friendApi } from '../../api/friendApi';
import { groupApi } from '../../api/groupApi';
import { messageRequestApi } from '../../api/messageRequestApi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search, Plus, LogOut,
  Users, MessageSquare, UserPlus
} from 'lucide-react';
import type {
  ChatRoom,
  GroupInvitationDto,
  FriendRequestDto,
  MessageRequestDto
} from '../../types/chat.types';
import CreateGroupModal from './CreateGroupModal';
import InvitationNotification from './InvitationNotification';
import FriendRequestNotification from './FriendRequestNotification';
import MessageRequestNotification from './MessageRequestNotification';
import FriendsList from './FriendsList';

interface Props { onRoomSelect: (roomId: string) => void; }

export default function Sidebar({ onRoomSelect }: Props) {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { rooms, activeRoomId, setActiveRoom, setMessages, updateRoomUnreadCount } = useChatStore();

  const [search, setSearch] = useState('');
  const [showNewOptions, setShowNewOptions] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [groupInvitations, setGroupInvitations] = useState<GroupInvitationDto[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestDto[]>([]);
  const [messageRequests, setMessageRequests] = useState<MessageRequestDto[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const handleNewGroupInv = (e: any) => {
      setGroupInvitations(prev => {
        if (prev.some(i => i.roomId === e.detail.roomId)) return prev;
        return [...prev, e.detail];
      });
    };

    const handleNewFriendReq = () => { loadNotifications(); };
    const handleNewMsgReq = () => { loadNotifications(); };

    window.addEventListener('newGroupInvitation', handleNewGroupInv);
    window.addEventListener('newFriendRequest', handleNewFriendReq);
    window.addEventListener('newMessageRequest', handleNewMsgReq);

    return () => {
      window.removeEventListener('newGroupInvitation', handleNewGroupInv);
      window.removeEventListener('newFriendRequest', handleNewFriendReq);
      window.removeEventListener('newMessageRequest', handleNewMsgReq);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const [invites, friendReqs, msgReqs] = await Promise.all([
        groupApi.getInvitations().catch(() => []),
        friendApi.getPendingRequests().catch(() => []),
        messageRequestApi.getPendingRequests().catch(() => [])
      ]);
      setGroupInvitations(invites);
      setFriendRequests(friendReqs);
      setMessageRequests(msgReqs);
    } catch (_) {}
  };

  const filtered = rooms.filter(r => {
    const name = getRoomName(r, user?.userId ?? '');
    return name.toLowerCase().includes(search.toLowerCase());
  });

 const handleSelectRoom = async (room: ChatRoom) => {
  setActiveRoom(room.id);
  onRoomSelect(room.id);
  try {
    const messages = await chatApi.getMessages(room.id);
    setMessages(room.id, messages);
    
    // Mark as read after loading messages
    await chatApi.markAsRead(room.id);
    
    // Reset unread count in store
    updateRoomUnreadCount(room.id, 0);
  } catch (_) {}
};

  const handleLogout = async () => {
    try {
      const rt = localStorage.getItem('refreshToken');
      if (rt) await authApi.logout(rt);
    } catch (_) {}
    clearAuth();
    toast.success('Logged out.');
    navigate('/login');
  };

  const totalNotifications = groupInvitations.length + friendRequests.length + messageRequests.length;

  return (
    <>
      <div style={{ width: '300px', minWidth: '300px', height: '100vh', background: '#111118', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', position: 'relative' }}>

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

            <div style={{ display: 'flex', gap: '4px', position: 'relative' }}>
              <button onClick={() => setShowNewOptions(!showNewOptions)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6C63FF', position: 'relative' }}>
                <Plus size={16} />
                {totalNotifications > 0 && (
                  <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', borderRadius: '50%', background: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#fff', border: '2px solid #111118' }}>
                    {totalNotifications}
                  </div>
                )}
              </button>

              {showNewOptions && (
                <div style={{ position: 'absolute', top: '36px', right: '36px', background: '#1a1a26', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '6px', zIndex: 50, minWidth: '160px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                  <button onClick={() => { setShowFriendsList(true); setShowNewOptions(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#e8e8f0', fontSize: '13px' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <UserPlus size={14} color="#6C63FF" />
                    Friends
                  </button>
                  <button onClick={() => { setShowCreateGroup(true); setShowNewOptions(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#e8e8f0', fontSize: '13px' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <Users size={14} color="#6C63FF" />
                    New Group
                  </button>
                </div>
              )}

              <button onClick={handleLogout}
                style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#f87171' }}>
                <LogOut size={15} />
              </button>
            </div>
          </div>

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

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: totalNotifications > 0 ? '200px' : '0' }}>
          {filtered.length === 0
            ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#3d3d52', fontSize: '13px' }}>
                No chats yet.<br />
                <span style={{ color: '#6C63FF', cursor: 'pointer' }}
                  onClick={() => setShowNewOptions(true)}>
                  Start a conversation
                </span>
              </div>
            )
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

        <div style={{ position: 'relative' }}>
          <InvitationNotification
            invitations={groupInvitations}
            onUpdate={(roomId) => setGroupInvitations(prev => prev.filter(i => i.roomId !== roomId))}
          />
          <FriendRequestNotification
            requests={friendRequests}
            onUpdate={(requestId) => setFriendRequests(prev => prev.filter(r => r.id !== requestId))}
          />
          <MessageRequestNotification
            requests={messageRequests}
            onUpdate={(roomId) => setMessageRequests(prev => prev.filter(r => r.roomId !== roomId))}
          />
        </div>
      </div>

      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
      {showFriendsList && <FriendsList onClose={() => setShowFriendsList(false)} onSelectRoom={(roomId) => { setActiveRoom(roomId); onRoomSelect(roomId); }} />}
    </>
  );
}

function RoomItem({ room, currentUserId, isActive, onClick }: {
  room: ChatRoom; currentUserId: string; isActive: boolean; onClick: () => void;
}) {
  const name = getRoomName(room, currentUserId);
  const time = room.lastMessageAt ? formatTime(room.lastMessageAt) : '';

  return (
    <div onClick={onClick}
      style={{ padding: '10px 14px', cursor: 'pointer', background: isActive ? 'rgba(108,99,255,0.1)' : 'transparent', borderLeft: isActive ? '2px solid #6C63FF' : '2px solid transparent', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '10px' }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>

      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '600', color: '#fff' }}>
          {room.isGroup ? <Users size={18} color="white" /> : name[0]?.toUpperCase()}
        </div>
        {!room.isGroup && (() => {
          const other = room.members.find(m => m.userId !== currentUserId);
          return other?.isOnline ? <div style={{ position: 'absolute', bottom: '1px', right: '1px', width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80', border: '2px solid #111118' }} /> : null;
        })()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </div>
          <div style={{ fontSize: '10px', color: '#3d3d52', flexShrink: 0, marginLeft: '6px' }}>{time}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: '#5a5a78', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {room.lastMessage ?? 'No messages yet'}
          </div>
          {room.unreadCount > 0 && (
            <div style={{ marginLeft: '6px', minWidth: '18px', height: '18px', borderRadius: '9px', background: '#6C63FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600', color: '#fff', padding: '0 4px', flexShrink: 0 }}>
              {room.unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getRoomName(room: ChatRoom, currentUserId: string): string {
  if (room.isGroup) return room.name ?? 'Group';
  const other = room.members.find(m => m.userId !== currentUserId);
  return other?.userName ?? 'Unknown';
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
}