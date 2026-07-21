import { X, MapPin, Tag, Clock, DollarSign, Users, Calendar, Briefcase, Send, Building2, Globe, CheckCircle, Bookmark, BookmarkCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { resolveFileUrl } from '../api/axios';

function Section({ title, content, c }) {
  if (!content) return null;
  const lines = content.split('\n').filter(l => l.trim());
  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: c.red, margin: '0 0 10px' }}>{title}</p>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {lines.map((line, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: c.txt2, lineHeight: '1.5' }}>
            <span style={{ marginTop: '6px', flexShrink: 0, width: '5px', height: '5px', background: c.red }} />
            {line.replace(/^[-•*]\s*/, '')}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function JobDetailModal({ job, onClose, onApply, isApplying, alreadyApplied, isSaved, onToggleSave }) {
  const { c } = useTheme();
  const { user } = useAuth();
  if (!job) return null;

  // The apply flow (footer + "Apply Now") is a student-only concept — Company
  // and Supervisor accounts viewing this same modal (e.g. from Manage Jobs'
  // Archived tab) must never see it. This used to check `user?.role ===
  // 'company'`, but the backend's role enum is uppercase (STUDENT/COMPANY/
  // ADMIN/SUPERVISOR), so that comparison never matched anything and the
  // footer rendered unconditionally for every role, including companies
  // viewing their own listings.
  const isStudent = user?.role === 'STUDENT';
  const canApply = isStudent && job.isActive !== false;

  const logoSrc = job.Company?.profileImageUrl
    ? resolveFileUrl(job.Company.profileImageUrl)
    : null;

  const infoItems = [
    { icon: MapPin,      label: 'Location',  value: job.location || 'Not specified' },
    { icon: Clock,       label: 'Duration',   value: job.duration || 'Not specified' },
    { icon: DollarSign,  label: 'Allowance',  value: job.allowance || 'Not specified' },
    { icon: Users,       label: 'Positions Left',  value: job.positionsLeft != null ? `${job.positionsLeft} position${job.positionsLeft > 1 ? 's' : ''}` : 'Not specified' },
    { icon: Tag,         label: 'Category',   value: job.category },
    { icon: Calendar,    label: 'Posted',     value: new Date(job.createdAt).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' }) },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: 0 }}>
            <div style={{ width: '48px', height: '48px', flexShrink: 0, background: logoSrc ? 'transparent' : c.red, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {logoSrc
                ? <img src={logoSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: '#fff', fontWeight: '800', fontSize: '20px' }}>{job.Company?.companyName?.[0] || 'C'}</span>}
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: c.txt1, letterSpacing: '-0.02em', margin: 0 }}>{job.title}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <Building2 size={12} style={{ color: c.red }} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: c.red }}>{job.Company?.companyName}</span>
                {job.Company?.isVerified && <CheckCircle size={12} style={{ color: c.green }} />}
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                {job.Company?.industry && <span className="badge badge-muted">{job.Company.industry}</span>}
                {job.allowance && <span className="badge badge-green">{job.allowance}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            {onToggleSave && (
              <button onClick={onToggleSave} title={isSaved ? 'Remove from saved' : 'Save this job'}
                className={`save-btn${isSaved ? ' is-saved' : ''}`} style={{ padding: '7px 12px', fontSize: '12px' }}>
                {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                {isSaved ? 'Saved' : 'Save'}
              </button>
            )}
            <button onClick={onClose} title="Close" className="modal-close-btn">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Info grid */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${c.border}`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: '10px' }}>
          {infoItems.map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ padding: '10px 12px', background: c.surface2, border: `1px solid ${c.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Icon size={11} style={{ color: c.red }} />
                <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: c.txt3 }}>{label}</span>
              </div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: c.txt1, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Body (scrollable) */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: c.red, margin: '0 0 10px' }}>Overview</p>
            <p style={{ fontSize: '13px', color: c.txt2, lineHeight: '1.7', margin: 0 }}>{job.description}</p>
          </div>
          <Section title="Requirements" content={job.requirements} c={c} />
          <Section title="What You'll Get" content={job.benefits} c={c} />
          {job.Company?.website && (
            <a href={job.Company.website} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: c.red, fontWeight: '500' }}>
              <Globe size={12} />{job.Company.website}
            </a>
          )}
        </div>

        {/* Footer / Apply — student-only; Company/Supervisor never see this */}
        {isStudent && (
          <div className="job-modal-footer" style={{ padding: '16px 24px', borderTop: `1px solid ${c.border}`, background: c.surface2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '700', color: c.txt1, margin: 0 }}>{job.title}</p>
              <p style={{ fontSize: '12px', color: c.txt3, margin: '2px 0 0' }}>{job.Company?.companyName}</p>
            </div>
            {alreadyApplied ? (
              <span className="badge badge-green" style={{ padding: '6px 14px', fontSize: '12px' }}>
                <CheckCircle size={12} /> Already Applied
              </span>
            ) : !canApply || job.positionsLeft <= 0 ? (
              <button disabled className="btn mobile-chunky-btn" style={{ background: c.border, color: c.txt3, cursor: 'not-allowed', border: 'none' }}>
                <CheckCircle size={13} />
                {!canApply ? 'Listing Closed' : 'Positions Filled'}
              </button>
            ) : (
              <button onClick={onApply} disabled={isApplying} className="btn btn-primary mobile-chunky-btn">
                <Send size={13} />
                {isApplying ? 'Applying…' : 'Apply Now'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
