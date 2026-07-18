import { useState, useEffect } from 'react';
import api from '../../api/axios';
import SupervisorLayout from '../../components/layouts/SupervisorLayout';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Edit3, Save, X, Lock, Trash2, Eye, EyeOff, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function SupervisorProfile() {
  const { c } = useTheme();
  const { refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadProfile = () => {
    setLoadError(false);
    api.get('/supervisor/profile')
      .then(r => { setProfile(r.data); setForm(r.data); })
      .catch(() => { setLoadError(true); toast.error('Failed to load profile'); });
  };

  useEffect(loadProfile, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.put('/supervisor/profile', form);
      setProfile(r.data.supervisor);
      setEditing(false);
      await refreshProfile();
      toast.success('Profile saved!');
    } catch { toast.error('Failed to save.'); }
    setSaving(false);
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
      await api.delete('/supervisor/account');
      toast.success('Account deactivated. Signing you out…');
      setTimeout(() => { logout(); navigate('/login'); }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate account.');
      setDeactivating(false);
    }
  };

  if (loadError) {
    return (
      <SupervisorLayout>
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--txt-3)', marginBottom: '12px' }}>Failed to load profile.</p>
          <button className="btn btn-outline btn-sm" onClick={loadProfile}>Retry</button>
        </div>
      </SupervisorLayout>
    );
  }
  if (!profile) return <SupervisorLayout><div style={{ padding: '60px', textAlign: 'center', color: 'var(--txt-3)', fontSize: '13px' }}>Loading…</div></SupervisorLayout>;

  const avatarLetter = profile.firstName?.[0]?.toUpperCase() || 'S';

  return (
    <SupervisorLayout>
      <div style={{ maxWidth: '760px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
          <h1 className="page-title">My Profile</h1>
          {editing ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}><X size={13} />Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}><Save size={13} />{saving ? 'Saving…' : 'Save'}</button>
            </div>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}><Edit3 size={13} />Edit Profile</button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Identity card */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: editing ? '20px' : 0 }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: c.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontWeight: '700', fontSize: '20px' }}>{avatarLetter}</span>
              </div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: '700', color: c.txt1, margin: 0 }}>
                  {profile.title ? `${profile.title} ` : ''}{profile.firstName} {profile.lastName}
                </p>
                <p style={{ fontSize: '12px', color: c.txt3, margin: '3px 0 0' }}>{profile.department || 'Department not set'}</p>
              </div>
            </div>

            {editing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="input-label">First Name</label>
                    <input className="input" value={form.firstName || ''} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="input-label">Last Name</label>
                    <input className="input" value={form.lastName || ''} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="input-label">Title</label>
                  <input className="input" value={form.title || ''} placeholder="e.g. Senior Lecturer" onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">Department</label>
                  <input className="input" value={form.department || ''} placeholder="e.g. Department of Computer Science" onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
                </div>
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
              Deactivating your account will sign you out and prevent future logins. Your supervised students will need to be reassigned by an admin.
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
            <p style={{ fontSize: '13px', color: c.txt2, margin: 0 }}>Signed in as {profile.firstName} {profile.lastName}.</p>
            <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-outline btn-sm">
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </SupervisorLayout>
  );
}
