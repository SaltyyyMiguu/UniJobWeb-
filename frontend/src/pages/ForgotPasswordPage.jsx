import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import logo from '../assets/logo.webp';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success('Reset email sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg, #F7F7F5)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <img src={logo} alt="UniJobLink" style={{ width: '26px', height: '26px', objectFit: 'contain', borderRadius: '5px', flexShrink: 0 }} />
          <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--txt-1, #111)' }}>UniJobLink</span>
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--txt-1, #111)', margin: '0 0 6px', letterSpacing: '-0.03em' }}>
          Forgot Password
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--txt-3, #999)', margin: '0 0 28px' }}>
          Enter your account email to receive a password reset token.
        </p>

        {!submitted ? (
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
              {loading ? 'Sending…' : 'Send Reset Token'}
            </button>
          </form>
        ) : (
          <div>
            <div style={{ padding: '16px', background: 'rgba(26,127,90,0.08)', border: '1px solid rgba(26,127,90,0.25)', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--txt-1)', margin: 0, lineHeight: '1.6' }}>
                If an account matches that email, we have sent a reset token to your inbox. Please check your email and use it on the next page.
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
