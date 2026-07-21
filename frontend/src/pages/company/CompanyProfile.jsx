import { useState, useEffect, useRef } from 'react';
import api, { resolveFileUrl } from '../../api/axios';
import CompanyLayout from '../../components/layouts/CompanyLayout';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Edit3, Save, X, Globe, ExternalLink, Phone, Building2, MapPin, Users, Calendar, CheckCircle, Camera, Lock, Trash2, Eye, EyeOff, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SIZES = ['', '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
const INDUSTRIES = ['', 'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail', 'Consulting', 'Media', 'Other'];

export default function CompanyProfile() {
  const { c } = useTheme();
  const { refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const DEFAULT_COVER = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop';
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(DEFAULT_COVER);
  const [uploadingCover, setUploadingCover] = useState(false);

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
      await api.delete('/company/account');
      toast.success('Account deactivated. Signing you out…');
      setTimeout(() => { logout(); navigate('/login'); }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate account.');
      setDeactivating(false);
    }
  };

  const loadProfile = () => {
    setLoadError(false);
    api.get('/company/profile')
      .then(r => {
        setProfile(r.data);
        setForm(r.data);
        setCoverPhotoUrl(r.data.coverPhotoUrl ? resolveFileUrl(r.data.coverPhotoUrl) : DEFAULT_COVER);
      })
      .catch(() => { setLoadError(true); toast.error('Failed to load profile'); });
  };

  useEffect(loadProfile, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.put('/company/profile', form);
      setProfile(r.data.company);
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
      const r = await api.post('/company/profile-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(p => ({ ...p, profileImageUrl: r.data.profileImageUrl }));
      await refreshProfile();
      toast.success('Logo updated!');
    } catch { toast.error('Upload failed.'); }
    setUploading(false);
  };

  if (loadError) {
    return (
      <CompanyLayout>
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--txt-3)', marginBottom: '12px' }}>Failed to load profile.</p>
          <button className="btn btn-outline btn-sm" onClick={loadProfile}>Retry</button>
        </div>
      </CompanyLayout>
    );
  }
  if (!profile) return <CompanyLayout><div style={{ padding: '60px', textAlign: 'center', color: 'var(--txt-3)', fontSize: '13px' }}>Loading…</div></CompanyLayout>;

  const avatarSrc = profile.profileImageUrl ? resolveFileUrl(profile.profileImageUrl) : null;
  const avatarLetter = profile.companyName?.[0]?.toUpperCase() || 'C';

  return (
    <CompanyLayout>
      <div style={{ maxWidth: '760px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
          <h1 className="page-title">Company Profile</h1>
          {editing && (
            <div className="mobile-profile-actions" style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}><X size={13} />Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}><Save size={13} />{saving ? 'Saving…' : 'Save'}</button>
            </div>
          )}
        </div>

        {/* Company card */}
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
          <div className="mobile-profile-header" style={{ padding: '0 24px 20px', position: 'relative' }}>
            {/* Logo */}
            <div className="mobile-profile-avatar-wrap" style={{ position: 'absolute', top: '-40px', left: '24px' }}>
              <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={e => handleImageUpload(e.target.files[0])} />
              <div className="avatar-upload-ring" onClick={() => fileRef.current.click()}
                style={{ width: '80px', height: '80px', border: '3px solid var(--surface)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {avatarSrc
                  ? <img src={avatarSrc} alt="logo" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                  : <div className="avatar" style={{ width: '80px', height: '80px', background: '#1A2235', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', color: '#fff' }}>{avatarLetter}</div>}
                <div className="avatar-overlay" style={{ borderRadius: 0 }}>
                  {uploading ? '…' : <><Camera size={14} style={{ display: 'block', marginBottom: '2px' }} /> Logo</>}
                </div>
              </div>
            </div>

            <div className="mobile-profile-info" style={{ paddingTop: '48px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: c.txt1, letterSpacing: '-0.02em', margin: 0 }}>{profile.companyName}</h2>
                {profile.isVerified && <span className="badge badge-green"><CheckCircle size={10} />Verified</span>}
              </div>
              <p style={{ fontSize: '13px', color: c.txt2, margin: 0 }}>{profile.industry}</p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '16px' }}>
              {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.red }}><Globe size={12} />{profile.website}</a>}
              {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#0A66C2' }}><ExternalLink size={12} />LinkedIn</a>}
              {profile.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.txt2 }}><Phone size={12} />{profile.phone}</span>}
              {profile.address && <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.txt2 }}><MapPin size={12} />{profile.address}</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* About */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <p className="section-label" style={{ marginBottom: '12px' }}>About the Company</p>
            {editing ? (
              <textarea className="input" rows={4} placeholder="Describe your company, mission, culture..."
                value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                style={{ resize: 'vertical' }} />
            ) : (
              <p style={{ fontSize: '14px', color: c.txt2, lineHeight: '1.7', margin: 0 }}>
                {profile.description || <span style={{ color: c.txt3, fontStyle: 'italic' }}>No description added yet.</span>}
              </p>
            )}
          </div>

          {/* Company details */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <p className="section-label" style={{ marginBottom: '14px' }}>Company Details</p>
            {editing ? (
              <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { key: 'companyName', label: 'Company Name' },
                  { key: 'ssmNumber', label: 'SSM Number' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="input-label">{label}</label>
                    <input className="input" value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label className="input-label">Industry</label>
                  <select className="input" value={form.industry || ''} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i || 'Select Industry…'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Company Size</label>
                  <select className="input" value={form.companySize || ''} onChange={e => setForm(f => ({ ...f, companySize: e.target.value }))}>
                    {SIZES.map(s => <option key={s} value={s}>{s || 'Select Size…'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Founded Year</label>
                  <input className="input" type="number" min="1900" max={new Date().getFullYear()} value={form.foundedYear || ''} onChange={e => setForm(f => ({ ...f, foundedYear: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">Address / City</label>
                  <input className="input" value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Website</label>
                  <input className="input" value={form.website || ''} placeholder="https://yourcompany.com" onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">LinkedIn URL</label>
                  <input className="input" value={form.linkedinUrl || ''} placeholder="https://linkedin.com/company/..." onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">Phone</label>
                  <input className="input" value={form.phone || ''} placeholder="+60 3-xxxx xxxx" onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  ['Industry', profile.industry, Building2],
                  ['Company Size', profile.companySize, Users],
                  ['Founded', profile.foundedYear, Calendar],
                  ['SSM No.', profile.ssmNumber, CheckCircle],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: c.txt3, margin: 0 }}>{label}</p>
                    <p style={{ fontSize: '14px', color: c.txt1, margin: '4px 0 0', fontWeight: '500' }}>{val || '—'}</p>
                  </div>
                ))}
              </div>
            )}
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

          {/* Danger Zone */}
          <div className="card" style={{ padding: '20px 24px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Trash2 size={14} style={{ color: '#EF4444' }} />
              <p className="section-label" style={{ margin: 0, color: '#EF4444' }}>Danger Zone</p>
            </div>
            <p style={{ fontSize: '13px', color: c.txt2, margin: '0 0 14px', lineHeight: '1.5' }}>
              Deactivating your company account will sign you out and prevent future logins. Job listings and application history are preserved. Contact the admin to reactivate.
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
            <p style={{ fontSize: '13px', color: c.txt2, margin: 0 }}>Signed in as {profile?.companyName || 'your company'}.</p>
            <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-outline btn-sm">
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </CompanyLayout>
  );
}
