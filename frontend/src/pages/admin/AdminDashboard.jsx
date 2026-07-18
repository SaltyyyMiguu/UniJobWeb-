import { useEffect, useState } from 'react';
import api from '../../api/axios';
import AdminLayout from '../../components/layouts/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Users, Briefcase, CheckCircle, Clock, ArrowRight, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { c } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then(res => setStats(res.data)).catch(console.error);
  }, []);

  const STATS = [
    { label: 'Total Students', value: stats?.totalStudents, icon: Users, color: c.txt1 },
    { label: 'Verified Companies', value: stats?.totalCompanies, icon: Briefcase, color: c.green },
    { label: 'Students Placed', value: stats?.totalPlacements, icon: CheckCircle, color: c.red },
    { label: 'Pending Verifications', value: stats?.pendingVerifications, icon: Clock, color: c.amber },
  ];

  return (
    <AdminLayout>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: c.txt1, letterSpacing: '-0.03em', margin: 0 }}>Admin Dashboard</h1>
        <p style={{ fontSize: '13px', color: c.txt3, margin: '4px 0 0' }}>UCSI University · UniJobLink System Overview</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: '12px', marginBottom: '28px' }}>
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div className="stat-card" key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-num" style={{ color }}>{value ?? '—'}</div>
                <div className="stat-label">{label}</div>
              </div>
              <Icon size={18} style={{ color, opacity: 0.45, marginTop: '4px' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '20px 24px', marginBottom: '20px' }}>
        <p className="section-label" style={{ marginBottom: '14px' }}>Admin Actions</p>
        <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '10px' }}>
          {[
            { to: '/admin/approvals', label: 'Company Approvals', desc: 'Review and verify pending companies', badge: stats?.pendingVerifications || 0 },
            { to: '/admin/users',     label: 'User Management', desc: 'Search, edit, and manage all students, companies & supervisors' },
          ].map(({ to, label, desc, badge }) => (
            <Link key={to} to={to} style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ padding: '16px 20px', borderLeft: `3px solid ${c.red}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: c.txt1, margin: 0 }}>{label}</p>
                    {badge > 0 && <span className="badge badge-red">{badge}</span>}
                  </div>
                  <p style={{ fontSize: '12px', color: c.txt3, margin: '3px 0 0' }}>{desc}</p>
                </div>
                <ArrowRight size={14} style={{ color: c.txt3, flexShrink: 0 }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ fontSize: '13px', color: c.txt2, margin: 0 }}>Signed in as Administrator.</p>
        <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-outline btn-sm">
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </AdminLayout>
  );
}
