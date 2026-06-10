import { useState, useEffect } from 'react';
import { friendApi } from '../../api/friendApi';
import { messageRequestApi } from '../../api/messageRequestApi';
import { useChatStore } from '../../store/chatStore';
import { chatApi } from '../../api/chatApi';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { X, Search, MessageSquare, UserPlus, Loader2 } from 'lucide-react';
import type { FriendDto } from '../../types/chat.types';

interface Props {
  onClose: () => void;
  onSelectRoom?: (roomId: string) => void;
}

export default function FriendsList({ onClose, onSelectRoom }: Props) {
  const { addRoom, setMessages, setActiveRoom } = useChatStore();

  const [tab, setTab] = useState<'friends' | 'add'>('friends');
  const [friends, setFriends] = useState<FriendDto[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingReq, setSendingReq] = useState<string | null>(null);
  const [friendIds, setFriendIds] = useState<string[]>([]);

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    if (tab === 'add' && allUsers.length === 0) {
      loadAllUsers();
    }
  }, [tab]);

  const loadFriends = async () => {
    try {
      const f = await friendApi.getFriends();
      setFriends(f);
      setFriendIds(f.map(fr => fr.userId));
    } catch (_) { toast.error('Failed to load friends.'); }
  };

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/auth/users');
      setAllUsers(res.data);
    } catch (_) { toast.error('Failed to load users.'); }
    finally { setLoading(false); }
  };

  const handleStartChat = async (friend: FriendDto) => {
    try {
      if (friend.roomId) {
        setActiveRoom(friend.roomId);
        onSelectRoom?.(friend.roomId);
        onClose();
        return;
      }

      const res = await messageRequestApi.startChat(friend.userId);
      addRoom(res.data);
      const messages = await chatApi.getMessages(res.data.id);
      setMessages(res.data.id, messages);
      setActiveRoom(res.data.id);
      onSelectRoom?.(res.data.id);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start chat.');
    }
  };

  const handleSendRequest = async (userId: string) => {
    setSendingReq(userId);
    try {
      await friendApi.sendRequest(userId);
      toast.success('Friend request sent! 📤');
      setAllUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send request.');
    } finally {
      setSendingReq(null);
    }
  };

  const filtered = (tab === 'friends' ? friends : allUsers).filter(u =>
    u.userName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(6px)' }}>
      <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', width: '380px', maxHeight: '580px', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', overflow: 'hidden' }}>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>
            {tab === 'friends' ? 'Friends' : 'Add Friend'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a78', padding: 0 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', padding: '12px 16px', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setTab('friends')}
            style={{ flex: 1, padding: '8px', borderRadius: '10px', background: tab === 'friends' ? '#6C63FF' : '#1a1a26', color: tab === 'friends' ? '#fff' : '#5a5a78', fontSize: '13px', fontWeight: '500', border: 'none', cursor: 'pointer' }}>
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setTab('add')}
            style={{ flex: 1, padding: '8px', borderRadius: '10px', background: tab === 'add' ? '#6C63FF' : '#1a1a26', color: tab === 'add' ? '#fff' : '#5a5a78', fontSize: '13px', fontWeight: '500', border: 'none', cursor: 'pointer' }}>
            Add Friend
          </button>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#5a5a78' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tab === 'friends' ? 'Search friends...' : 'Search users...'}
              style={{ width: '100%', background: '#1a1a26', border: '1px solid #2d2d3d', borderRadius: '10px', padding: '8px 12px 8px 30px', fontSize: '12px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tab === 'friends' ? (
            filtered.length === 0
              ? <div style={{ textAlign: 'center', padding: '32px 16px', color: '#5a5a78', fontSize: '13px' }}>
                  {friends.length === 0 ? 'No friends yet. Add some! 👋' : 'No friends found.'}
                </div>
              : filtered.map(friend => (
                <div key={friend.userId} onClick={() => handleStartChat(friend)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', color: '#fff' }}>
                      {friend.userName[0]?.toUpperCase()}
                    </div>
                    <div style={{ position: 'absolute', bottom: '1px', right: '1px', width: '10px', height: '10px', borderRadius: '50%', background: friend.isOnline ? '#4ade80' : '#3d3d52', border: '2px solid #111118' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#fff' }}>{friend.userName}</div>
                    <div style={{ fontSize: '11px', color: '#5a5a78' }}>
                      {friend.isOnline ? 'Online' : friend.lastSeen ? `Last seen ${new Date(friend.lastSeen).toLocaleDateString()}` : 'Never seen'}
                    </div>
                  </div>
                  <button style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6C63FF', flexShrink: 0 }}>
                    <MessageSquare size={14} />
                  </button>
                </div>
              ))
          ) : (
            loading
              ? <div style={{ textAlign: 'center', padding: '32px 16px', color: '#5a5a78', fontSize: '13px' }}>Loading users...</div>
              : filtered.length === 0
                ? <div style={{ textAlign: 'center', padding: '32px 16px', color: '#5a5a78', fontSize: '13px' }}>No users found.</div>
                : filtered.map(user => (
                  <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600', color: '#fff' }}>
                        {user.userName[0]?.toUpperCase()}
                      </div>
                      <div style={{ position: 'absolute', bottom: '1px', right: '1px', width: '10px', height: '10px', borderRadius: '50%', background: user.isOnline ? '#4ade80' : '#3d3d52', border: '2px solid #111118' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#fff' }}>{user.userName}</div>
                      <div style={{ fontSize: '11px', color: '#5a5a78' }}>{user.email}</div>
                    </div>
                    <button
                      onClick={() => handleSendRequest(user.id)}
                      disabled={sendingReq === user.id || friendIds.includes(user.id)}
                      style={{ width: '32px', height: '32px', borderRadius: '8px', background: friendIds.includes(user.id) ? 'rgba(108,99,255,0.1)' : 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: friendIds.includes(user.id) ? 'not-allowed' : 'pointer', color: '#6C63FF', flexShrink: 0, opacity: friendIds.includes(user.id) ? 0.5 : 1 }}>
                      {sendingReq === user.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : friendIds.includes(user.id) ? '✓' : <UserPlus size={14} />}
                    </button>
                  </div>
                ))
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}