import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Loader2, ChevronLeft } from 'lucide-react';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

const registerSchema = z.object({
  userName: z.string().min(3, 'At least 3 characters').max(20, 'Max 20 characters'),
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'At least 6 characters'),
});
type RegisterForm = z.infer<typeof registerSchema>;

const inputStyle = {
  width: '100%', background: '#1a1a26', border: '1px solid #3d3d52',
  borderRadius: '12px', padding: '11px 14px 11px 36px',
  fontSize: '13px', color: '#fff', outline: 'none', boxSizing: 'border-box' as const,
};

export default function RegisterPage() {
  const navigate    = useNavigate();
  const { setAuth } = useAuthStore();
  const [step,       setStep]       = useState<'register' | 'otp'>('register');
  const [email,      setEmail]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [showPass,   setShowPass]   = useState(false);
  const [otp,        setOtp]        = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onRegister = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await authApi.register(data);
      setEmail(data.email);
      setStep('otp');
      toast.success('OTP sent to your email! 📬');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const onVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) { toast.error('Enter the full 6-digit OTP'); return; }
    setOtpLoading(true);
    try {
      const res = await authApi.verifyOtp({ email, otpCode });
      setAuth(
        { userId: res.data.userId, userName: res.data.userName, email: res.data.email },
        res.data.accessToken, res.data.refreshToken
      );
      toast.success('Account created! 🎉');
      navigate('/chat');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-5%', left: '-5%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(90,74,232,0.1) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(rgba(108,99,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div style={{ width: '100%', maxWidth: '360px', position: 'relative', zIndex: 10 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ textAlign: 'center', marginBottom: '4px' }}>
            <img 
               src="/connecta_logo.svg" 
                alt="Logo" 
                style={{ width: '140px', height: 'auto' }}
            />
          </div>
          <div style={{ fontSize: '12px', color: '#5a5a78', marginTop: '4px' }}>Connect with anyone, anywhere</div>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(26,26,38,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>

          {/* ── REGISTER STEP ── */}
          {step === 'register' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>Create account</div>
                <div style={{ fontSize: '12px', color: '#5a5a78', marginTop: '3px' }}>Fill in your details to get started</div>
              </div>

              <form onSubmit={handleSubmit(onRegister)}>

                {/* Username */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#5a5a78', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#5a5a78' }} />
                    <input {...register('userName')} placeholder="johndoe" style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = '#3d3d52'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                  {errors.userName && <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>⚠ {errors.userName.message}</div>}
                </div>

                {/* Email */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#5a5a78', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#5a5a78' }} />
                    <input {...register('email')} type="email" placeholder="john@example.com" style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = '#3d3d52'; e.target.style.boxShadow = 'none'; }} />
                  </div>
                  {errors.email && <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>⚠ {errors.email.message}</div>}
                </div>

                {/* Password */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#5a5a78', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#5a5a78' }} />
                    <input {...register('password')} type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
                      style={{ ...inputStyle, paddingRight: '40px' }}
                      onFocus={e => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = '#3d3d52'; e.target.style.boxShadow = 'none'; }} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a78', padding: 0 }}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>⚠ {errors.password.message}</div>}
                </div>

                {/* Button */}
                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: loading ? 'rgba(108,99,255,0.5)' : 'linear-gradient(135deg, #6C63FF, #5a4ae8)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(108,99,255,0.35)' }}>
                  {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending OTP...</> : <><span>Continue</span><ArrowRight size={15} /></>}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#2d2d3d' }} />
                <span style={{ fontSize: '11px', color: '#5a5a78' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: '#2d2d3d' }} />
              </div>

              <p style={{ textAlign: 'center', fontSize: '12px', color: '#5a5a78' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#6C63FF', fontWeight: '500', textDecoration: 'none' }}>Sign in</Link>
              </p>
            </>
          )}

          {/* ── OTP STEP ── */}
          {step === 'otp' && (
            <>
              <button onClick={() => setStep('register')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#5a5a78', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '16px' }}>
                <ChevronLeft size={14} /> Back
              </button>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', marginBottom: '12px' }}>
                  <Shield size={22} color="#6C63FF" />
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>Verify your email</div>
                <div style={{ fontSize: '12px', color: '#5a5a78', marginTop: '4px', lineHeight: '1.6' }}>
                  We sent a 6-digit code to<br />
                  <span style={{ color: '#6C63FF', fontWeight: '500' }}>{email}</span>
                </div>
              </div>

              {/* OTP boxes */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    style={{ width: '44px', height: '44px', textAlign: 'center', fontSize: '18px', fontWeight: '600', color: '#fff', background: '#1a1a26', border: `1px solid ${digit ? '#6C63FF' : '#3d3d52'}`, borderRadius: '12px', outline: 'none', boxSizing: 'border-box' as const, boxShadow: digit ? '0 0 0 3px rgba(108,99,255,0.15)' : 'none' }}
                    onFocus={e => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.15)'; }}
                    onBlur={e => { if (!digit) { e.target.style.borderColor = '#3d3d52'; e.target.style.boxShadow = 'none'; }}}
                  />
                ))}
              </div>

              <button onClick={onVerifyOtp} disabled={otpLoading}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: otpLoading ? 'rgba(108,99,255,0.5)' : 'linear-gradient(135deg, #6C63FF, #5a4ae8)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: otpLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(108,99,255,0.35)' }}>
                {otpLoading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</> : <><Shield size={15} /><span>Verify & Create Account</span></>}
              </button>

              <p style={{ textAlign: 'center', fontSize: '12px', color: '#5a5a78', marginTop: '12px' }}>
                Didn't receive it?{' '}
                <button onClick={() => { setOtp(['','','','','','']); setStep('register'); }}
                  style={{ color: '#6C63FF', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                  Resend OTP
                </button>
              </p>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#3d3d52', marginTop: '16px' }}>
          By continuing you agree to our Terms & Privacy
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
