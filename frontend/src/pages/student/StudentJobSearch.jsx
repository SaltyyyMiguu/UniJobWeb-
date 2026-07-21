import { useEffect, useState, useCallback, useRef } from 'react';
import api, { resolveFileUrl } from '../../api/axios';
import StudentLayout from '../../components/layouts/StudentLayout';
import JobDetailModal from '../../components/JobDetailModal';
import { useTheme } from '../../context/ThemeContext';
import { Search, MapPin, Tag, Briefcase, Bookmark, BookmarkCheck, ArrowRight, Building2, X, LayoutGrid, List } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['', 'Information Technology', 'Healthcare', 'Finance', 'Engineering', 'Education', 'Marketing', 'Agriculture', 'Other'];
const SAVED_KEY = 'ujl-saved-jobs';

const getSaved = () => {
  try { return new Set(JSON.parse(localStorage.getItem(SAVED_KEY) || '[]')); }
  catch { return new Set(); }
};
const persistSaved = (set) => localStorage.setItem(SAVED_KEY, JSON.stringify([...set]));

// ─── Job card with hover-reveal cover image ───────────────────────────────────
function JobCard({ job, applied, saved, onOpen, onToggleSave, c }) {
  const [hovered, setHovered] = useState(false);

  // Cover image: job's own listing image OR company logo — if NEITHER exists, no animation
  const coverSrc = job.listingImageUrl
    ? resolveFileUrl(job.listingImageUrl)
    : job.Company?.profileImageUrl
      ? resolveFileUrl(job.Company.profileImageUrl)
      : null;

  const logoSrc = job.Company?.profileImageUrl
    ? resolveFileUrl(job.Company.profileImageUrl)
    : null;

  // Only animate if there is actually an image to show AND the device has
  // real hover capability — touch screens interpret a tap as "enter" but
  // rarely fire a reliable "leave", leaving the card stuck open ("sticky
  // hover"). On touch devices the cover stays in its flat, hidden state.
  // matchMedia('(hover: hover)') alone should already be sufficient, but
  // some mobile browsers report it inconsistently, so this also hard-gates
  // on viewport width as a second, independent guard.
  const supportsHover = typeof window !== 'undefined'
    && window.matchMedia?.('(hover: hover)').matches
    && window.innerWidth > 768;
  const canHover = !!coverSrc && supportsHover;

  return (
    <div
      className="card card-hover mobile-job-card"
      onMouseEnter={() => canHover && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ padding: 0, cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* ── Hover cover image (slides down only when canHover) ── */}
      {canHover && (
        <div className="job-card-cover" style={{
          height: hovered ? '160px' : '0px',
          overflow: 'hidden',
          transition: 'height 0.35s cubic-bezier(0.4,0,0.2,1)',
          background: c.surface2,
          position: 'relative',
          flexShrink: 0,
        }}>
          <img
            src={coverSrc}
            alt={job.title}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.25s ease 0.1s',
              display: 'block',
            }}
          />
          {/* Gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)',
          }} />
          {/* Company name overlay on image */}
          <div style={{
            position: 'absolute', bottom: '10px', left: '14px',
            display: 'flex', alignItems: 'center', gap: '6px',
            opacity: hovered ? 1 : 0, transition: 'opacity 0.2s ease 0.2s',
          }}>
            <div style={{ width: '24px', height: '24px', background: logoSrc ? 'transparent' : 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)' }}>
              {logoSrc ? <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#fff', fontWeight: '700', fontSize: '10px' }}>{job.Company?.companyName?.[0]}</span>}
            </div>
            <span style={{ color: '#fff', fontWeight: '600', fontSize: '12px', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
              {job.Company?.companyName}
            </span>
          </div>
        </div>
      )}

      {/* Card body — always visible */}
      <div className="job-card-body" style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }} onClick={() => onOpen(job)}>
        {/* Header row */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
          <div style={{ width: '42px', height: '42px', flexShrink: 0, background: logoSrc ? 'transparent' : c.red, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {logoSrc
              ? <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>{job.Company?.companyName?.[0] || 'C'}</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: '14px', fontWeight: '700', color: c.txt1, margin: 0, lineHeight: '1.3',
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflowWrap: 'break-word',
            }}>{job.title}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
              <Building2 size={10} style={{ color: c.red, flexShrink: 0 }} />
              <p style={{ fontSize: '12px', color: c.red, margin: 0, fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {job.Company?.companyName}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <p style={{
          fontSize: '12px', color: c.txt2, lineHeight: '1.6', margin: '0 0 10px',
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>{job.description}</p>

        {/* Tags */}
        <div className="job-card-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
          <span className="badge badge-muted"><Tag size={9} />{job.category}</span>
          {job.location && <span className="badge badge-muted"><MapPin size={9} />{job.location}</span>}
          {job.allowance && <span className="badge badge-green">{job.allowance}</span>}
          {applied && <span className="badge badge-green">✓ Applied</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color: c.red, marginTop: 'auto' }}>
          View Details <ArrowRight size={11} />
        </div>
      </div>

      {/* Card footer — date + save */}
      <div style={{ borderTop: `1px solid ${c.border}`, padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: c.surface2 }}>
        <span style={{ fontSize: '11px', color: c.txt3 }}>
          {new Date(job.createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave(job.id); }}
          title={saved ? 'Remove from saved' : 'Save this job'}
          className={`save-btn${saved ? ' is-saved' : ''}`}>
          {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ─── List view row — shares .job-list-* classes with the Company Manage
// Jobs page's list view, so both portals get the identical row look at
// every breakpoint (desktop: compact single line; mobile: flat card). ───────
function JobListRow({ job, applied, saved, onOpen, onToggleSave, c }) {
  const logoSrc = job.Company?.profileImageUrl ? resolveFileUrl(job.Company.profileImageUrl) : null;
  return (
    <div className="card job-list-row" style={{ cursor: 'pointer' }} onClick={() => onOpen(job)}>
      <div className="job-list-logo" style={{ background: logoSrc ? 'transparent' : c.red }}>
        {logoSrc ? <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>{job.Company?.companyName?.[0] || 'C'}</span>}
      </div>
      <div className="job-list-info">
        <p className="job-list-title" style={{ color: c.txt1 }}>{job.title}</p>
        <div className="job-list-meta">
          <span className="badge badge-muted">{job.category}</span>
          {job.location && <span style={{ fontSize: '11px', color: c.txt3 }}>📍 {job.location}</span>}
          {job.allowance && <span style={{ fontSize: '11px', color: c.green, fontWeight: '600' }}>{job.allowance}</span>}
          {applied && <span className="badge badge-green">✓ Applied</span>}
        </div>
      </div>
      <div className="job-list-actions">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave(job.id); }}
          title={saved ? 'Remove from saved' : 'Save this job'}
          className={`save-btn${saved ? ' is-saved' : ''}`}>
          {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default function StudentJobSearch() {
  const { c } = useTheme();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ keyword: '', category: '' });
  const [applying, setApplying] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(getSaved);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const res = await api.get('/student/jobs', { params });
      setJobs(res.data);
    } catch { toast.error('Failed to load jobs.'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    fetchJobs();
    api.get('/student/applications').then(res => setAppliedIds(new Set(res.data.map(a => a.jobId)))).catch(() => {});
  }, []);

  // Category is a discrete choice, not free text — search immediately on selection
  // (keyword stays manual via Enter/Search button to avoid searching on every keystroke)
  const isFirstCategoryRender = useRef(true);
  useEffect(() => {
    if (isFirstCategoryRender.current) {
      isFirstCategoryRender.current = false;
      return;
    }
    fetchJobs();
  }, [filters.category]);

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

  const toggleSave = (jobId) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) { next.delete(jobId); toast.success('Removed from saved.'); }
      else { next.add(jobId); toast.success('Job saved! ♥'); }
      persistSaved(next);
      return next;
    });
  };

  const clearFilters = () => setFilters({ keyword: '', category: '' });
  const hasFilters = filters.keyword || filters.category;
  const savedJobs = jobs.filter(j => savedIds.has(j.id));

  return (
    <StudentLayout>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h1 className="page-title">Find Internships</h1>
            {!loading && (
              <p style={{ fontSize: '12px', color: c.txt3, margin: '4px 0 0' }}>
                {jobs.length} listing{jobs.length !== 1 ? 's' : ''} found
                <span className="desktop-only-text" style={{ marginLeft: '8px', color: c.txt3 }}>· Hover a card to preview</span>
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', border: `1px solid ${c.border}`, overflow: 'hidden' }}>
              <button onClick={() => setViewMode('grid')} style={{ padding: '6px 10px', background: viewMode === 'grid' ? c.red : 'transparent', color: viewMode === 'grid' ? '#fff' : c.txt2, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <LayoutGrid size={14} />
              </button>
              <button onClick={() => setViewMode('list')} style={{ padding: '6px 10px', background: viewMode === 'list' ? c.red : 'transparent', color: viewMode === 'list' ? '#fff' : c.txt2, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <List size={14} />
              </button>
            </div>
            <button
              onClick={() => setShowSavedPanel(true)}
              className="btn btn-outline btn-sm"
              style={{ gap: '5px' }}>
              <Bookmark size={13} /> Saved ({savedIds.size})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card mobile-dash-filters mobile-search-card" style={{ padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: c.txt3, pointerEvents: 'none' }} />
            <input className="input mobile-chunky-input has-icon" value={filters.keyword} placeholder="Job title or keyword…"
              onChange={e => setFilters(f => ({ ...f, keyword: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && fetchJobs()}
              style={{ paddingLeft: '32px' }} />
          </div>
          <select className="input mobile-chunky-input" value={filters.category} style={{ flex: '0 0 auto', width: 'auto', minWidth: '160px' }}
            onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat || 'All Categories'}</option>)}
          </select>
          <button className="btn btn-primary" onClick={fetchJobs}><Search size={13} />Search</button>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}><X size={13} />Clear</button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: '16px' }}>
          <div style={{ width: '28px', height: '28px', border: `3px solid ${c.border}`, borderTopColor: c.red, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: c.txt3, fontSize: '13px', margin: 0 }}>Loading internships…</p>
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Briefcase size={40} style={{ color: c.border, margin: '0 auto 12px' }} />
          <p style={{ color: c.txt3, fontSize: '14px' }}>No internships found. Try adjusting your search.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(290px, 100%), 1fr))', gap: '14px' }}>
          {jobs.map(job => (
            <JobCard
              key={job.id} job={job}
              applied={appliedIds.has(job.id)}
              saved={savedIds.has(job.id)}
              onOpen={setSelectedJob}
              onToggleSave={toggleSave}
              c={c}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {jobs.map(job => (
            <JobListRow
              key={job.id} job={job}
              applied={appliedIds.has(job.id)}
              saved={savedIds.has(job.id)}
              onOpen={setSelectedJob}
              onToggleSave={toggleSave}
              c={c}
            />
          ))}
        </div>
      )}

      {/* Saved Jobs — pops out as its own layer above the (blurred) job grid */}
      {showSavedPanel && (
        <div className="layer-overlay" onClick={() => setShowSavedPanel(false)}>
          <div className="layer-panel" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <BookmarkCheck size={17} style={{ color: c.red }} />
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: c.txt1, margin: 0 }}>
                  Saved Jobs <span style={{ color: c.txt3, fontWeight: '500' }}>({savedJobs.length})</span>
                </h2>
              </div>
              <button onClick={() => setShowSavedPanel(false)} title="Close" className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 22px', overflowY: 'auto' }}>
              {savedJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <Bookmark size={36} style={{ color: c.border, margin: '0 auto 12px' }} />
                  <p style={{ color: c.txt3, fontSize: '14px' }}>No saved jobs yet.<br />Click the bookmark icon on any card to save it here.</p>
                </div>
              ) : (
                <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(270px, 100%), 1fr))', gap: '14px' }}>
                  {savedJobs.map(job => (
                    <JobCard
                      key={job.id} job={job}
                      applied={appliedIds.has(job.id)}
                      saved={savedIds.has(job.id)}
                      onOpen={setSelectedJob}
                      onToggleSave={toggleSave}
                      c={c}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedJob && (
        <JobDetailModal
          job={selectedJob} onClose={() => setSelectedJob(null)}
          onApply={() => handleApply(selectedJob.id)}
          isApplying={applying === selectedJob.id}
          alreadyApplied={appliedIds.has(selectedJob.id)}
          isSaved={savedIds.has(selectedJob.id)}
          onToggleSave={() => toggleSave(selectedJob.id)}
        />
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </StudentLayout>
  );
}
