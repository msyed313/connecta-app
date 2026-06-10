import { useState }     from 'react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { groupApi }     from '../../api/groupApi';
import axiosInstance    from '../../api/axiosInstance';
import toast            from 'react-hot-toast';
import {
  X, Users, Crown, UserPlus, UserMinus,
  LogOut, Trash2, Edit2, Check, Shield,
  ShieldOff, Search, Loader2
} from 'lucide-react';
import type { GroupDetail, GroupMember } from '../../types/chat.types';

interface Props {
  roomId  : string;
  onClose : () => void;
}

export default function GroupInfoPanel({ roomId, onClose }: Props) {
  const { user }                      = useAuthStore();
  const { rooms, setRooms, setActiveRoom } = useChatStore();

  const room    = rooms.find(r => r.id === roomId);
  const isGroup = room?.isGroup ?? false;

  const [groupDetail,   setGroupDetail]   = useState<GroupDetail | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [editMode,      setEditMode]      = useState(false);
  const [editName,      setEditName]      = useState('');
  const [editDesc,      setEditDesc]      = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [allUsers,      setAllUsers]      = useState<any[]>([]);
  const [search,        setSearch]        = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load group detail on mount
  useState(() => {
    const load = async () => {
      try {
        const detail = await groupApi.getGroup(roomId);
        setGroupDetail(detail);
        setEditName(detail.name);
        setEditDesc(detail.description ?? '');
      } catch (_) { toast.error('Failed to load group info.'); }
      finally { setLoading(false); }
    };
    if (isGroup) load();
    else setLoading(false);
  });

  const isAdmin    = groupDetail?.isAdmin ?? false;
  const isCreator  = groupDetail?.createdBy === user?.userId;

  // ── Update group ──────────────────────────────────────
  const handleUpdate = async () => {
    if (!editName.trim()) { toast.error('Group name cannot be empty.'); return; }
    setActionLoading('update');
    try {
      const res = await groupApi.updateGroup(roomId, {
        name       : editName,
        description: editDesc
      });
      setGroupDetail(res.data);
      setEditMode(false);
      toast.success('Group updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update group.');
    } finally { setActionLoading(null); }
  };

  // ── Load users for add member ─────────────────────────
  const handleOpenAddMember = async () => {
    setShowAddMember(true);
    try {
      const res = await axiosInstance.get('/users');
      const memberIds = groupDetail?.members.map(m => m.userId) ?? [];
      setAllUsers(res.data.filter((u: any) => !memberIds.includes(u.id)));
    } catch (_) { toast.error('Failed to load users.'); }
  };

  // ── Add member ────────────────────────────────────────
  const handleAddMember = async (userId: string) => {
    setActionLoading(userId);
    try {
      await groupApi.addMembers(roomId, [userId]);
      const detail = await groupApi.getGroup(roomId);
      setGroupDetail(detail);
      setAllUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('Member added!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add member.');
    } finally { setActionLoading(null); }
  };

  // ── Remove member ─────────────────────────────────────
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Remove ${memberName} from the group?`)) return;
    setActionLoading(memberId);
    try {
      await groupApi.removeMember(roomId, memberId);
      setGroupDetail(prev => prev
        ? { ...prev, members: prev.members.filter(m => m.userId !== memberId) }
        : null);
      toast.success('Member removed.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove member.');
    } finally { setActionLoading(null); }
  };

  // ── Make/Remove admin ─────────────────────────────────
  const handleToggleAdmin = async (member: GroupMember) => {
    setActionLoading(member.userId);
    try {
      if (member.isAdmin) {
        await groupApi.removeAdmin(roomId, member.userId);
        toast.success(`${member.userName} is no longer an admin.`);
      } else {
        await groupApi.makeAdmin(roomId, member.userId);
        toast.success(`${member.userName} is now an admin.`);
      }
      const detail = await groupApi.getGroup(roomId);
      setGroupDetail(detail);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update admin.');
    } finally { setActionLoading(null); }
  };

  // ── Leave group ───────────────────────────────────────
  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    setActionLoading('leave');
    try {
      await groupApi.leaveGroup(roomId);
      const updatedRooms = rooms.filter(r => r.id !== roomId);
      setRooms(updatedRooms);
      setActiveRoom(null);
      toast.success('You left the group.');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to leave group.');
    } finally { setActionLoading(null); }
  };

  // ── Delete group ──────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm('Delete this group permanently? This cannot be undone.')) return;
    setActionLoading('delete');
    try {
      await groupApi.deleteGroup(roomId);
      const updatedRooms = rooms.filter(r => r.id !== roomId);
      setRooms(updatedRooms);
      setActiveRoom(null);
      toast.success('Group deleted.');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete group.');
    } finally { setActionLoading(null); }
  };

  const filteredUsers = allUsers.filter(u =>
    u.userName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ width: '300px', minWidth: '300px', height: '100vh', background: '#111118', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.25s ease' }}>

      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a78', padding: 0 }}>
          <X size={18} />
        </button>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>Group Info</div>
      </div>

      {loading
        ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a5a78', fontSize: '13px' }}>Loading...</div>
        : (
          <div style={{ flex: 1, overflowY: 'auto' }}>

            {/* Group avatar + name */}
            <div style={{ padding: '20px 16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 0 24px rgba(108,99,255,0.3)' }}>
                <Users size={28} color="white" />
              </div>

              {editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    style={{ background: '#1a1a26', border: '1px solid #6C63FF', borderRadius: '10px', padding: '8px 12px', fontSize: '14px', color: '#fff', outline: 'none', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}
                  />
                  <textarea
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    placeholder="Group description..."
                    rows={2}
                    style={{ background: '#1a1a26', border: '1px solid #3d3d52', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', color: '#fff', outline: 'none', resize: 'none', fontFamily: "'DM Sans', sans-serif", width: '100%', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setEditMode(false)}
                      style={{ flex: 1, padding: '7px', borderRadius: '8px', background: '#1a1a26', border: '1px solid #3d3d52', color: '#5a5a78', fontSize: '12px', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={handleUpdate} disabled={actionLoading === 'update'}
                      style={{ flex: 1, padding: '7px', borderRadius: '8px', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', border: 'none', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      {actionLoading === 'update' ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />}
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>
                    {groupDetail?.name}
                  </div>
                  {groupDetail?.description &&
                    <div style={{ fontSize: '12px', color: '#5a5a78', lineHeight: '1.5' }}>
                      {groupDetail.description}
                    </div>
                  }
                  <div style={{ fontSize: '11px', color: '#3d3d52', marginTop: '6px' }}>
                    {groupDetail?.memberCount} members
                  </div>
                  {isAdmin &&
                    <button onClick={() => setEditMode(true)}
                      style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: '20px', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', color: '#6C63FF', fontSize: '11px', cursor: 'pointer' }}>
                      <Edit2 size={11} /> Edit Group
                    </button>
                  }
                </>
              )}
            </div>

            {/* Members section */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: '500', color: '#5a5a78', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Members ({groupDetail?.memberCount})
                </div>
                {isAdmin &&
                  <button onClick={handleOpenAddMember}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', color: '#6C63FF', fontSize: '11px', cursor: 'pointer' }}>
                    <UserPlus size={11} /> Add
                  </button>
                }
              </div>

              {/* Add member search */}
              {showAddMember && (
                <div style={{ marginBottom: '10px', background: '#1a1a26', borderRadius: '12px', padding: '10px', border: '1px solid #2d2d3d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#fff' }}>Add Members</span>
                    <button onClick={() => { setShowAddMember(false); setSearch(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a78', padding: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#5a5a78' }} />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search users..."
                      style={{ width: '100%', background: '#0a0a0f', border: '1px solid #2d2d3d', borderRadius: '8px', padding: '6px 10px 6px 26px', fontSize: '12px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
                    {filteredUsers.length === 0
                      ? <div style={{ textAlign: 'center', color: '#5a5a78', fontSize: '12px', padding: '8px' }}>No users to add</div>
                      : filteredUsers.map(u => (
                        <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 4px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', color: '#fff', flexShrink: 0 }}>
                            {u.userName[0]?.toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: '500', color: '#fff' }}>{u.userName}</div>
                          </div>
                          <button onClick={() => handleAddMember(u.id)} disabled={actionLoading === u.id}
                            style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', color: '#6C63FF', fontSize: '11px', cursor: 'pointer' }}>
                            {actionLoading === u.id ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : 'Add'}
                          </button>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Member list */}
              {groupDetail?.members.map(member => (
                <div key={member.userId} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>

                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                      {member.userName[0]?.toUpperCase()}
                    </div>
                    <div style={{ position: 'absolute', bottom: '1px', right: '1px', width: '8px', height: '8px', borderRadius: '50%', background: member.isOnline ? '#4ade80' : '#3d3d52', border: '2px solid #111118' }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: member.userId === user?.userId ? '#6C63FF' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.userId === user?.userId ? 'You' : member.userName}
                      </span>
                      {member.isAdmin &&
                        <Crown size={11} color="#facc15" />
                      }
                    </div>
                    <div style={{ fontSize: '10px', color: '#3d3d52' }}>
                      {member.isAdmin ? 'Admin' : 'Member'}
                    </div>
                  </div>

                  {/* Admin actions */}
                  {isAdmin && member.userId !== user?.userId && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {/* Toggle admin */}
                      <button onClick={() => handleToggleAdmin(member)} disabled={!!actionLoading}
                        title={member.isAdmin ? 'Remove admin' : 'Make admin'}
                        style={{ width: '26px', height: '26px', borderRadius: '6px', background: member.isAdmin ? 'rgba(250,204,21,0.1)' : 'rgba(108,99,255,0.1)', border: `1px solid ${member.isAdmin ? 'rgba(250,204,21,0.2)' : 'rgba(108,99,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: member.isAdmin ? '#facc15' : '#6C63FF' }}>
                        {actionLoading === member.userId
                          ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                          : member.isAdmin ? <ShieldOff size={11} /> : <Shield size={11} />
                        }
                      </button>
                      {/* Remove member */}
                      <button onClick={() => handleRemoveMember(member.userId, member.userName)} disabled={!!actionLoading}
                        title="Remove from group"
                        style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#f87171' }}>
                        <UserMinus size={11} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ padding: '12px 16px' }}>

              {/* Leave group */}
              <button onClick={handleLeave} disabled={actionLoading === 'leave'}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.15)', color: '#fb923c', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                {actionLoading === 'leave'
                  ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <LogOut size={14} />
                }
                Leave Group
              </button>

              {/* Delete group — creator only */}
              {isCreator &&
                <button onClick={handleDelete} disabled={actionLoading === 'delete'}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {actionLoading === 'delete'
                    ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Trash2 size={14} />
                  }
                  Delete Group
                </button>
              }
            </div>
          </div>
        )
      }

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}