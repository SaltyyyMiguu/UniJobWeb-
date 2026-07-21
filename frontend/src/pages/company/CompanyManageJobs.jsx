import { useEffect, useState, useRef } from 'react';
import api, { resolveFileUrl } from '../../api/axios';
import CompanyLayout from '../../components/layouts/CompanyLayout';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Archive, Briefcase, X, Edit2, Save, LayoutGrid, List, MapPin, DollarSign, Users, Clock, Camera, ClipboardList, Eye, History } from 'lucide-react';
import toast from 'react-hot-toast';
import JobDetailModal from '../../components/JobDetailModal';
import ApplicantPipelinePanel from '../../components/ApplicantPipelinePanel';
import { ConfirmModal } from '../../components/ApplicantPipelineParts';

const CATEGORIES = ['Information Technology', 'Healthcare', 'Finance', 'Engineering', 'Education', 'Marketing', 'Agriculture', 'Other'];
const DURATIONS = ['1 Month', '2 Months', '3 Months', '4 Months', '6 Months', '8 Months', '12 Months'];
const EMPTY_FORM = { title: '', description: '', category: '', location: '', allowance: '', requirements: '', benefits: '', duration: '', positionsLeft: 1 };

/* ─── Job Form (used in both create & edit panels) ─── */
function JobForm({ initial = EMPTY_FORM, onSave, onCancel, saving, label, c }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '12px' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <label className="input-label">Job Title *</label>
          <input className="input mobile-chunky-input" value={form.title} required placeholder="e.g. Software Engineering Intern" onChange={e => set('title', e.target.value)} />
        </div>
        <div>
          <label className="input-label">Category *</label>
          <select className="input mobile-chunky-input" value={form.category} required onChange={e => set('category', e.target.value)}>
            <option value="">Select…</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="input-label">Location *</label>
          <input className="input mobile-chunky-input" value={form.location} required placeholder="e.g. Kuala Lumpur" onChange={e => set('location', e.target.value)} />
        </div>
        <div>
          <label className="input-label">Monthly Allowance *</label>
          <input className="input mobile-chunky-input" value={form.allowance} required placeholder="e.g. RM 1,500 / month" onChange={e => set('allowance', e.target.value)} />
        </div>
        <div>
          <label className="input-label">Duration *</label>
          <select className="input mobile-chunky-input" value={form.duration} required onChange={e => set('duration', e.target.value)}>
            <option value="">Select duration…</option>
            {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="input-label">Positions Left</label>
          <input className="input mobile-chunky-input" type="number" min="1" value={form.positionsLeft} onChange={e => set('positionsLeft', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="input-label">Job Description *</label>
        <textarea className="input mobile-chunky-input" value={form.description} required rows={4} placeholder="Describe the role and responsibilities…" onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
      </div>
      <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '12px' }}>
        <div>
          <label className="input-label">Requirements <span style={{ fontWeight: '400', textTransform: 'none', letterSpacing: 0, color: c.txt3 }}>(one per line)</span></label>
          <textarea className="input mobile-chunky-input" value={form.requirements} rows={3} placeholder="- Degree in CS&#10;- Basic Python" onChange={e => set('requirements', e.target.value)} style={{ resize: 'vertical' }} />
        </div>
        <div>
          <label className="input-label">Benefits / Perks <span style={{ fontWeight: '400', textTransform: 'none', letterSpacing: 0, color: c.txt3 }}>(one per line)</span></label>
          <textarea className="input mobile-chunky-input" value={form.benefits} rows={3} placeholder="- Monthly stipend&#10;- Mentorship" onChange={e => set('benefits', e.target.value)} style={{ resize: 'vertical' }} />
        </div>
      </div>
      <div className="mobile-form-actions" style={{ display: 'flex', gap: '10px' }}>
        <button type="submit" disabled={saving} className="btn btn-primary mobile-chunky-btn"><Save size={13} />{saving ? 'Saving…' : label}</button>
        <button type="button" className="btn btn-outline" onClick={onCancel}><X size={13} />Cancel</button>
      </div>
    </form>
  );
}

/* ─── Grid card ─── */
function JobCard({ job, c, avatarSrc, avatarLetter, onEdit, onUploadImage, onViewApplicants, applicantCount }) {
  const isActive = job.isActive !== false;
  const listingImgSrc = job.listingImageUrl ? resolveFileUrl(job.listingImageUrl) : null;
  const imgInputRef = useRef(null);

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (file) onUploadImage(job.id, file);
    e.target.value = '';
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header — shows listing image or gradient */}
      <div style={{ height: '90px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {listingImgSrc
          ? <img src={listingImgSrc} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ height: '100%', background: 'linear-gradient(135deg, #1A2235 0%, #2A3A55 100%)' }} />}
        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />
        {/* Status badge */}
        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
          {isActive
            ? <span style={{ fontSize: '10px', padding: '2px 7px', background: 'rgba(26,127,90,0.5)', color: '#34D399', fontWeight: '700', border: '1px solid rgba(52,211,153,0.4)', backdropFilter: 'blur(4px)' }}>Active</span>
            : <span style={{ fontSize: '10px', padding: '2px 7px', background: 'rgba(239,68,68,0.4)', color: '#FCA5A5', fontWeight: '700', border: '1px solid rgba(239,68,68,0.4)', backdropFilter: 'blur(4px)' }}>Closed</span>}
        </div>
        {/* Upload image button */}
        <button
          onClick={() => imgInputRef.current?.click()}
          title={listingImgSrc ? 'Change cover image' : 'Add cover image'}
          style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', color: '#fff', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '600', backdropFilter: 'blur(4px)' }}>
          <Camera size={11} />{listingImgSrc ? 'Change' : 'Add Photo'}
        </button>
        <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePick} />
        {/* Logo avatar overlapping bottom */}
        <div style={{ position: 'absolute', bottom: '-22px', left: '16px', width: '44px', height: '44px', border: '2px solid var(--surface)', background: 'var(--surface)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {avatarSrc
            ? <img src={avatarSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontWeight: '800', fontSize: '18px', color: '#C41E3A' }}>{avatarLetter}</span>}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '30px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontSize: '15px', fontWeight: '700', color: c.txt1, margin: 0, lineHeight: '1.3', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{job.title}</p>
        <span className="badge badge-muted" style={{ width: 'fit-content', marginTop: '6px' }}>{job.category}</span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '10px 0' }}>
          {job.location && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.txt2 }}><MapPin size={10} style={{ color: c.red }} />{job.location}</div>}
          {job.allowance && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.txt2 }}><DollarSign size={10} style={{ color: c.red }} />{job.allowance}</div>}
          {job.duration && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.txt2 }}><Clock size={10} style={{ color: c.red }} />{job.duration}</div>}
          {job.positionsLeft != null && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.txt2 }}><Users size={10} style={{ color: c.red }} />{job.positionsLeft} position{job.positionsLeft > 1 ? 's' : ''} left</div>}
        </div>

        {applicantCount != null && (
          <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Users size={12} style={{ color: c.txt3 }} />
            <span style={{ fontSize: '12px', color: c.txt2, fontWeight: '500' }}>{applicantCount} applicant{applicantCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Action footer */}
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${c.border}`, background: c.surface2, display: 'flex', gap: '8px' }}>
        <button onClick={() => onViewApplicants(job)} className="btn btn-sm" style={{ flex: 1, background: c.red, color: '#fff', border: 'none', justifyContent: 'center' }}>
          <ClipboardList size={12} />View Applicants{applicantCount != null ? ` (${applicantCount})` : ''}
        </button>
        <button onClick={() => onEdit(job)} title="Edit job" className="btn btn-outline btn-sm"><Edit2 size={12} /></button>
      </div>
    </div>
  );
}

export default function CompanyManageJobs() {
  const { c } = useTheme();
  const { profile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [archivedJobs, setArchivedJobs] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [tab, setTab] = useState('active'); // 'active' | 'archived'
  const [viewingArchivedJob, setViewingArchivedJob] = useState(null);
  const [viewingApplicantsJob, setViewingApplicantsJob] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'archive'|'delete', jobId }

  const avatarSrc = profile?.profileImageUrl ? resolveFileUrl(profile.profileImageUrl) : null;
  const avatarLetter = profile?.companyName?.[0]?.toUpperCase() || 'C';

  const fetchJobs = () => {
    api.get('/company/jobs').then(res => setJobs(res.data)).catch(console.error);
    api.get('/company/jobs/archived').then(res => setArchivedJobs(res.data)).catch(console.error);
  };
  useEffect(() => { fetchJobs(); }, []);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await api.post('/company/jobs', form);
      toast.success('Job posted!');
      setShowCreate(false);
      fetchJobs();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to post job.'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (form) => {
    if (!editingJob) return;
    setSaving(true);
    try {
      await api.put(`/company/jobs/${editingJob.id}`, form);
      toast.success('Job updated!');
      setEditingJob(null);
      fetchJobs();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update.'); }
    finally { setSaving(false); }
  };

  // Native window.confirm() is unreliable inside some mobile browser/WebView
  // contexts (silently suppressed or a no-op), which was making these two
  // actions look completely broken on mobile. Routed through the app's own
  // ConfirmModal component instead — a real React modal has no dependency on
  // native dialog support and works identically everywhere.
  const handleDelete = (id) => setConfirmAction({ type: 'archive', jobId: id });
  const handleHardDelete = (id) => setConfirmAction({ type: 'delete', jobId: id });

  const executeConfirmedAction = async () => {
    const { type, jobId } = confirmAction;
    setConfirmAction(null);
    if (type === 'archive') {
      try {
        await api.delete(`/company/jobs/${jobId}`);
        toast.success('Job archived.');
        setEditingJob(null);
        fetchJobs();
      } catch { toast.error('Failed to archive.'); }
    } else {
      try {
        await api.delete(`/company/jobs/${jobId}/permanent`);
        toast.success('Job permanently deleted.');
        setEditingJob(null);
        fetchJobs();
      } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete.'); }
    }
  };

  const handleUploadImage = async (jobId, file) => {
    const fd = new FormData();
    fd.append('listingImage', file);
    try {
      await api.post(`/company/jobs/${jobId}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Cover photo updated!');
      fetchJobs();
    } catch { toast.error('Failed to upload image.'); }
  };

  const handleViewApplicants = (job) => {
    setViewingApplicantsJob(job);
    // Close any open edit/create form first — otherwise its sticky
    // "Save Changes / Cancel" action bar (z-index:99999, same as the
    // pipeline panel's own overlay) can stay mounted underneath and win the
    // stacking tie, floating on top of the pipeline panel's content.
    setEditingJob(null);
    setShowCreate(false);
  };

  const handleViewArchivedJobDetails = (job) => {
    setViewingArchivedJob(job);
  };

  const handleViewArchivedJobApplicants = (job) => {
    setViewingApplicantsJob(job);
    // Same defensive close as handleViewApplicants — editingJob/showCreate
    // are page-level state, not tab-scoped, so this path is exposed to the
    // identical z-index leak if the user left an edit open before switching
    // to the Archived tab.
    setEditingJob(null);
    setShowCreate(false);
  };

  return (
    <CompanyLayout>
      {confirmAction && (
        <ConfirmModal
          message={
            confirmAction.type === 'archive'
              ? 'Archive this job posting? It will be hidden from students but your application history will be preserved.'
              : 'Permanently delete this job posting? This cannot be undone. Jobs with any applicant history cannot be permanently deleted — archive them instead.'
          }
          confirmLabel={confirmAction.type === 'archive' ? 'Archive' : 'Delete'}
          danger={confirmAction.type === 'delete'}
          onConfirm={executeConfirmedAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {viewingArchivedJob && (
        <JobDetailModal
          job={viewingArchivedJob}
          onClose={() => setViewingArchivedJob(null)}
        />
      )}
      {viewingApplicantsJob && (
        <ApplicantPipelinePanel
          job={viewingApplicantsJob}
          onClose={() => setViewingApplicantsJob(null)}
        />
      )}
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Job Listings</h1>
          <p style={{ fontSize: '13px', color: c.txt3, margin: '4px 0 0' }}>{jobs.length} active · {archivedJobs.length} archived</p>
        </div>
        {tab === 'active' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', border: `1px solid ${c.border}`, overflow: 'hidden' }}>
              <button onClick={() => setViewMode('grid')} style={{ padding: '6px 10px', background: viewMode === 'grid' ? c.red : 'transparent', color: viewMode === 'grid' ? '#fff' : c.txt2, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <LayoutGrid size={14} />
              </button>
              <button onClick={() => setViewMode('list')} style={{ padding: '6px 10px', background: viewMode === 'list' ? c.red : 'transparent', color: viewMode === 'list' ? '#fff' : c.txt2, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <List size={14} />
              </button>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowCreate(s => !s); setEditingJob(null); }}>
              {showCreate ? <><X size={13} />Cancel</> : <><Plus size={13} />Post New Job</>}
            </button>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', borderBottom: `1px solid ${c.border}` }}>
        {[['active', `Active (${jobs.length})`], ['archived', `Archived (${archivedJobs.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setShowCreate(false); setEditingJob(null); }} style={{
            padding: '8px 16px', fontSize: '13px', fontWeight: tab === key ? '700' : '500',
            color: tab === key ? c.red : c.txt3,
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: tab === key ? `2px solid ${c.red}` : '2px solid transparent',
            marginBottom: '-1px',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Archived jobs view */}
      {tab === 'archived' && (
        <div>
          {archivedJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: c.txt3, fontSize: '13px' }}>No archived job listings.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {archivedJobs.map(job => (
                <div key={job.id} className="card job-list-row">
                  <div className="job-list-logo" style={{ background: avatarSrc ? 'transparent' : c.red }}>
                    {avatarSrc ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>{avatarLetter}</span>}
                  </div>
                  <div className="job-list-info">
                    <p className="job-list-title" style={{ color: c.txt1 }}>{job.title}</p>
                    <div className="job-list-meta">
                      <span className="badge badge-muted">{job.category}</span>
                      {job.location && <span style={{ fontSize: '11px', color: c.txt3 }}>📍 {job.location}</span>}
                      {job.duration && <span style={{ fontSize: '11px', color: c.txt3 }}>⏱ {job.duration}</span>}
                    </div>
                  </div>
                  <div className="job-list-actions">
                    <button
                      onClick={() => handleViewArchivedJobDetails(job)}
                      className="btn btn-outline btn-sm"
                      title="View job details"
                      style={{ borderColor: c.border, color: c.txt2 }}>
                      <Eye size={12} />View Details
                    </button>
                    <button
                      onClick={() => handleViewArchivedJobApplicants(job)}
                      className="btn btn-outline btn-sm"
                      title="View past applicants"
                      style={{ borderColor: c.border, color: c.txt2 }}>
                      <History size={12} />View Past Applicants
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active jobs content */}
      {tab === 'active' && <>

      {/* Create / Edit form panel */}
      {(showCreate || editingJob) && (
        <div className="card card-accent-l" style={{ padding: '20px 24px', marginBottom: '24px' }}>
          <p style={{ fontSize: '15px', fontWeight: '700', color: c.txt1, margin: '0 0 16px', letterSpacing: '-0.01em' }}>
            {editingJob ? `✏️ Editing: ${editingJob.title}` : '📄 New Internship Posting'}
          </p>
          <JobForm
            initial={editingJob ? {
              title: editingJob.title, description: editingJob.description || '',
              category: editingJob.category || '', location: editingJob.location || '',
              allowance: editingJob.allowance || '', requirements: editingJob.requirements || '',
              benefits: editingJob.benefits || '', duration: editingJob.duration || '',
              positionsLeft: editingJob.positionsLeft || 1,
            } : EMPTY_FORM}
            onSave={editingJob ? handleUpdate : handleCreate}
            onCancel={() => { setShowCreate(false); setEditingJob(null); }}
            saving={saving}
            label={editingJob ? 'Save Changes' : 'Publish Job'}
            c={c}
          />

          {/* Danger Zone — Archive/Delete only make sense for an existing job,
             never while creating a new one. */}
          {editingJob && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${c.border}` }}>
              <p className="section-label" style={{ color: '#EF4444', marginBottom: '10px' }}>Danger Zone</p>
              <div className="mobile-form-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => handleDelete(editingJob.id)} className="btn btn-outline btn-sm" style={{ color: '#B45309', borderColor: '#B45309' }}>
                  <Archive size={13} /> Archive Job
                </button>
                <button onClick={() => handleHardDelete(editingJob.id)} className="btn btn-outline btn-sm" style={{ color: '#EF4444', borderColor: '#EF4444' }}>
                  <Trash2 size={13} /> Delete Job
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Briefcase size={48} style={{ color: c.border, margin: '0 auto 16px' }} />
          <p style={{ color: c.txt1, fontSize: '15px', fontWeight: '600', margin: '0 0 6px' }}>No listings yet</p>
          <p style={{ color: c.txt3, fontSize: '13px', margin: 0 }}>Click "Post New Job" to create your first internship listing.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Instagram-style card grid */
        <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: '16px' }}>
          {jobs.map(job => (
            <JobCard
              key={job.id} job={job} c={c}
              avatarSrc={avatarSrc} avatarLetter={avatarLetter}
              onEdit={(j) => { setEditingJob(j); setShowCreate(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onUploadImage={handleUploadImage}
              onViewApplicants={handleViewApplicants}
              applicantCount={job.applicationCount ?? null}
            />
          ))}
        </div>
      ) : (
        /* List view fallback */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {jobs.map(job => (
            <div key={job.id} className="card job-list-row">
              <div className="job-list-logo" style={{ background: avatarSrc ? 'transparent' : c.red }}>
                {avatarSrc ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>{avatarLetter}</span>}
              </div>
              <div className="job-list-info">
                <p className="job-list-title" style={{ color: c.txt1 }}>{job.title}</p>
                <div className="job-list-meta">
                  <span className="badge badge-muted">{job.category}</span>
                  {job.location && <span style={{ fontSize: '11px', color: c.txt3 }}>📍 {job.location}</span>}
                  {job.allowance && <span style={{ fontSize: '11px', color: c.green, fontWeight: '600' }}>{job.allowance}</span>}
                </div>
              </div>
              <div className="job-list-actions">
                <button onClick={() => handleViewApplicants(job)} className="btn btn-sm" style={{ background: c.red, color: '#fff', border: 'none' }}>
                  <ClipboardList size={12} />View Applicants{job.applicationCount != null ? ` (${job.applicationCount})` : ''}
                </button>
                <button onClick={() => { setEditingJob(job); setShowCreate(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="btn btn-outline btn-sm" title="Edit job"><Edit2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      </> /* end tab === 'active' */}
    </CompanyLayout>
  );
}
