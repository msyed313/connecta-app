import { useEffect, useState }   from 'react';
import { useNavigate }            from 'react-router-dom';
import { useAuthStore }           from '../store/authStore';
import { useChatStore }           from '../store/chatStore';
import { useSignalR }             from '../hooks/useSignalR';
import { chatApi }                from '../api/chatApi';
import { authApi }                from '../api/authApi';
import Sidebar                    from '../components/chat/Sidebar';
import ChatWindow                 from '../components/chat/ChatWindow';
import EmptyChat                  from '../components/chat/EmptyChat';

export default function ChatPage() {
  const navigate                       = useNavigate();
  const { user, setAuth, clearAuth }   = useAuthStore();
  const { activeRoomId, setRooms }     = useChatStore();
  const { joinRoom, sendTyping }        = useSignalR();
  const [loading, setLoading]          = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { navigate('/login'); return; }
    initPage(token);
  }, []);

  const initPage = async (token: string) => {
    try {
      // If user lost from Zustand (page refresh) reload from API
      if (!user) {
        const profile = await authApi.getMe();
        setAuth(
          { userId: profile.id, userName: profile.userName, email: profile.email },
          token,
          localStorage.getItem('refreshToken') ?? ''
        );
      }
      const rooms = await chatApi.getMyRooms();
      setRooms(rooms);
    } catch (_) {
      // Token invalid — clear and redirect
      clearAuth();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 0 20px rgba(108,99,255,0.4)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3" fill="white" opacity="0.9"/>
              <circle cx="5" cy="16" r="2.5" fill="white" opacity="0.7"/>
              <circle cx="19" cy="16" r="2.5" fill="white" opacity="0.7"/>
              <line x1="12" y1="8" x2="5" y2="16" stroke="white" strokeWidth="1.5" opacity="0.5"/>
              <line x1="12" y1="8" x2="19" y2="16" stroke="white" strokeWidth="1.5" opacity="0.5"/>
            </svg>
          </div>
          <div style={{ fontSize: '13px', color: '#5a5a78' }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', background: '#0a0a0f', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>
      <Sidebar onRoomSelect={joinRoom} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeRoomId
          ? <ChatWindow roomId={activeRoomId} sendTyping={sendTyping} />
          : <EmptyChat />
        }
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>
    </div>
  );
}