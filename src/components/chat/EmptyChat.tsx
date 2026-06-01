import { MessageSquare } from 'lucide-react';

export default function EmptyChat() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', gap: '12px' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MessageSquare size={28} color="#6C63FF" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>Your messages</div>
        <div style={{ fontSize: '12px', color: '#5a5a78', lineHeight: '1.6' }}>
          Select a chat from the sidebar<br />or start a new conversation
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        {['🔒 End-to-end encrypted', '⚡ Real-time'].map(tag => (
          <div key={tag} style={{ fontSize: '10px', color: '#3d3d52', background: '#111118', border: '1px solid #1a1a26', borderRadius: '20px', padding: '4px 10px' }}>
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
}