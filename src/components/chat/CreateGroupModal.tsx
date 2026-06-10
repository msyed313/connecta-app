import { useState }       from 'react';
// import { useAuthStore }   from '../../store/authStore';
import { useChatStore }   from '../../store/chatStore';
import { groupApi }       from '../../api/groupApi';
import axiosInstance      from '../../api/axiosInstance';
import toast              from 'react-hot-toast';
import { X, Search, Check, ArrowRight, ArrowLeft, Users, Loader2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

type Step = 'members' | 'details';

export default function CreateGroupModal({ onClose }: Props) {
//   const { user }    = useAuthStore();
  const { addRoom } = useChatStore();

  const [step,         setStep]         = useState<Step>('members');
  const [allUsers,     setAllUsers]     = useState<any[]>([]);
  const [selected,     setSelected]     = useState<any[]>([]);
  const [search,       setSearch]       = useState('');
  const [groupName,    setGroupName]    = useState('');
  const [description,  setDescription]  = useState('');
  const [loading,      setLoading]      = useState(false);
  const [usersLoaded,  setUsersLoaded]  = useState(false);

  // Load users on mount
  useState(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get('/Auth/users');
        setAllUsers(res.data);
        setUsersLoaded(true);
      } catch (_) { toast.error('Failed to load users.'); }
    };
    load();
  });

  const filtered = allUsers.filter(u =>
    u.userName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (u: any) => {
    setSelected(prev =>
      prev.find(s => s.id === u.id)
        ? prev.filter(s => s.id !== u.id)
        : [...prev, u]
    );
  };

  const isSelected = (id: string) => selected.some(s => s.id === id);

  const handleCreate = async () => {
    if (!groupName.trim()) { toast.error('Please enter a group name.'); return; }
    if (selected.length === 0) { toast.error('Please select at least one member.'); return; }

    setLoading(true);
    try {
      const res = await groupApi.createGroup({
        name       : groupName.trim(),
        description: description.trim(),
        memberIds  : selected.map(s => s.id)
      });
      addRoom(res.data as any);
      toast.success(`Group "${groupName}" created! 🎉`);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(6px)' }}>
      <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', width: '380px', maxHeight: '580px', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {step === 'details' &&
            <button onClick={() => setStep('members')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a78', padding: 0, display: 'flex' }}>
              <ArrowLeft size={18} />
            </button>
          }
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>
              {step === 'members' ? 'Add Members' : 'New Group'}
            </div>
            <div style={{ fontSize: '11px', color: '#5a5a78', marginTop: '2px' }}>
              {step === 'members'
                ? `${selected.length} member${selected.length !== 1 ? 's' : ''} selected`
                : 'Group info'
              }
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a78', padding: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* ── STEP 1: Select Members ── */}
        {step === 'members' && (
          <>
            {/* Selected chips */}
            {selected.length > 0 && (
              <div style={{ padding: '10px 16px', display: 'flex', gap: '6px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {selected.map(s => (
                  <div key={s.id} onClick={() => toggleSelect(s)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '20px', padding: '3px 10px 3px 6px', cursor: 'pointer' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600', color: '#fff' }}>
                      {s.userName[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontSize: '12px', color: '#a78bfa' }}>{s.userName}</span>
                    <X size={12} color="#a78bfa" />
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#5a5a78' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search users..."
                  style={{ width: '100%', background: '#1a1a26', border: '1px solid #2d2d3d', borderRadius: '10px', padding: '8px 12px 8px 30px', fontSize: '12px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* User list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
              {!usersLoaded
                ? <div style={{ textAlign: 'center', padding: '24px', color: '#5a5a78', fontSize: '13px' }}>Loading...</div>
                : filtered.length === 0
                  ? <div style={{ textAlign: 'center', padding: '24px', color: '#5a5a78', fontSize: '13px' }}>No users found</div>
                  : filtered.map(u => (
                    <div key={u.id} onClick={() => toggleSelect(u)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 16px', cursor: 'pointer', background: isSelected(u.id) ? 'rgba(108,99,255,0.08)' : 'transparent', transition: 'background 0.15s' }}
                      onMouseEnter={e => { if (!isSelected(u.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={e => { if (!isSelected(u.id)) e.currentTarget.style.background = 'transparent'; }}>

                      {/* Avatar */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '600', color: '#fff' }}>
                          {u.userName[0]?.toUpperCase()}
                        </div>
                        <div style={{ position: 'absolute', bottom: '1px', right: '1px', width: '9px', height: '9px', borderRadius: '50%', background: u.isOnline ? '#4ade80' : '#3d3d52', border: '2px solid #111118' }} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#fff' }}>{u.userName}</div>
                        <div style={{ fontSize: '11px', color: '#5a5a78', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                      </div>

                      {/* Checkbox */}
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${isSelected(u.id) ? '#6C63FF' : '#3d3d52'}`, background: isSelected(u.id) ? '#6C63FF' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                        {isSelected(u.id) && <Check size={12} color="#fff" />}
                      </div>
                    </div>
                  ))
              }
            </div>

            {/* Next button */}
            <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button
                onClick={() => selected.length > 0 && setStep('details')}
                disabled={selected.length === 0}
                style={{ width: '100%', padding: '11px', borderRadius: '12px', background: selected.length > 0 ? 'linear-gradient(135deg, #6C63FF, #5a4ae8)' : '#1a1a26', border: 'none', color: selected.length > 0 ? '#fff' : '#3d3d52', fontSize: '13px', fontWeight: '600', cursor: selected.length > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s', boxShadow: selected.length > 0 ? '0 4px 15px rgba(108,99,255,0.3)' : 'none' }}>
                <span>Next</span><ArrowRight size={15} />
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: Group Details ── */}
        {step === 'details' && (
          <>
            <div style={{ flex: 1, padding: '20px 20px 0', overflowY: 'auto' }}>

              {/* Group icon preview */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(108,99,255,0.4)' }}>
                  <Users size={28} color="white" />
                </div>
              </div>

              {/* Group name */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#5a5a78', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Group Name *
                </label>
                <input
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  maxLength={50}
                  style={{ width: '100%', background: '#1a1a26', border: '1px solid #3d3d52', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#3d3d52'; e.target.style.boxShadow = 'none'; }}
                />
                <div style={{ fontSize: '10px', color: '#3d3d52', textAlign: 'right', marginTop: '3px' }}>{groupName.length}/50</div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#5a5a78', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What is this group about?"
                  maxLength={200}
                  rows={3}
                  style={{ width: '100%', background: '#1a1a26', border: '1px solid #3d3d52', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#fff', outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: "'DM Sans', sans-serif" }}
                  onFocus={e => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#3d3d52'; e.target.style.boxShadow = 'none'; }}
                />
                <div style={{ fontSize: '10px', color: '#3d3d52', textAlign: 'right', marginTop: '3px' }}>{description.length}/200</div>
              </div>

              {/* Selected members preview */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#5a5a78', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Members ({selected.length})
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selected.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#1a1a26', border: '1px solid #2d2d3d', borderRadius: '20px', padding: '4px 10px 4px 4px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600', color: '#fff' }}>
                        {s.userName[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontSize: '11px', color: '#e8e8f0' }}>{s.userName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Create button */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button onClick={handleCreate} disabled={loading || !groupName.trim()}
                style={{ width: '100%', padding: '11px', borderRadius: '12px', background: groupName.trim() ? 'linear-gradient(135deg, #6C63FF, #5a4ae8)' : '#1a1a26', border: 'none', color: groupName.trim() ? '#fff' : '#3d3d52', fontSize: '13px', fontWeight: '600', cursor: groupName.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: groupName.trim() ? '0 4px 15px rgba(108,99,255,0.3)' : 'none' }}>
                {loading
                  ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</>
                  : <><Users size={15} /><span>Create Group</span></>
                }
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}