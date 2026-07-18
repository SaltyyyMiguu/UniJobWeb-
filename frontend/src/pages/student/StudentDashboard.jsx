import { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../../api/axios';
import StudentLayout from '../../components/layouts/StudentLayout';
import FeaturedJobsSlider from '../../components/FeaturedJobsSlider';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Briefcase, CheckCircle, XCircle, Clock, ArrowRight,
  AlertCircle, Gift, FileText, Star, MapPin, DollarSign,
  Trophy, ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import JobDetailModal from '../../components/JobDetailModal';
import HiredCelebration from '../../components/HiredCelebration';
import toast from 'react-hot-toast';
import { usePdfViewer } from '../../hooks/usePdfViewer';
import PdfViewerModal from '../../components/PdfViewerModal';

function RecommendedCard({ job, onView, c }) {
  const logoSrc = job.Company?.profileImageUrl
    ? `${API_BASE_URL}/${job.Company.profileImageUrl}`
    : null;
  return (
    <div
      className="card"
      onClick={() => onView(job)}
      style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start', transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--red)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ width: '40px', height: '40px', background: logoSrc ? 'transparent' : '#1A2235', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {logoSrc
          ? <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ color: '#fff', fontWeight: '800', fontSize: '16px' }}>{job.Company?.companyName?.[0] || 'C'}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: c.txt1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</p>
        <p style={{ fontSize: '11px', color: c.red, margin: '2px 0 0', fontWeight: '600' }}>{job.Company?.companyName}</p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
          {job.location && <span style={{ fontSize: '10px', color: c.txt3, display: 'flex', alignItems: 'center', gap: '2px' }}><MapPin size={9} />{job.location}</span>}
          {job.allowance && <span style={{ fontSize: '10px', color: c.green, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px' }}><DollarSign size={9} />{job.allowance}</span>}
        </div>
      </div>
      <ChevronRight size={14} style={{ color: c.txt3, flexShrink: 0, marginTop: '2px' }} />
    </div>
  );
}

export default function StudentDashboard() {
  const { profile } = useAuth();
  const { c } = useTheme();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [recommended, setRecommended] = useState({ jobs: [], hasProfile: false });
  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying] = useState(null);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [hiredCelebration, setHiredCelebration] = useState(null);
  const { viewerUrl, viewerTitle, openPdf, closePdf } = usePdfViewer();

  useEffect(() => {
    api.get('/student/dashboard').then(r => setData(r.data)).catch(() => {});
    api.get('/student/recommended').then(r => setRecommended(r.data)).catch(() => {});
    api.get('/student/applications')
      .then(r => setAppliedIds(new Set(r.data.map(a => a.jobId))))
      .catch(() => {});
    api.get('/student/notifications/hired-celebration')
      .then(r => setHiredCelebration(r.data.application))
      .catch(() => {});
  }, []);

  const dismissCelebration = () => {
    const appId = hiredCelebration?.id;
    setHiredCelebration(null);
    if (appId) api.post('/student/notifications/mark-seen', { applicationId: appId }).catch(() => {});
  };

  const handleApply = async (jobId) => {
    setApplying(jobId);
    try {
      await api.post(`/student/apply/${jobId}`);
      toast.success('Application submitted!');
      setAppliedIds(prev => new Set([...prev, jobId]));
      setSelectedJob(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply.');
    } finally { setApplying(null); }
  };

  const hasResume = !!data?.student?.resumeUrl;
  const offeredApps = data?.offeredApplications || [];

  const STATS = [
    { label: 'Total Applied',   value: data?.stats?.total   ?? '—', icon: Briefcase,   color: c.txt1 },
    { label: 'Pending Review',  value: data?.stats?.pending ?? '—', icon: Clock,        color: c.amber },
    { label: 'Interviewing',    value: data?.stats?.accepted ?? '—',icon: CheckCircle,  color: '#1D4ED8' },
    { label: 'Hired',           value: data?.stats?.hired   ?? '—', icon: Trophy,       color: c.green },
  ];

  return (
    <StudentLayout>
      {hiredCelebration && (
        <HiredCelebration application={hiredCelebration} onClose={dismissCelebration} />
      )}
      {viewerUrl && <PdfViewerModal url={viewerUrl} title={viewerTitle} onClose={closePdf} />}
      {/* Welcome header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: c.txt1, letterSpacing: '-0.03em', margin: 0 }}>
            Welcome back, {profile?.firstName || 'Student'} 👋
          </h1>
          <p style={{ fontSize: '13px', color: c.txt3, margin: '4px 0 0' }}>Here's your internship activity overview.</p>
        </div>
        <Link to="/student/jobs" className="btn btn-primary btn-sm">
          Browse Jobs <ArrowRight size={13} />
        </Link>
      </div>

      {/* Complete Profile banner — shown when resume is missing */}
      {data && !hasResume && (
        <div style={{
          padding: '14px 18px', marginBottom: '20px',
          background: 'linear-gradient(135deg, rgba(196,30,58,0.07) 0%, rgba(196,30,58,0.03) 100%)',
          border: '1px solid rgba(196,30,58,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} style={{ color: c.red, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '13px', fontWeight: '700', color: c.txt1, margin: 0 }}>Complete your profile to start applying</p>
              <p style={{ fontSize: '12px', color: c.txt2, margin: '2px 0 0' }}>
                Upload your resume on your Profile page — it's required before you can apply to any job.
              </p>
            </div>
          </div>
          <Link to="/student/profile" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
            <FileText size={12} /> Upload Resume
          </Link>
        </div>
      )}

      {/* Offered applications — high-priority green banner */}
      {offeredApps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {offeredApps.map(app => (
            <div key={app.id} style={{
              padding: '14px 18px',
              background: 'linear-gradient(135deg, rgba(26,127,90,0.1) 0%, rgba(26,127,90,0.04) 100%)',
              border: '1px solid rgba(26,127,90,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Gift size={18} style={{ color: c.green, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: c.txt1, margin: 0 }}>
                    🎉 Offer from {app.JobPosting?.Company?.companyName}!
                  </p>
                  <p style={{ fontSize: '12px', color: c.txt2, margin: '2px 0 0' }}>
                    Position: <strong>{app.JobPosting?.title}</strong>
                    {app.offerExpiresAt && (
                      <span style={{ marginLeft: '8px', color: '#B45309', fontWeight: '600' }}>
                        · Expires {new Date(app.offerExpiresAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                {app.offerLetterUrl && (
                  <a
                    href={`${API_BASE_URL}/${app.offerLetterUrl}`}
                    target="_blank" rel="noreferrer"
                    onClick={e => { if (window.innerWidth <= 768) { e.preventDefault(); openPdf(`${API_BASE_URL}/${app.offerLetterUrl}`, `Offer Letter — ${app.JobPosting?.title || ''}`); } }}
                    className="btn btn-sm"
                    style={{ background: c.green, color: '#fff', border: 'none', textDecoration: 'none' }}>
                    <FileText size={12} /> View Offer Letter
                  </a>
                )}
                <Link to="/student/applications" className="btn btn-outline btn-sm" style={{ color: c.green, borderColor: c.green }}>
                  Respond <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: '12px', marginBottom: '28px' }}>
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div className="stat-card" key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-num" style={{ color }}>{value}</div>
                <div className="stat-label">{label}</div>
              </div>
              <Icon size={18} style={{ color, opacity: 0.5, marginTop: '4px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Featured jobs slider */}
      <FeaturedJobsSlider />

      {/* Recommended for You — Smart Matching Engine */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <p className="section-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Star size={11} style={{ color: c.red }} /> Recommended For You
            </p>
            <p style={{ fontSize: '15px', fontWeight: '700', color: c.txt1, margin: '4px 0 0', letterSpacing: '-0.02em' }}>
              Matched to your skills &amp; degree
            </p>
          </div>
          <button onClick={() => navigate('/student/jobs')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: c.red, fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>
            Browse all <ArrowRight size={12} />
          </button>
        </div>

        {recommended.jobs.length === 0 ? (
          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <Star size={24} style={{ color: c.border, margin: '0 auto 10px' }} />
            {!recommended.hasProfile ? (
              <>
                <p style={{ fontSize: '13px', fontWeight: '600', color: c.txt1, margin: '0 0 6px' }}>Build your profile to get personalised matches</p>
                <p style={{ fontSize: '12px', color: c.txt3, margin: '0 0 14px' }}>Add your skills and bio so we can recommend the best internships for you.</p>
                <Link to="/student/profile" className="btn btn-outline btn-sm">Go to My Profile</Link>
              </>
            ) : (
              <p style={{ fontSize: '13px', color: c.txt3, margin: 0 }}>No new recommendations right now — check back after more listings are posted.</p>
            )}
          </div>
        ) : (
          <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '10px' }}>
            {recommended.jobs.map(job => (
              <RecommendedCard key={job.id} job={job} onView={setSelectedJob} c={c} />
            ))}
          </div>
        )}
      </div>

      {/* Job detail modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApply={() => handleApply(selectedJob.id)}
          isApplying={applying === selectedJob.id}
          alreadyApplied={appliedIds.has(selectedJob.id)}
        />
      )}
    </StudentLayout>
  );
}
