import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import logo from '../assets/logo.webp';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ token: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return toast.error('Passwords do not match.');
    if (form.newPassword.length < 8) return toast.error('Password must be at least 8 characters.');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: form.token, newPassword: form.newPassword });
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Token may be invalid or expired.');
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
          Reset Password
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--txt-3, #999)', margin: '0 0 28px' }}>
          Enter your reset token and choose a new password.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="input-label">Reset Token</label>
            <input
              className="input" type="text" required
              value={form.token} onChange={e => setForm(f => ({ ...f, token: e.target.value }))}
              placeholder="Paste your reset token here"
              style={{ fontFamily: 'monospace' }}
            />
          </div>
          <div>
            <label className="input-label">New Password</label>
            <input
              className="input" type="password" required
              value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
              placeholder="Min 8 characters"
            />
          </div>
          <div>
            <label className="input-label">Confirm New Password</label>
            <input
              className="input" type="password" required
              value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="Repeat new password"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>

        <div style={{ height: '1px', background: 'var(--border, #E5E5E3)', margin: '24px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Link to="/login" style={{ fontSize: '12px', color: 'var(--txt-3)', textDecoration: 'none' }}>← Back to Sign In</Link>
          <Link to="/forgot-password" style={{ fontSize: '12px', color: '#C41E3A', textDecoration: 'none' }}>Get new token</Link>
        </div>
      </div>
    </div>
  );
}
