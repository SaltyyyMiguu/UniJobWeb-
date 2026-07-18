import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard, Search, ClipboardList, MessageSquare,
  User
} from 'lucide-react';
import api, { API_BASE_URL } from '../../api/axios';
import ThemeToggle from '../ThemeToggle';

export default function StudentLayout({ children }) {
  const { profile } = useAuth();
  const { c } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    api.get('/student/unread-count')
      .then(res => setUnreadCount(res.data.count || 0))
      .catch(() => {});
    api.get('/student/notifications/count')
      .then(res => setUpdateCount(res.data.count || 0))
      .catch(() => {});
  }, []);

  const NAV = [
    { to: '/student/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
    { to: '/student/jobs',         icon: Search,          label: 'Find Jobs'    },
    { to: '/student/applications', icon: ClipboardList,   label: 'Applications', badge: updateCount },
    { to: '/student/messages',     icon: MessageSquare,   label: 'Messages', badge: unreadCount },
    { to: '/student/profile',      icon: User,            label: 'My Profile'   },
  ];

  const avatarLetter = profile?.firstName?.[0]?.toUpperCase() || 'S';
  const avatarSrc = profile?.profileImageUrl
    ? `${API_BASE_URL}/${profile.profileImageUrl}`
    : null;

  const Sidebar = () => (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: c.surface, borderRight: `1px solid ${c.border}`,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', background: c.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontWeight: '900', fontSize: '13px' }}>U</span>
          </div>
          <div>
            <p style={{ fontWeight: '700', fontSize: '13px', color: c.txt1, margin: 0, letterSpacing: '-0.01em' }}>UniJobLink</p>
            <p style={{ fontSize: '10px', color: c.txt3, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>UCSI University</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* User pill */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${c.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', background: avatarSrc ? 'transparent' : c.red, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>{avatarLetter}</span>}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: c.txt1, margin: 0, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.firstName} {profile?.lastName}
            </p>
            <p style={{ fontSize: '11px', color: c.red, margin: '3px 0 0', fontWeight: '500' }}>Student</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        <p className="section-label" style={{ padding: '8px 12px 6px', display: 'block' }}>Navigation</p>
        {NAV.map(({ to, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} onClick={() => {
            if (to.includes('messages')) setUnreadCount(0);
            if (to.includes('applications') && updateCount > 0) {
              setUpdateCount(0);
              api.post('/student/notifications/mark-seen').catch(() => {});
            }
          }}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            style={{ position: 'relative' }}>
            <Icon size={15} style={{ flexShrink: 0 }} />
            {label}
            {badge > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: c.red, color: '#fff',
                fontSize: '10px', fontWeight: '700',
                borderRadius: '10px',
                padding: '1px 6px',
                minWidth: '18px', textAlign: 'center',
              }}>
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 8px', borderTop: `1px solid ${c.border}` }}>
        <p style={{ fontSize: '10px', color: c.txt3, padding: '6px 12px 2px', margin: 0 }}>
          © {new Date().getFullYear()} UCSI University
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: c.bg }}>
      <aside
        style={{ position: 'fixed', top: 0, left: 0, height: '100%', width: '220px', zIndex: 30 }}
        className="max-md:hidden">
        <Sidebar />
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '220px' }} className="max-md:ml-0 main-content-wrapper">
        <header style={{ background: c.surface, borderBottom: `1px solid ${c.border}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', position: 'sticky', top: 0, zIndex: 10 }} className="md:hidden">
          <div style={{ width: '22px', height: '22px', background: c.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: '900', fontSize: '10px' }}>U</span>
          </div>
          <span style={{ fontWeight: '700', fontSize: '13px', color: c.txt1 }}>UniJobLink</span>
          <div style={{ marginLeft: 'auto' }}>
            <ThemeToggle />
          </div>
        </header>
        <main className="px-4 py-5 md:px-8 md:py-7" style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
        <footer className="px-4 py-3 md:px-8" style={{ borderTop: `1px solid ${c.border}`, display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'space-between', fontSize: '11px', color: c.txt3, background: c.surface }}>
          <span>© {new Date().getFullYear()} UCSI University · UniJobLink</span>
          <span style={{ color: c.red }}>Official Internship Hub</span>
        </footer>
      </div>

      {/* Bottom "thumb zone" navigation — mobile only (hidden by default, shown via CSS media query) */}
      <nav className="bottom-nav" style={{ display: 'none' }}>
        {NAV.map(({ to, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} onClick={() => {
            if (to.includes('messages')) setUnreadCount(0);
            if (to.includes('applications') && updateCount > 0) {
              setUpdateCount(0);
              api.post('/student/notifications/mark-seen').catch(() => {});
            }
          }}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
            <Icon size={20} />
            <span>{label === 'Find Jobs' ? 'Jobs' : label === 'My Profile' ? 'Profile' : label}</span>
            {badge > 0 && <span className="bottom-nav-badge">{badge > 99 ? '99+' : badge}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
