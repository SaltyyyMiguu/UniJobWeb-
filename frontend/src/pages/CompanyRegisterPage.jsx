import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EmailOtpField from '../components/EmailOtpField';
import toast from 'react-hot-toast';
import logo from '../assets/logo.webp';

const INDUSTRIES = [
  'Information Technology', 'Finance & Banking', 'Healthcare',
  'Engineering', 'Marketing & E-Commerce', 'Education',
  'Manufacturing', 'Consulting', 'Media & Communications', 'Other',
];

export default function CompanyRegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', companyName: '', ssmNumber: '', industry: '' });
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const { registerCompany } = useAuth();
  const navigate = useNavigate();

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailVerified) return toast.error('Please verify your email first.');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match.');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters.');
    setLoading(true);
    try {
      await registerCompany(form);
      toast.success('Registration submitted! Awaiting admin verification.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: 'var(--bg)' }}>
      {/* Left panel */}
      <div style={{ width: '38%', background: '#1A2235', display: 'flex', flexDirection: 'column', padding: '48px', position: 'relative', overflow: 'hidden' }} className="hidden md:flex">
        <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: 'rgba(196,30,58,0.05)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '50%', height: '2px', background: '#C41E3A' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '56px' }}>
          <img src={logo} alt="UniJobLink" style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '6px', flexShrink: 0 }} />
          <div>
            <p style={{ color: '#fff', fontWeight: '700', fontSize: '14px', margin: 0 }}>UniJobLink</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>UCSI University</p>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ width: '36px', height: '2px', background: '#C41E3A', marginBottom: '20px' }} />
          <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: '300', lineHeight: '1.4', margin: 0, marginBottom: '12px', letterSpacing: '-0.02em' }}>
            Partner with<br /><strong style={{ fontWeight: '700' }}>UCSI University</strong>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: '1.7', margin: 0, maxWidth: '260px' }}>
            Post internship openings, review student applications and build your talent pipeline directly from Malaysia's top university.
          </p>

          <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {['Access to verified UCSI talent', 'Manage applications in one portal', 'Admin-verified company accounts'].map(f => (
              <div key={f} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '5px', height: '5px', background: '#C41E3A', flexShrink: 0 }} />
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', margin: 0 }}>{f}</p>
              </div>
            ))}
          </div>

          {/* Verification note */}
          <div style={{ marginTop: '32px', padding: '14px 16px', background: 'rgba(196,30,58,0.12)', borderLeft: '2px solid #C41E3A' }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: 0, lineHeight: '1.6' }}>
              ⚠ Company accounts require admin verification before accessing the platform. You will be notified once approved.
            </p>
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>© {new Date().getFullYear()} UCSI University</p>
      </div>

      {/* Right — form */}
      {/* minWidth:0 overrides the flex default of min-width:auto — without
         it, the OTP row's non-shrinking "Send OTP"/"Verify" button (nowrap
         text + flex-shrink:0) propagates its min-content width all the way
         up through this flex:1 item, forcing the whole page wider than the
         viewport on narrow screens instead of letting this panel shrink. */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'var(--bg, #F7F7F5)' }}>
        <div className="auth-mobile-card" style={{ width: '100%', maxWidth: '420px' }}>
          {/* Back link */}
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--txt-3, #999)', marginBottom: '28px', textDecoration: 'none', fontWeight: '500' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--red, #C41E3A)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--txt-3, #999)'}>
            ← Back to Sign In
          </Link>

          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--txt-1, #111)', letterSpacing: '-0.03em', margin: 0, marginBottom: '4px' }}>Company Registration</h2>
            <p style={{ fontSize: '13px', color: 'var(--txt-3, #999)', margin: 0 }}>Register your company as an industry partner</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="input-label">Company Name</label>
              <input className="input auth-mobile-input" id="company-name" name="companyName" required placeholder="e.g. Petronas Digital Sdn Bhd"
                value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} />
            </div>

            <div>
              <label className="input-label">SSM Registration Number</label>
              <input className="input auth-mobile-input" id="company-ssm" name="ssmNumber" required placeholder="e.g. PD-198901012345"
                value={form.ssmNumber} onChange={e => setForm(f => ({ ...f, ssmNumber: e.target.value }))} />
              <p style={{ fontSize: '11px', color: 'var(--txt-3, #999)', margin: '4px 0 0' }}>Used to verify your company's legal registration with admin.</p>
            </div>

            <div>
              <label className="input-label">Industry</label>
              <select className="input auth-mobile-input" id="company-industry" name="industry" required
                value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}>
                <option value="">Select industry…</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <EmailOtpField
              label="Corporate Email" id="company-email" placeholder="hr@yourcompany.com"
              email={form.email} onEmailChange={v => { setForm(f => ({ ...f, email: v })); setEmailVerified(false); }}
              emailValid={EMAIL_REGEX.test(form.email)}
              invalidMessage="Enter a valid email address"
              verified={emailVerified} onVerified={setEmailVerified}
            />

            <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label">Password</label>
                <input className="input auth-mobile-input" id="company-password" name="password" type="password" required placeholder="Min 8 chars"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Confirm Password</label>
                <input className="input auth-mobile-input" id="company-confirmPassword" name="confirmPassword" type="password" required placeholder="Repeat"
                  value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
              </div>
            </div>

            <button type="submit" disabled={loading || !emailVerified} className="btn btn-primary btn-lg auth-mobile-btn"
              style={{ width: '100%', justifyContent: 'center', marginTop: '6px', background: '#1A2235', borderColor: '#1A2235' }}>
              {loading ? 'Submitting…' : emailVerified ? 'Submit Company Registration' : 'Verify your email to continue'}
            </button>
          </form>

          <div style={{ height: '1px', background: 'var(--border, #E5E5E3)', margin: '24px 0' }} />
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--txt-3, #999)', margin: 0 }}>
            Registering as a student?{' '}
            <Link to="/register/student" style={{ color: 'var(--red, #C41E3A)', fontWeight: '600', textDecoration: 'none' }}>Student sign-up →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
