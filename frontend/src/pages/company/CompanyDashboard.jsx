import { useEffect, useState } from 'react';
import api from '../../api/axios';
import CompanyLayout from '../../components/layouts/CompanyLayout';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, Users, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CompanyDashboard() {
  const { c } = useTheme();
  const { profile } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/company/dashboard').then(res => setData(res.data)).catch(console.error);
  }, []);

  const STATS = [
    { label: 'Active Listings', value: data?.stats?.activeJobs ?? '—', icon: Briefcase, color: c.green },
    { label: 'Total Applicants', value: data?.stats?.totalApplications ?? '—', icon: Users, color: c.txt1 },
    { label: 'Pending Review', value: data?.stats?.pending ?? '—', icon: Clock, color: c.amber },
  ];

  return (
    <CompanyLayout>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: c.txt1, letterSpacing: '-0.03em', margin: 0 }}>
            {profile?.companyName || 'Company'} Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: c.txt3, margin: '4px 0 0' }}>Your recruitment activity overview</p>
        </div>
        <Link to="/company/jobs" className="btn btn-primary btn-sm">
          Post New Job <ArrowRight size={13} />
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: '12px', marginBottom: '28px' }}>
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div className="stat-card" key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-num" style={{ color }}>{value}</div>
                <div className="stat-label">{label}</div>
              </div>
              <Icon size={18} style={{ color, opacity: 0.45, marginTop: '4px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <p className="section-label" style={{ marginBottom: '14px' }}>Quick Actions</p>
        <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '10px' }}>
          {[
            { to: '/company/jobs',         label: 'Manage Job Postings',     desc: 'Create and edit your listings'       },
            { to: '/company/applications', label: 'Review Applications',      desc: 'Accept or reject candidates'          },
            { to: '/company/messages',     label: 'Candidate Messages',       desc: 'Chat with accepted applicants'        },
            { to: '/company/profile',      label: 'Edit Company Profile',     desc: 'Update your company information'      },
          ].map(({ to, label, desc }) => (
            <Link key={to} to={to} style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ padding: '14px 16px', borderLeft: `3px solid ${c.red}` }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: c.txt1, margin: 0 }}>{label}</p>
                <p style={{ fontSize: '12px', color: c.txt3, margin: '3px 0 0' }}>{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </CompanyLayout>
  );
}
