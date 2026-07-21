import { useState, useEffect, useRef } from 'react';
import api, { resolveFileUrl } from '../../api/axios';
import StudentLayout from '../../components/layouts/StudentLayout';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Edit3, Save, X, Plus, Code2, ExternalLink, Globe, Phone, User, Camera, Lock, Trash2, Eye, EyeOff, FileText, Upload, RefreshCw, LogOut, GraduationCap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { usePdfViewer } from '../../hooks/usePdfViewer';
import PdfViewerModal from '../../components/PdfViewerModal';

function SkillTag({ skill, onRemove, editable }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '3px 10px', border: '1px solid var(--border)',
      fontSize: '12px', fontWeight: '500', color: 'var(--txt-2)',
      background: 'var(--surface-2)',
    }}>
      {skill}
      {editable && (
        <button onClick={() => onRemove(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)', padding: 0, display: 'flex', lineHeight: 1 }}>
          <X size={11} />
        </button>
      )}
    </span>
  );
}

export default function StudentProfile() {
  const { c } = useTheme();
  const { refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const resumeInputRef = useRef();
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  const [requestingSupervisor, setRequestingSupervisor] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const DEFAULT_COVER = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop';
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(DEFAULT_COVER);
  const [uploadingCover, setUploadingCover] = useState(false);
  const { viewerUrl, viewerTitle, openPdf, closePdf } = usePdfViewer();

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData(); fd.append('coverPhoto', file);
    setUploadingCover(true);
    try {
      const r = await api.post('/users/cover-photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCoverPhotoUrl(resolveFileUrl(r.data.coverPhotoUrl));
      toast.success('Cover photo updated!');
    } catch { toast.error('Cover photo upload failed.'); }
    setUploadingCover(false);
  };

  const loadProfile = () => {
    setLoadError(false);
    api.get('/student/profile')
      .then(r => {
        setProfile(r.data);
        setForm(r.data);
        setCoverPhotoUrl(r.data.coverPhotoUrl ? resolveFileUrl(r.data.coverPhotoUrl) : DEFAULT_COVER);
        try { setSkills(JSON.parse(r.data.skills || '[]')); } catch { setSkills([]); }
      }).catch(() => { setLoadError(true); toast.error('Failed to load profile'); });
  };

  useEffect(() => {
    loadProfile();
    api.get('/users/supervisors').then(r => setSupervisors(r.data)).catch(() => {});
  }, []);

  const supervisorName = (id) => {
    const s = supervisors.find(sup => sup.id === id);
    return s ? `${s.title ? s.title + ' ' : ''}${s.firstName} ${s.lastName}` : 'your supervisor';
  };

  const requestSupervisor = async () => {
    if (!selectedSupervisorId) return toast.error('Please select a supervisor first.');
    setRequestingSupervisor(true);
    try {
      const r = await api.post('/student/request-supervisor', { supervisorId: selectedSupervisorId });
      setProfile(r.data.student);
      toast.success('Supervisor request sent.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request.');
    } finally {
      setRequestingSupervisor(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, skills };
      const r = await api.put('/student/profile', payload);
      setProfile(r.data.student);
      setEditing(false);
      await refreshProfile();
      toast.success('Profile saved!');
    } catch { toast.error('Failed to save.'); }
    setSaving(false);
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    const fd = new FormData(); fd.append('profileImage', file);
    setUploading(true);
    try {
      const r = await api.post('/student/profile-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(p => ({ ...p, profileImageUrl: r.data.profileImageUrl }));
      await refreshProfile();
      toast.success('Photo updated!');
    } catch { toast.error('Upload failed.'); }
    setUploading(false);
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) return toast.error('Please select a PDF file first.');
    const fd = new FormData();
    fd.append('resume', resumeFile);
    setUploadingResume(true);
    try {
      const r = await api.post('/student/resume', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(p => ({ ...p, resumeUrl: r.data.resumeUrl }));
      setResumeFile(null);
      toast.success(profile?.resumeUrl ? 'Resume updated!' : 'Resume uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally { setUploadingResume(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match.');
    if (pwForm.newPassword.length < 8) return toast.error('New password must be at least 8 characters.');
    setPwLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally { setPwLoading(false); }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await api.delete('/student/account');
      toast.success('Account deactivated. Signing you out…');
      setTimeout(() => { logout(); navigate('/login'); }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate account.');
      setDeactivating(false);
    }
  };

  if (loadError) {
    return (
      <StudentLayout>
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: c.txt3, marginBottom: '12px' }}>Failed to load profile.</p>
          <button className="btn btn-outline btn-sm" onClick={loadProfile}>Retry</button>
        </div>
      </StudentLayout>
    );
  }
  if (!profile) return (
    <StudentLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={{ fontSize: '13px', color: c.txt3 }}>Loading profile…</div>
      </div>
    </StudentLayout>
  );

  const avatarSrc = profile.profileImageUrl ? resolveFileUrl(profile.profileImageUrl) : null;
  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase();

  return (
    <StudentLayout>
      {viewerUrl && <PdfViewerModal url={viewerUrl} title={viewerTitle} onClose={closePdf} />}
      <div style={{ maxWidth: '760px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
          <h1 className="page-title">My Profile</h1>
          {editing && (
            <div className="mobile-profile-actions" style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}><X size={13} />Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}><Save size={13} />{saving ? 'Saving…' : 'Save'}</button>
            </div>
          )}
        </div>

        {/* Profile card */}
        <div className="card" style={{ marginBottom: '16px', position: 'relative' }}>
          {/* Compact Edit Profile pill — floats over the top-right corner of the cover photo */}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{
                position: 'absolute', top: '16px', right: '16px', zIndex: 5,
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', fontSize: '13px', fontWeight: '600',
                borderRadius: '999px', border: `1px solid ${c.border}`,
                background: c.surface2, color: c.txt1, cursor: 'pointer',
              }}>
              <Edit3 size={13} />Edit Profile
            </button>
          )}

          {/* Cover strip — tech-themed cover photo */}
          <div className="profile-cover" style={{
            height: '128px', position: 'relative',
            backgroundImage: `url('${coverPhotoUrl}')`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}>
            <label className="cover-camera-btn" style={{
              position: 'absolute', bottom: '12px', right: '12px', zIndex: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '50%',
              color: '#fff', cursor: 'pointer',
            }}>
              {uploadingCover ? '…' : <Camera size={16} />}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverChange} disabled={uploadingCover} />
            </label>
          </div>

          {/* Avatar + name */}
          <div className="mobile-profile-header" style={{ padding: '0 24px 20px', position: 'relative' }}>
            {/* Avatar */}
            <div className="mobile-profile-avatar-wrap" style={{ position: 'absolute', top: '-40px', left: '24px' }}>
              <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={e => handleImageUpload(e.target.files[0])} />
              <div className="avatar-upload-ring" onClick={() => fileRef.current.click()}
                style={{ width: '80px', height: '80px', border: '3px solid var(--surface)', background: c.surface }}>
                {avatarSrc
                  ? <img src={avatarSrc} alt="avatar" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                  : <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '26px' }}>{initials || <User size={26} />}</div>}
                <div className="avatar-overlay" style={{ borderRadius: 0 }}>
                  {uploading ? '…' : <><Camera size={14} style={{ display: 'block', marginBottom: '2px' }} /> Photo</>}
                </div>
              </div>
            </div>

            <div className="mobile-profile-info" style={{ paddingTop: '48px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: c.txt1, letterSpacing: '-0.02em', margin: 0 }}>
                {profile.firstName} {profile.lastName}
              </h2>
              <p style={{ fontSize: '13px', color: c.red, fontWeight: '600', margin: 0 }}>
                {profile.degreeProgram || 'UCSI Student'}
              </p>
              <p style={{ fontSize: '12px', color: c.txt3, margin: 0 }}>{profile.faculty}</p>
            </div>

            {/* Contact chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
              {profile.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.txt2 }}><Phone size={12} />{profile.phone}</span>}
              {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#0A66C2' }}><ExternalLink size={12} />LinkedIn</a>}
              {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.txt2 }}><Code2 size={12} />GitHub</a>}
              {profile.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.red }}><Globe size={12} />Portfolio</a>}
            </div>
          </div>
        </div>

        {/* Edit form / display sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* About */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <p className="section-label" style={{ marginBottom: '12px' }}>About</p>
            {editing ? (
              <textarea className="input" rows={4} placeholder="Write a short bio about yourself..."
                value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                style={{ resize: 'vertical', minHeight: '100px' }} />
            ) : (
              <p style={{ fontSize: '14px', color: c.txt2, lineHeight: '1.7', margin: 0 }}>
                {profile.bio || <span style={{ color: c.txt3, fontStyle: 'italic' }}>No bio added yet.</span>}
              </p>
            )}
          </div>

          {/* Education */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <p className="section-label" style={{ marginBottom: '14px' }}>Education</p>
            {editing ? (
              <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { key: 'firstName', label: 'First Name' }, { key: 'lastName', label: 'Last Name' },
                  { key: 'faculty', label: 'Faculty' }, { key: 'degreeProgram', label: 'Degree Programme' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="input-label">{label}</label>
                    <input className="input" value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[['Faculty', profile.faculty], ['Programme', profile.degreeProgram]].map(([l, v]) => (
                  <div key={l}>
                    <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: c.txt3, margin: 0 }}>{l}</p>
                    <p style={{ fontSize: '14px', color: c.txt1, margin: '4px 0 0', fontWeight: '500' }}>{v || '—'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <p className="section-label" style={{ marginBottom: '12px' }}>Skills</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: editing ? '12px' : 0 }}>
              {skills.length === 0 && !editing && <span style={{ fontSize: '13px', color: c.txt3, fontStyle: 'italic' }}>No skills added yet.</span>}
              {skills.map(s => <SkillTag key={s} skill={s} editable={editing} onRemove={sk => setSkills(ss => ss.filter(x => x !== sk))} />)}
            </div>
            {editing && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="input" value={newSkill} placeholder="Add a skill…"
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newSkill.trim()) { setSkills(s => [...s, newSkill.trim()]); setNewSkill(''); } }}
                  style={{ flex: 1 }} />
                <button className="btn btn-outline btn-sm" onClick={() => { if (newSkill.trim()) { setSkills(s => [...s, newSkill.trim()]); setNewSkill(''); } }}>
                  <Plus size={13} /> Add
                </button>
              </div>
            )}
          </div>

          {/* Contact / Links */}
          {editing && (
            <div className="card" style={{ padding: '20px 24px' }}>
              <p className="section-label" style={{ marginBottom: '14px' }}>Contact & Links</p>
              <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { key: 'phone', label: 'Phone', icon: Phone },
                  { key: 'linkedinUrl', label: 'LinkedIn URL', icon: ExternalLink },
                  { key: 'githubUrl', label: 'GitHub URL', icon: Code2 },
                  { key: 'portfolioUrl', label: 'Portfolio URL', icon: Globe },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="input-label">{label}</label>
                    <input className="input" value={form[key] || ''} placeholder={`Enter ${label}`}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Academic Supervisor */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <GraduationCap size={15} style={{ color: c.red }} />
              <p className="section-label" style={{ margin: 0 }}>Academic Supervisor</p>
            </div>

            {profile?.supervisorStatus === 'PENDING' && (
              <div style={{
                marginBottom: '14px', padding: '14px 16px',
                background: 'linear-gradient(135deg, rgba(180,83,9,0.08) 0%, rgba(180,83,9,0.03) 100%)',
                border: '1px solid rgba(180,83,9,0.3)',
                display: 'flex', alignItems: 'flex-start', gap: '10px',
              }}>
                <AlertTriangle size={16} style={{ color: c.amber, flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '13px', color: c.txt1, margin: 0 }}>
                  Awaiting confirmation from <strong>{supervisorName(profile.supervisorId)}</strong>.
                </p>
              </div>
            )}

            {profile?.supervisorStatus === 'REJECTED' && (
              <div style={{
                marginBottom: '14px', padding: '14px 16px',
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)',
                display: 'flex', alignItems: 'flex-start', gap: '10px',
              }}>
                <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '13px', color: '#EF4444', margin: 0, fontWeight: '500' }}>
                  Supervisor request rejected. Refer to Head of Programme.
                </p>
              </div>
            )}

            {profile?.supervisorStatus === 'APPROVED' ? (
              <div style={{
                padding: '14px 16px', background: c.surface2, border: `1px solid ${c.border}`,
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <CheckCircle2 size={16} style={{ color: c.green, flexShrink: 0 }} />
                <p style={{ fontSize: '13px', color: c.txt1, margin: 0 }}>
                  Confirmed supervisor: <strong>{supervisorName(profile.supervisorId)}</strong>
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <select
                  className="input"
                  style={{ flex: 1, minWidth: '200px' }}
                  disabled={profile?.supervisorStatus === 'PENDING'}
                  value={selectedSupervisorId}
                  onChange={e => setSelectedSupervisorId(e.target.value)}>
                  <option value="">Select a supervisor…</option>
                  {supervisors.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title ? `${s.title} ` : ''}{s.firstName} {s.lastName}{s.department ? ` — ${s.department}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={profile?.supervisorStatus === 'PENDING' || requestingSupervisor}
                  onClick={requestSupervisor}>
                  {requestingSupervisor ? 'Sending…' : 'Request'}
                </button>
              </div>
            )}
          </div>

          {/* Resume Management */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={14} style={{ color: c.red }} />
                <p className="section-label" style={{ margin: 0 }}>Resume / CV</p>
              </div>
              {profile?.resumeUrl && <span className="badge badge-green">✓ Resume on file</span>}
            </div>

            {profile?.resumeUrl && (
              <div style={{ padding: '10px 14px', background: c.surface2, border: `1px solid ${c.border}`, marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={14} style={{ color: c.green }} />
                  <span style={{ fontSize: '12px', color: c.txt2, fontWeight: '500' }}>Current resume</span>
                </div>
                <a href={resolveFileUrl(profile.resumeUrl)} target="_blank" rel="noreferrer"
                  onClick={e => { if (window.innerWidth <= 768) { e.preventDefault(); openPdf(resolveFileUrl(profile.resumeUrl), 'My Resume'); } }}
                  style={{ fontSize: '12px', color: c.green, fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Preview PDF →
                </a>
              </div>
            )}

            <div className="mobile-profile-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '9px 14px', border: `1px dashed ${c.border}`,
                cursor: 'pointer', flex: 1, minWidth: '200px',
                color: c.txt2, fontSize: '13px', background: c.surface,
              }}>
                <FileText size={14} style={{ color: c.red, flexShrink: 0 }} />
                {resumeFile ? resumeFile.name : (profile?.resumeUrl ? 'Click to replace resume…' : 'Click to select PDF…')}
                <input ref={resumeInputRef} type="file" accept="application/pdf" style={{ display: 'none' }}
                  onChange={e => setResumeFile(e.target.files[0] || null)} />
              </label>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleResumeUpload}
                disabled={uploadingResume || !resumeFile}
                style={{ flexShrink: 0 }}>
                {uploadingResume
                  ? 'Uploading…'
                  : profile?.resumeUrl
                    ? <><RefreshCw size={12} /> Update Resume</>
                    : <><Upload size={12} /> Upload Resume</>}
              </button>
            </div>
            <p style={{ fontSize: '11px', color: c.txt3, margin: '8px 0 0' }}>PDF only · Max 5 MB · Required to apply for internships.</p>
          </div>

          {/* Change Password */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Lock size={14} style={{ color: c.red }} />
              <p className="section-label" style={{ margin: 0 }}>Change Password</p>
            </div>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '420px' }}>
              <div>
                <label className="input-label">Current Password</label>
                <input className="input" type={showPw ? 'text' : 'password'} required
                  value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPw ? 'text' : 'password'} required style={{ width: '100%', paddingRight: '40px' }}
                    value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                    placeholder="Min 8 characters" />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: c.txt3, display: 'flex' }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="input-label">Confirm New Password</label>
                <input className="input" type={showPw ? 'text' : 'password'} required
                  value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} />
              </div>
              <button type="submit" disabled={pwLoading} className="btn btn-primary btn-sm" style={{ width: 'fit-content' }}>
                <Lock size={12} /> {pwLoading ? 'Changing…' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Danger Zone — Deactivate Account */}
          <div className="card" style={{ padding: '20px 24px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Trash2 size={14} style={{ color: '#EF4444' }} />
              <p className="section-label" style={{ margin: 0, color: '#EF4444' }}>Danger Zone</p>
            </div>
            <p style={{ fontSize: '13px', color: c.txt2, margin: '0 0 14px', lineHeight: '1.5' }}>
              Deactivating your account will sign you out and prevent future logins. Your application history is preserved. Contact the admin to reactivate.
            </p>
            {!confirmDeactivate ? (
              <button onClick={() => setConfirmDeactivate(true)} className="btn btn-outline btn-sm" style={{ color: '#EF4444', borderColor: '#EF4444' }}>
                <Trash2 size={12} /> Deactivate Account
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <p style={{ fontSize: '13px', color: '#EF4444', margin: 0, fontWeight: '600' }}>Are you sure?</p>
                <button onClick={handleDeactivate} disabled={deactivating} className="btn btn-sm" style={{ background: '#EF4444', color: '#fff', border: 'none' }}>
                  {deactivating ? 'Deactivating…' : 'Yes, Deactivate'}
                </button>
                <button onClick={() => setConfirmDeactivate(false)} className="btn btn-outline btn-sm">Cancel</button>
              </div>
            )}
          </div>

          {/* Sign Out */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '13px', color: c.txt2, margin: 0 }}>Signed in as {profile?.firstName} {profile?.lastName}.</p>
            <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-outline btn-sm">
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
