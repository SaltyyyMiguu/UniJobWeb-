import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EmailOtpField from '../components/EmailOtpField';
import toast from 'react-hot-toast';

export default function SupervisorRegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', department: '', title: '' });
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const { registerSupervisor } = useAuth();
  const navigate = useNavigate();

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailVerified) return toast.error('Please verify your email first.');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match.');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters.');
    setLoading(true);
    try {
      await registerSupervisor(form);
      toast.success('Account created! Welcome to UniJobLink.');
      navigate('/supervisor/dashboard');
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
          <div style={{ width: '28px', height: '28px', background: '#C41E3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: '900', fontSize: '13px' }}>U</span>
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: '700', fontSize: '14px', margin: 0 }}>UniJobLink</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>UCSI University</p>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ width: '36px', height: '2px', background: '#C41E3A', marginBottom: '20px' }} />
          <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: '300', lineHeight: '1.4', margin: 0, marginBottom: '12px', letterSpacing: '-0.02em' }}>
            Guide the next<br /><strong style={{ fontWeight: '700' }}>generation.</strong>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: '1.7', margin: 0, maxWidth: '260px' }}>
            Supervise student internship placements, review their pipeline progress, and approve final placements as their academic supervisor.
          </p>

          <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {['Accept student supervision requests', 'Track student placement pipelines', 'Approve or reject final placements'].map(f => (
              <div key={f} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '5px', height: '5px', background: '#C41E3A', flexShrink: 0 }} />
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', margin: 0 }}>{f}</p>
              </div>
            ))}
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
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--txt-1, #111)', letterSpacing: '-0.03em', margin: 0, marginBottom: '4px' }}>Supervisor Registration</h2>
            <p style={{ fontSize: '13px', color: 'var(--txt-3, #999)', margin: 0 }}>Register as an academic supervisor</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label">First Name</label>
                <input className="input auth-mobile-input" id="supervisor-firstName" name="firstName" required placeholder="e.g. Amirah"
                  value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Last Name</label>
                <input className="input auth-mobile-input" id="supervisor-lastName" name="lastName" required placeholder="e.g. Hassan"
                  value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="input-label">Title</label>
              <input className="input auth-mobile-input" id="supervisor-title" name="title" placeholder="e.g. Senior Lecturer"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            <div>
              <label className="input-label">Department</label>
              <input className="input auth-mobile-input" id="supervisor-department" name="department" placeholder="e.g. Department of Computer Science"
                value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
            </div>

            <EmailOtpField
              label="Email" id="supervisor-email" placeholder="you@ucsiuniversity.edu.my"
              email={form.email} onEmailChange={v => { setForm(f => ({ ...f, email: v })); setEmailVerified(false); }}
              emailValid={EMAIL_REGEX.test(form.email)}
              invalidMessage="Enter a valid email address"
              verified={emailVerified} onVerified={setEmailVerified}
            />

            <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label">Password</label>
                <input className="input auth-mobile-input" id="supervisor-password" name="password" type="password" required placeholder="Min 8 chars"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Confirm Password</label>
                <input className="input auth-mobile-input" id="supervisor-confirmPassword" name="confirmPassword" type="password" required placeholder="Repeat"
                  value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
              </div>
            </div>

            <button type="submit" disabled={loading || !emailVerified} className="btn btn-primary btn-lg auth-mobile-btn"
              style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}>
              {loading ? 'Creating account…' : emailVerified ? 'Create Supervisor Account' : 'Verify your email to continue'}
            </button>
          </form>

          <div style={{ height: '1px', background: 'var(--border, #E5E5E3)', margin: '24px 0' }} />
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--txt-3, #999)', margin: 0 }}>
            Registering as a student or company?{' '}
            <Link to="/register/student" style={{ color: 'var(--red, #C41E3A)', fontWeight: '600', textDecoration: 'none' }}>Student sign-up →</Link>
            {' '}·{' '}
            <Link to="/register/company" style={{ color: 'var(--red, #C41E3A)', fontWeight: '600', textDecoration: 'none' }}>Company sign-up →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
