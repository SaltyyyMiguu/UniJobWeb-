import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { resetToken, expiresAt }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setResult(res.data);
      toast.success('Reset token generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg, #F7F7F5)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <div style={{ width: '26px', height: '26px', background: '#C41E3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: '900', fontSize: '12px' }}>U</span>
          </div>
          <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--txt-1, #111)' }}>UniJobLink</span>
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--txt-1, #111)', margin: '0 0 6px', letterSpacing: '-0.03em' }}>
          Forgot Password
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--txt-3, #999)', margin: '0 0 28px' }}>
          Enter your account email to receive a password reset token.
        </p>

        {!result ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="input-label">Email address</label>
              <input
                className="input" type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Generating…' : 'Send Reset Token'}
            </button>
          </form>
        ) : (
          <div>
            <div style={{ padding: '16px', background: 'rgba(26,127,90,0.08)', border: '1px solid rgba(26,127,90,0.25)', marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#1A7F5A', margin: '0 0 8px' }}>Reset Token Generated</p>
              <p style={{ fontSize: '11px', color: 'var(--txt-2)', margin: '0 0 10px', lineHeight: '1.5' }}>
                Copy this token and use it on the Reset Password page. It expires in 1 hour.
              </p>
              <div style={{ padding: '10px', background: 'var(--surface, #fff)', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '12px', color: 'var(--txt-1)', wordBreak: 'break-all', userSelect: 'all' }}>
                {result.resetToken}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--txt-3)', margin: '8px 0 0' }}>
                ⏰ Expires: {result.expiresAt ? new Date(result.expiresAt).toLocaleTimeString() : 'in 1 hour'}
              </p>
            </div>
            <Link to="/reset-password" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', display: 'flex' }}>
              Go to Reset Password →
            </Link>
          </div>
        )}

        <div style={{ height: '1px', background: 'var(--border, #E5E5E3)', margin: '24px 0' }} />
        <Link to="/login" style={{ fontSize: '12px', color: 'var(--txt-3)', textDecoration: 'none' }}>
          ← Back to Sign In
        </Link>
      </div>
    </div>
  );
}
