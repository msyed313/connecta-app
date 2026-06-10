import { useState } from 'react';
import { groupApi } from '../../api/groupApi';
import { useChatStore } from '../../store/chatStore';
import { chatApi } from '../../api/chatApi';
import toast from 'react-hot-toast';
import { Check, X, Loader2, Users } from 'lucide-react';
import type { GroupInvitationDto } from '../../types/chat.types';

interface Props {
  invitations : GroupInvitationDto[];
  onUpdate    : (roomId: string, accepted: boolean) => void;
}

export default function InvitationNotification({ invitations, onUpdate }: Props) {
  const { addRoom, setMessages } = useChatStore();
  const [loading, setLoading] = useState<string | null>(null);

  if (invitations.length === 0) return null;

  const handleRespond = async (roomId: string, accept: boolean) => {
    setLoading(roomId);
    try {
      const res = await groupApi.respondInvitation(roomId, accept);
      if (accept && res.data) {
        addRoom(res.data as any);
        const messages = await chatApi.getMessages(roomId);
        setMessages(roomId, messages);
        toast.success(`You joined the group! 🎉`);
      } else {
        toast.success('Invitation declined.');
      }
      onUpdate(roomId, accept);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to respond.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ position: 'absolute', bottom: '60px', left: '8px', right: '8px', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
      {invitations.map(inv => (
        <div key={inv.roomId} style={{ background: '#1a1a26', border: '1px solid rgba(108,99,255,0.25)', borderRadius: '14px', padding: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={16} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {inv.groupName}
              </div>
              <div style={{ fontSize: '11px', color: '#5a5a78' }}>
                Invited by <span style={{ color: '#a78bfa' }}>{inv.invitedByUserName}</span> · {inv.memberCount} members
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => handleRespond(inv.roomId, false)}
              disabled={loading === inv.roomId}
              style={{ flex: 1, padding: '7px', borderRadius: '8px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <X size={13} /> Decline
            </button>
            <button
              onClick={() => handleRespond(inv.roomId, true)}
              disabled={loading === inv.roomId}
              style={{ flex: 1, padding: '7px', borderRadius: '8px', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: '0 3px 10px rgba(108,99,255,0.3)' }}>
              {loading === inv.roomId ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <><Check size={13} /> Accept</>}
            </button>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}