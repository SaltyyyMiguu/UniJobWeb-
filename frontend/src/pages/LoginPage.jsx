import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import logo from '../assets/logo.webp';

export default function LoginPage() {
  const { login } = useAuth();
  const { c } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { role } = await login(form.email, form.password);
      if (role === 'STUDENT') navigate('/student/dashboard');
      else if (role === 'COMPANY') navigate('/company/dashboard');
      else if (role === 'SUPERVISOR') navigate('/supervisor/dashboard');
      else navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Left — Brand panel */}
      <div style={{
        width: '42%', minHeight: '100vh',
        background: '#1A2235',
        display: 'flex', flexDirection: 'column',
        padding: '0',
        position: 'relative', overflow: 'hidden',
      }} className="hidden md:flex">
        {/* Geometric accents */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', background: 'rgba(196,30,58,0.06)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '60%', height: '2px', background: '#C41E3A' }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
              <img src={logo} alt="UniJobLink" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px', flexShrink: 0 }} />
              <div>
                <p style={{ color: '#fff', fontWeight: '700', fontSize: '15px', letterSpacing: '-0.02em', margin: 0 }}>UniJobLink</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>UCSI University</p>
              </div>
            </div>

            {/* Hero text */}
            <div>
              <div style={{ width: '40px', height: '2px', background: '#C41E3A', marginBottom: '24px' }} />
              <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: '300', lineHeight: '1.3', letterSpacing: '-0.02em', margin: 0, marginBottom: '16px' }}>
                Your career<br /><span style={{ fontWeight: '700' }}>starts here.</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', lineHeight: '1.7', margin: 0, maxWidth: '280px' }}>
                The official internship management and placement platform for UCSI University students and industry partners.
              </p>
            </div>
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              ['Browse Internships', 'Discover verified opportunities from top Malaysian companies.'],
              ['Track Applications', 'Monitor every stage of your internship application in real time.'],
              ['Connect Directly', 'Message company HR partners directly through the platform.'],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '6px', height: '6px', background: '#C41E3A', marginTop: '6px', flexShrink: 0 }} />
                <div>
                  <p style={{ color: '#fff', fontSize: '13px', fontWeight: '600', margin: 0 }}>{title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0, marginTop: '3px', lineHeight: '1.5' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', letterSpacing: '0.04em' }}>
            © {new Date().getFullYear()} UCSI University · Official Internship Hub
          </p>
        </div>
      </div>

      {/* Right — Login form */}
      <div style={{
        flex: 1,
        background: c.bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px',
      }}>
        {/* Mobile-only brand header */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', maxWidth: '380px',
          marginBottom: '20px', paddingBottom: '16px', borderBottom: `2px solid ${c.red}`,
        }} className="max-md:flex md:hidden">
          {/* Logo section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <img src={logo} alt="UniJobLink" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px', flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: '700', fontSize: '15px', color: c.txt1, margin: 0, letterSpacing: '-0.01em' }}>UniJobLink</p>
              <p style={{ fontSize: '11px', color: c.red, margin: 0, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>UCSI University</p>
            </div>
          </div>

          {/* Tagline */}
          <p style={{ fontSize: '13px', fontWeight: '600', color: c.txt1, margin: '8px 0 4px 0', lineHeight: '1.3' }}>
            Find internships & build your career.
          </p>
          <p style={{ fontSize: '12px', color: c.txt2, margin: 0, lineHeight: '1.4' }}>
            Official internship platform for UCSI students & companies.
          </p>
        </div>

        <div className="auth-mobile-card" style={{ width: '100%', maxWidth: '380px' }}>
          {/* Login section heading */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: c.txt1, letterSpacing: '-0.03em', margin: 0, marginBottom: '6px' }}>
              Sign in
            </h2>
            <p style={{ fontSize: '14px', color: c.txt3, margin: 0 }}>Access your internship portal</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="input-label">Email address</label>
              <input className="input auth-mobile-input" type="email" id="email" required autoComplete="email"
                placeholder="your@ucsiuniversity.edu.my"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input className="input auth-mobile-input" type="password" id="password" required autoComplete="current-password"
                placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg auth-mobile-btn"
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <div style={{ textAlign: 'right' }}>
              <Link to="/forgot-password" style={{ fontSize: '12px', color: c.txt3, textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = c.red}
                onMouseLeave={e => e.currentTarget.style.color = c.txt3}>
                Forgot password?
              </Link>
            </div>
          </form>

          <div style={{ height: '1px', background: c.border, margin: '28px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to="/register/student" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', background: c.surface,
              border: `1px solid ${c.border}`, fontSize: '13px', fontWeight: '500', color: c.txt1,
              transition: 'border-color 0.15s',
            }} onMouseEnter={e => e.currentTarget.style.borderColor = c.red}
               onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
              <span>Register as Student</span>
              <span style={{ color: c.red, fontSize: '16px' }}>→</span>
            </Link>
            <Link to="/register/company" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', background: c.surface,
              border: `1px solid ${c.border}`, fontSize: '13px', fontWeight: '500', color: c.txt1,
              transition: 'border-color 0.15s',
            }} onMouseEnter={e => e.currentTarget.style.borderColor = c.red}
               onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
              <span>Register as Company</span>
              <span style={{ color: c.red, fontSize: '16px' }}>→</span>
            </Link>
            <Link to="/register/supervisor" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', background: c.surface,
              border: `1px solid ${c.border}`, fontSize: '13px', fontWeight: '500', color: c.txt1,
              transition: 'border-color 0.15s',
            }} onMouseEnter={e => e.currentTarget.style.borderColor = c.red}
               onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
              <span>Register as Supervisor</span>
              <span style={{ color: c.red, fontSize: '16px' }}>→</span>
            </Link>
          </div>

          <p style={{ textAlign: 'center', fontSize: '11px', color: c.txt3, marginTop: '32px' }}>
            UCSI University · UniJobLink v2.0
          </p>
        </div>
      </div>
    </div>
  );
}
