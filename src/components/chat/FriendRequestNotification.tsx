import { useState } from 'react';
import { friendApi } from '../../api/friendApi';
import toast from 'react-hot-toast';
import { Check, X, Loader2 } from 'lucide-react';
import type { FriendRequestDto } from '../../types/chat.types';

interface Props {
  requests : FriendRequestDto[];
  onUpdate : (requestId: number, accepted: boolean) => void;
}

export default function FriendRequestNotification({ requests, onUpdate }: Props) {
  const [loading, setLoading] = useState<number | null>(null);

  if (requests.length === 0) return null;

  const handleRespond = async (request: FriendRequestDto, accept: boolean) => {
    setLoading(request.id);
    try {
      await friendApi.respondRequest(request.id, accept);
      if (accept) {
        toast.success(`You are now friends with ${request.senderName}! 🎉`);
      } else {
        toast.success('Friend request declined.');
      }
      onUpdate(request.id, accept);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to respond.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ position: 'absolute', bottom: '60px', left: '8px', right: '8px', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
      {requests.map(req => (
        <div key={req.id} style={{ background: '#1a1a26', border: '1px solid rgba(108,99,255,0.25)', borderRadius: '14px', padding: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                {req.senderName[0]?.toUpperCase()}
              </div>
              <div style={{ position: 'absolute', bottom: '0', right: '0', width: '8px', height: '8px', borderRadius: '50%', background: req.senderOnline ? '#4ade80' : '#3d3d52', border: '2px solid #1a1a26' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {req.senderName}
              </div>
              <div style={{ fontSize: '11px', color: '#5a5a78' }}>Wants to be your friend</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => handleRespond(req, false)}
              disabled={loading === req.id}
              style={{ flex: 1, padding: '7px', borderRadius: '8px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <X size={13} /> Decline
            </button>
            <button
              onClick={() => handleRespond(req, true)}
              disabled={loading === req.id}
              style={{ flex: 1, padding: '7px', borderRadius: '8px', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: '0 3px 10px rgba(108,99,255,0.3)' }}>
              {loading === req.id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <><Check size={13} /> Accept</>}
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