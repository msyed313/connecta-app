import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Shield, Lock, Eye, EyeOff, ArrowRight, Loader2, ChevronLeft, KeyRound, CheckCircle } from 'lucide-react';
import { authApi } from '../api/authApi';

type Step = 'email' | 'otp' | 'reset' | 'done';

const S = {
  page:  { minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties,
  wrap:  { width: '100%', maxWidth: '360px', position: 'relative', zIndex: 10 } as React.CSSProperties,
  card:  { background: 'rgba(26,26,38,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' } as React.CSSProperties,
  label: { display: 'block', fontSize: '11px', fontWeight: '500', color: '#5a5a78', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' } as React.CSSProperties,
  input: { width: '100%', background: '#1a1a26', border: '1px solid #3d3d52', borderRadius: '12px', padding: '11px 14px 11px 36px', fontSize: '13px', color: '#fff', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
  error: { fontSize: '11px', color: '#f87171', marginTop: '4px' } as React.CSSProperties,
  btn:   { width: '100%', padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #6C63FF, #5a4ae8)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(108,99,255,0.35)' } as React.CSSProperties,
};

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step,        setStep]        = useState<Step>('email');
  const [email,       setEmail]       = useState('');
  const [otp,         setOtp]         = useState(['', '', '', '', '', '']);
  const [verifiedOtp, setVerifiedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#6C63FF';
    e.target.style.boxShadow   = '0 0 0 3px rgba(108,99,255,0.15)';
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#3d3d52';
    e.target.style.boxShadow   = 'none';
  };

  // ── Step 1: Send OTP ──────────────────────────────────
  const onSendOtp = async () => {
    if (!email.trim()) { toast.error('Please enter your email address.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { toast.error('Please enter a valid email address.'); return; }

    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      toast.success('Reset code sent to your email! 📬');
      setStep('otp');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handlers ────────────────────────────────
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

  // ── Step 2: Verify OTP ────────────────────────────────
  const onVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) { toast.error('Enter the full 6-digit code.'); return; }

    setLoading(true);
    try {
      await authApi.verifyResetOtp(email, otpCode);
      setVerifiedOtp(otpCode);
      toast.success('Code verified! Set your new password. ✅');
      setStep('reset');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Invalid or expired code.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset Password ────────────────────────────
  const onResetPassword = async () => {
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPass) { toast.error('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await authApi.resetPassword(email, verifiedOtp, newPassword);
      toast.success('Password reset successfully! 🎉');
      setStep('done');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // ── Progress indicator ────────────────────────────────
  const steps = ['email', 'otp', 'reset'];
  const currentIndex = steps.indexOf(step);

  return (
    <div style={S.page}>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-5%', left: '-5%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(90,74,232,0.1) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(rgba(108,99,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div style={S.wrap}>

        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
   <img 
    src="/connecta_logo.svg" 
    alt="Logo" 
    style={{ width: '150px', height: 'auto' }}
  />
        </div>

        {/* Progress bar — only show during steps 1-3 */}
        {step !== 'done' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
            {['Email', 'Verify', 'Reset'].map((label, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '100%', height: '3px', borderRadius: '2px', background: i <= currentIndex ? '#6C63FF' : '#2d2d3d', transition: 'background 0.3s' }} />
                <span style={{ fontSize: '10px', color: i <= currentIndex ? '#6C63FF' : '#3d3d52', fontWeight: '500', transition: 'color 0.3s' }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div style={S.card}>

          {/* ══ STEP 1: ENTER EMAIL ══ */}
          {step === 'email' && (
            <>
              <button onClick={() => navigate('/login')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#5a5a78', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '16px' }}>
                <ChevronLeft size={14} /> Back to login
              </button>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', marginBottom: '12px' }}>
                  <KeyRound size={22} color="#6C63FF" />
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>Forgot password?</div>
                <div style={{ fontSize: '12px', color: '#5a5a78', marginTop: '4px', lineHeight: '1.6' }}>
                  No worries! Enter your email and we'll send you a reset code.
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={S.label}>Email address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#5a5a78' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && onSendOtp()}
                    placeholder="john@example.com"
                    style={S.input}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>
              </div>

              <button onClick={onSendOtp} disabled={loading}
                style={{ ...S.btn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending code...</>
                  : <><span>Send Reset Code</span><ArrowRight size={15} /></>
                }
              </button>

              <p style={{ textAlign: 'center', fontSize: '12px', color: '#5a5a78', marginTop: '14px' }}>
                Remembered your password?{' '}
                <span onClick={() => navigate('/login')}
                  style={{ color: '#6C63FF', fontWeight: '500', cursor: 'pointer' }}>
                  Sign in
                </span>
              </p>
            </>
          )}

          {/* ══ STEP 2: VERIFY OTP ══ */}
          {step === 'otp' && (
            <>
              <button onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#5a5a78', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '16px' }}>
                <ChevronLeft size={14} /> Back
              </button>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', marginBottom: '12px' }}>
                  <Shield size={22} color="#6C63FF" />
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>Enter reset code</div>
                <div style={{ fontSize: '12px', color: '#5a5a78', marginTop: '4px', lineHeight: '1.6' }}>
                  We sent a 6-digit code to<br />
                  <span style={{ color: '#6C63FF', fontWeight: '500' }}>{email}</span>
                </div>
              </div>

              {/* OTP boxes */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
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
                    style={{
                      width: '44px', height: '44px', textAlign: 'center',
                      fontSize: '18px', fontWeight: '600', color: '#fff',
                      background: '#1a1a26',
                      border: `1px solid ${digit ? '#6C63FF' : '#3d3d52'}`,
                      borderRadius: '12px', outline: 'none', boxSizing: 'border-box',
                      boxShadow: digit ? '0 0 0 3px rgba(108,99,255,0.15)' : 'none',
                      transition: 'all 0.15s'
                    }}
                    onFocus={e => { e.target.style.borderColor = '#6C63FF'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.15)'; }}
                    onBlur={e => { if (!digit) { e.target.style.borderColor = '#3d3d52'; e.target.style.boxShadow = 'none'; }}}
                  />
                ))}
              </div>

              {/* Expiry note */}
              <p style={{ textAlign: 'center', fontSize: '11px', color: '#3d3d52', marginBottom: '16px' }}>
                Code expires in 10 minutes
              </p>

              <button onClick={onVerifyOtp} disabled={loading}
                style={{ ...S.btn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</>
                  : <><Shield size={15} /><span>Verify Code</span></>
                }
              </button>

              <p style={{ textAlign: 'center', fontSize: '12px', color: '#5a5a78', marginTop: '12px' }}>
                Didn't receive it?{' '}
                <button
                  onClick={() => { setOtp(['', '', '', '', '', '']); setStep('email'); }}
                  style={{ color: '#6C63FF', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', padding: 0 }}>
                  Resend code
                </button>
              </p>
            </>
          )}

          {/* ══ STEP 3: SET NEW PASSWORD ══ */}
          {step === 'reset' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', marginBottom: '12px' }}>
                  <Lock size={22} color="#6C63FF" />
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>Set new password</div>
                <div style={{ fontSize: '12px', color: '#5a5a78', marginTop: '4px' }}>
                  Choose a strong password for your account
                </div>
              </div>

              {/* New password */}
              <div style={{ marginBottom: '14px' }}>
                <label style={S.label}>New password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#5a5a78' }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    style={{ ...S.input, paddingRight: '40px' }}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a78', padding: 0 }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {newPassword.length > 0 && newPassword.length < 6 &&
                  <div style={S.error}>⚠ At least 6 characters required</div>
                }
              </div>

              {/* Confirm password */}
              <div style={{ marginBottom: '20px' }}>
                <label style={S.label}>Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#5a5a78' }} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    placeholder="Repeat your password"
                    style={{ ...S.input, paddingRight: '40px' }}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a78', padding: 0 }}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmPass.length > 0 && newPassword !== confirmPass &&
                  <div style={S.error}>⚠ Passwords do not match</div>
                }
                {confirmPass.length > 0 && newPassword === confirmPass && newPassword.length >= 6 &&
                  <div style={{ fontSize: '11px', color: '#4ade80', marginTop: '4px' }}>✓ Passwords match</div>
                }
              </div>

              {/* Password strength indicator */}
              {newPassword.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '3px', borderRadius: '2px',
                        background: newPassword.length >= i * 4
                          ? i === 1 ? '#f87171' : i === 2 ? '#facc15' : '#4ade80'
                          : '#2d2d3d',
                        transition: 'background 0.3s'
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '10px', color: newPassword.length < 4 ? '#f87171' : newPassword.length < 8 ? '#facc15' : '#4ade80' }}>
                    {newPassword.length < 4 ? 'Weak' : newPassword.length < 8 ? 'Medium' : 'Strong'} password
                  </span>
                </div>
              )}

              <button onClick={onResetPassword} disabled={loading}
                style={{ ...S.btn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Resetting...</>
                  : <><Lock size={15} /><span>Reset Password</span></>
                }
              </button>
            </>
          )}

          {/* ══ DONE ══ */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', marginBottom: '16px' }}>
                <CheckCircle size={28} color="#4ade80" />
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
                Password reset! 🎉
              </div>
              <div style={{ fontSize: '12px', color: '#5a5a78', marginBottom: '24px', lineHeight: '1.6' }}>
                Your password has been reset successfully.<br />You can now sign in with your new password.
              </div>
              <button onClick={() => navigate('/login')}
                style={{ ...S.btn }}>
                <span>Go to Sign in</span><ArrowRight size={15} />
              </button>
            </div>
          )}

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