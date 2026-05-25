import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const navigate            = useNavigate();
  const { user, clearAuth } = useAuthStore();

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
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', marginBottom: '16px', boxShadow: '0 0 30px rgba(108,99,255,0.4)' }}>
          <MessageSquare size={28} color="white" />
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
          Welcome, {user?.userName ?? 'there'} 👋
        </h1>
        <p style={{ fontSize: '13px', color: '#5a5a78', marginBottom: '24px' }}>Chat features coming in Phase 2!</p>
        <button onClick={handleLogout}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
          <LogOut size={15} /> Logout
        </button>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
    </div>
  );
}
