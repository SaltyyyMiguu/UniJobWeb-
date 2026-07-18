import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EmailOtpField from '../components/EmailOtpField';
import toast from 'react-hot-toast';

const DEGREES = [
  'Bachelor of Computer Science (Hons)',
  'Bachelor of Information Technology (Hons)',
  'Bachelor of Software Engineering (Hons)',
  'Bachelor of Data Science (Hons)',
  'Bachelor of Cybersecurity (Hons)',
  'Bachelor of Artificial Intelligence (Hons)',
  'Bachelor of Business Administration (Hons)',
  'Bachelor of Accounting (Hons)',
  'Bachelor of Engineering - Electrical (Hons)',
  'Bachelor of Engineering - Mechanical (Hons)',
  'Bachelor of Biomedical Science (Hons)',
  'Bachelor of Pharmacy (Hons)',
  'Other',
];

export default function StudentRegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', ucsiId: '', degreeProgram: '' });
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  const UCSI_REGEX = /^[a-zA-Z0-9._%+\-]+@ucsiuniversity\.edu\.my$/i;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!UCSI_REGEX.test(form.email)) {
      return toast.error('You must use a @ucsiuniversity.edu.my email address to register as a student.');
    }
    if (!emailVerified) return toast.error('Please verify your email first.');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match.');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters.');
    setLoading(true);
    try {
      await registerStudent(form);
      toast.success('Account created! Welcome to UniJobLink.');
      navigate('/student/dashboard');
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
            Join as a<br /><strong style={{ fontWeight: '700' }}>UCSI Student</strong>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: '1.7', margin: 0, maxWidth: '260px' }}>
            Access internship listings from top Malaysian companies, submit applications, and manage your career journey — all in one place.
          </p>

          <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {['Verified internship listings', 'Real-time application tracking', 'Direct messaging with HR'].map(f => (
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
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--txt-1, #111)', letterSpacing: '-0.03em', margin: 0, marginBottom: '4px' }}>Student Registration</h2>
            <p style={{ fontSize: '13px', color: 'var(--txt-3, #999)', margin: 0 }}>Create your UCSI internship account</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label">First Name</label>
                <input className="input auth-mobile-input" id="student-firstName" name="firstName" required placeholder="e.g. John"
                  value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Last Name</label>
                <input className="input auth-mobile-input" id="student-lastName" name="lastName" required placeholder="e.g. Lim"
                  value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="input-label">UCSI Student ID</label>
              <input className="input auth-mobile-input" id="student-ucsiId" name="ucsiId" required placeholder="e.g. 1002473193"
                value={form.ucsiId} onChange={e => setForm(f => ({ ...f, ucsiId: e.target.value }))} />
            </div>

            <div>
              <label className="input-label">Degree Programme</label>
              <select className="input auth-mobile-input" id="student-degree" name="degreeProgram" required
                value={form.degreeProgram} onChange={e => setForm(f => ({ ...f, degreeProgram: e.target.value }))}>
                <option value="">Select your programme…</option>
                {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <EmailOtpField
              label="UCSI Email" id="student-email" placeholder="student@ucsiuniversity.edu.my"
              email={form.email} onEmailChange={v => { setForm(f => ({ ...f, email: v })); setEmailVerified(false); }}
              emailValid={UCSI_REGEX.test(form.email)}
              invalidMessage="Must be a @ucsiuniversity.edu.my email address"
              verified={emailVerified} onVerified={setEmailVerified}
            />

            <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label">Password</label>
                <input className="input auth-mobile-input" id="student-password" name="password" type="password" required placeholder="Min 8 chars"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Confirm Password</label>
                <input className="input auth-mobile-input" id="student-confirmPassword" name="confirmPassword" type="password" required placeholder="Repeat"
                  value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
              </div>
            </div>

            <button type="submit" disabled={loading || !emailVerified} className="btn btn-primary btn-lg auth-mobile-btn"
              style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}>
              {loading ? 'Creating Account…' : emailVerified ? 'Create Student Account' : 'Verify your email to continue'}
            </button>
          </form>

          <div style={{ height: '1px', background: 'var(--border, #E5E5E3)', margin: '24px 0' }} />
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--txt-3, #999)', margin: 0 }}>
            Registering as a company instead?{' '}
            <Link to="/register/company" style={{ color: 'var(--red, #C41E3A)', fontWeight: '600', textDecoration: 'none' }}>Company sign-up →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
