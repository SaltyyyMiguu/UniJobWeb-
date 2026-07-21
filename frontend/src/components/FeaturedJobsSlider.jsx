import { useEffect, useState } from 'react';
import { MapPin, ArrowRight, Tag, DollarSign, Briefcase } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api, { resolveFileUrl } from '../api/axios';
import JobDetailModal from './JobDetailModal';
import toast from 'react-hot-toast';

// ─── Individual slider card ───────────────────────────────────────────────────
function SliderCard({ job, applied, saved, onClick, c }) {
  const logoSrc = job.Company?.profileImageUrl
    ? resolveFileUrl(job.Company.profileImageUrl)
    : null;
  const coverSrc = job.listingImageUrl
    ? resolveFileUrl(job.listingImageUrl)
    : logoSrc;

  return (
    <div
      onClick={() => onClick(job)}
      style={{
        flexShrink: 0,
        width: '220px',
        margin: '0 6px',
        background: c.surface,
        border: `1px solid ${c.border}`,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Visual banner */}
      <div style={{
        height: '90px',
        position: 'relative',
        background: coverSrc ? 'transparent' : 'linear-gradient(135deg, #1A2235 0%, #2A3A55 100%)',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {coverSrc && (
          <img src={coverSrc} alt={job.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
        {/* Gradient overlay for readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)',
        }} />

        {/* Applied badge */}
        {applied && (
          <span style={{
            position: 'absolute', top: '7px', right: '7px',
            fontSize: '9px', fontWeight: '700', padding: '2px 6px',
            background: 'rgba(26,127,90,0.85)', color: '#fff',
            backdropFilter: 'blur(4px)',
          }}>✓ Applied</span>
        )}

        {/* Logo/initial bottom-left */}
        <div style={{
          position: 'absolute', bottom: '8px', left: '10px',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          {!coverSrc && (
            <div style={{
              width: '28px', height: '28px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: '800', fontSize: '13px' }}>
                {job.Company?.companyName?.[0] || 'C'}
              </span>
            </div>
          )}
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            {(job.Company?.companyName || '').split(' ').slice(0, 2).join(' ')}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <p style={{
          fontSize: '12px', fontWeight: '700', color: c.txt1, margin: 0, lineHeight: '1.35',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{job.title}</p>

        {job.category && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: c.red, fontWeight: '600', margin: '4px 0' }}>
            <Tag size={9} />{job.category}
          </span>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: 'auto' }}>
          {job.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={9} style={{ color: c.txt3, flexShrink: 0 }} />
              <span style={{ fontSize: '10px', color: c.txt3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {job.location}
              </span>
            </div>
          )}
          {job.allowance && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <DollarSign size={9} style={{ color: c.green, flexShrink: 0 }} />
              <span style={{ fontSize: '10px', color: c.green, fontWeight: '600' }}>{job.allowance}</span>
            </div>
          )}
        </div>

        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', color: c.txt3 }}>
            {new Date(job.createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
          </span>
          <span style={{ fontSize: '10px', fontWeight: '700', color: c.red, display: 'flex', alignItems: 'center', gap: '3px' }}>
            View <ArrowRight size={9} />
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton card while loading ──────────────────────────────────────────────
function SkeletonCard({ c }) {
  return (
    <div style={{ flexShrink: 0, width: '220px', margin: '0 6px', background: c.surface, border: `1px solid ${c.border}`, overflow: 'hidden' }}>
      <div style={{ height: '90px', background: c.surface2, animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ padding: '12px 14px' }}>
        <div style={{ height: '12px', background: c.surface2, marginBottom: '8px', borderRadius: '2px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: '10px', background: c.surface2, width: '60%', borderRadius: '2px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    </div>
  );
}

// ─── Main slider component ────────────────────────────────────────────────────
export default function FeaturedJobsSlider() {
  const { c } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [applying, setApplying] = useState(null);

  useEffect(() => {
    // Fetch recent active jobs
    api.get('/student/jobs')
      .then(res => setJobs(res.data.slice(0, 12))) // max 12 in slider
      .catch(() => {})
      .finally(() => setLoading(false));
    // Fetch applied IDs so we can mark them
    api.get('/student/applications')
      .then(res => setAppliedIds(new Set(res.data.map(a => a.jobId))))
      .catch(() => {});
  }, []);

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

  // Duplicate jobs for infinite scroll effect
  const displayJobs = jobs.length > 0 ? [...jobs, ...jobs] : [];

  return (
    <div style={{ marginBottom: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <p className="section-label">Featured Opportunities</p>
          <p style={{ fontSize: '16px', fontWeight: '700', color: c.txt1, margin: '4px 0 0', letterSpacing: '-0.02em' }}>
            Latest Internships · Click to View & Apply
          </p>
        </div>
        <button
          onClick={() => navigate('/student/jobs')}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: c.red, fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>
          View all <ArrowRight size={12} />
        </button>
      </div>

      {/* Slider wrapper */}
      <div style={{ overflow: 'hidden', borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`, padding: '14px 0', position: 'relative' }}>
        {/* Fade edges */}
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '48px', background: `linear-gradient(to right, ${c.bg}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '48px', background: `linear-gradient(to left, ${c.bg}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />

        {loading ? (
          <div style={{ display: 'flex', gap: '0' }}>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} c={c} />)}
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: c.txt3 }}>
            <Briefcase size={28} style={{ margin: '0 auto 8px', color: c.border }} />
            <p style={{ fontSize: '13px', margin: 0 }}>No listings available yet.</p>
          </div>
        ) : (
          <div className="slider-track">
            {displayJobs.map((job, i) => (
              <SliderCard
                key={`${job.id}-${i}`}
                job={job}
                applied={appliedIds.has(job.id)}
                onClick={setSelectedJob}
                c={c}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '10px' }}>
        {[
          { label: 'Active Listings', value: `${jobs.length}+` },
          { label: 'Partner Companies', value: `${new Set(jobs.map(j => j.companyId)).size || '—'}+` },
          { label: 'Click to Apply', value: '→' },
        ].map(({ label, value }) => (
          <div key={label} style={{ textAlign: 'center', padding: '12px', background: c.surface, border: `1px solid ${c.border}` }}>
            <p style={{ fontSize: '22px', fontWeight: '800', color: c.red, letterSpacing: '-0.03em', margin: 0 }}>{value}</p>
            <p style={{ fontSize: '10px', color: c.txt3, margin: '3px 0 0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
          </div>
        ))}
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
