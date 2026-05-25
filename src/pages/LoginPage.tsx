import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate    = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      setAuth(
        { userId: res.data.userId, userName: res.data.userName, email: res.data.email },
        res.data.accessToken,
        res.data.refreshToken
      );
      toast.success(`Welcome back, ${res.data.userName}!`);
      navigate('/chat');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-5%', left: '-5%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(90,74,232,0.1) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(rgba(108,99,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '360px', position: 'relative', zIndex: 10 }}>

        {/* Logo */}
<div style={{ textAlign: 'center', marginBottom: '4px' }}>
  <img 
    src="/connecta_logo.svg" 
    alt="Logo" 
    style={{ width: '160px', height: 'auto', objectFit: 'contain' }}
  />
</div>

        {/* Card */}
        <div style={{ background: 'rgba(26,26,38,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>Sign in</div>
            <div style={{ fontSize: '12px', color: '#5a5a78', marginTop: '3px' }}>Enter your credentials to continue</div>
          </div>

          <form onSubmit={handleSubmit(onLogin)}>

            {/* Email */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#5a5a78', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#5a5a78' }} />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="john@example.com"
                  style={{ width: '100%', background: '#1a1a26', border: '1px solid #3d3d52', borderRadius: '12px', padding: '11px 14px 11px 36px', fontSize: '13px', color: '#fff', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#3d3d52'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              {errors.email && <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>⚠ {errors.email.message}</div>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '500', color: '#5a5a78', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
<span onClick={() => navigate('/forgot-password')}
  style={{ fontSize: '11px', color: '#6C63FF', cursor: 'pointer', fontWeight: '500' }}>
  Forgot password?
</span>              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#5a5a78' }} />
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Your password"
                  style={{ width: '100%', background: '#1a1a26', border: '1px solid #3d3d52', borderRadius: '12px', padding: '11px 40px 11px 36px', fontSize: '13px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#3d3d52'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a78', padding: 0 }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>⚠ {errors.password.message}</div>}
            </div>

            {/* Button */}
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', background: loading ? 'rgba(108,99,255,0.5)' : 'linear-gradient(135deg, #6C63FF, #5a4ae8)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(108,99,255,0.35)', transition: 'all 0.2s' }}>
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</> : <><span>Sign in</span><ArrowRight size={15} /></>}
            </button>

          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#2d2d3d' }} />
            <span style={{ fontSize: '11px', color: '#5a5a78' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#2d2d3d' }} />
          </div>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#5a5a78' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#6C63FF', fontWeight: '500', textDecoration: 'none' }}>Create one</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#3d3d52', marginTop: '16px' }}>
          Protected with end-to-end encryption 🔒
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #3d3d52; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
