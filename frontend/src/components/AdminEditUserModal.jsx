import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import { X, Save, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_LABEL = { student: 'Student', company: 'Company', supervisor: 'Supervisor' };
const FACULTIES = ['FCCI (IT)', 'ICAD (Arts)', 'FBM (Business)', 'IMus (Music)'];

export default function AdminEditUserModal({ user, role, onClose, onSaved }) {
  const { c } = useTheme();
  const [form, setForm] = useState({});
  const [supervisors, setSupervisors] = useState([]);
  const [forceApprove, setForceApprove] = useState(false);
  const [saving, setSaving] = useState(false);
  const [supervisorLoadFailed, setSupervisorLoadFailed] = useState(false);

  // iOS Safari can visually shift a position:fixed element relative to the
  // underlying page's scroll state when it's inserted — locking the body to
  // its current scroll position while the modal is open (and restoring it on
  // close) keeps the fixed overlay pinned to a clean, unscrolled viewport.
  useEffect(() => {
    const scrollY = window.scrollY;
    const { style } = document.body;
    const prev = { position: style.position, top: style.top, width: style.width };
    style.position = 'fixed';
    style.top = `-${scrollY}px`;
    style.width = '100%';
    return () => {
      style.position = prev.position;
      style.top = prev.top;
      style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    if (role === 'student') {
      setForm({
        firstName: user.firstName, lastName: user.lastName,
        degreeProgram: user.degreeProgram, faculty: user.faculty,
        userFaculty: user.User?.faculty || '',
        supervisorId: user.supervisorId || '',
      });
      setForceApprove(user.supervisorStatus === 'APPROVED');
      api.get('/users/supervisors').then(r => setSupervisors(r.data)).catch(() => setSupervisorLoadFailed(true));
    } else if (role === 'company') {
      setForm({
        companyName: user.companyName, industry: user.industry,
        description: user.description, website: user.website,
        address: user.address, companySize: user.companySize,
      });
    } else if (role === 'supervisor') {
      setForm({
        firstName: user.firstName, lastName: user.lastName,
        department: user.department, title: user.title,
        userFaculty: user.User?.faculty || '',
      });
    }
  }, [user, role]);

  const handleSave = async () => {
    if (!window.confirm('Are you sure you want to save these changes?')) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (role === 'student') {
        payload.forceApproveSupervisor = forceApprove && !!form.supervisorId;
        if (!form.supervisorId) payload.supervisorId = null;
      }
      await api.put(`/admin/users/${user.User.id}/profile`, payload);
      toast.success('User updated successfully.');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mobile-modal-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card mobile-modal-panel" style={{ width: '100%', maxWidth: '480px', maxHeight: '85vh', overflow: 'auto', padding: 0 }}>
        {/* Header */}
        <div className="mobile-modal-header" style={{ height: '60px', background: 'linear-gradient(135deg, #1A2235 0%, #2A3A55 100%)', position: 'relative', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
          <p style={{ color: '#fff', fontWeight: '700', fontSize: '14px', margin: 0 }}>Edit {ROLE_LABEL[role]}</p>
          <button onClick={onClose} title="Close" className="modal-close-btn modal-close-btn--on-banner">
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '12px', color: c.txt3, margin: 0 }}>{user.User?.email}</p>

          {role === 'student' && (
            <>
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
                <label className="input-label">Degree Programme</label>
                <input className="input" value={form.degreeProgram || ''} onChange={e => setForm(f => ({ ...f, degreeProgram: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Faculty (full name)</label>
                <input className="input" value={form.faculty || ''} onChange={e => setForm(f => ({ ...f, faculty: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Faculty Code (for search & filter)</label>
                <select className="input" value={form.userFaculty || ''} onChange={e => setForm(f => ({ ...f, userFaculty: e.target.value }))}>
                  <option value="">Not set</option>
                  {FACULTIES.map(fac => <option key={fac} value={fac}>{fac}</option>)}
                </select>
              </div>

              <div style={{ marginTop: '6px', paddingTop: '14px', borderTop: `1px solid ${c.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <GraduationCap size={14} style={{ color: c.red }} />
                  <p className="section-label" style={{ margin: 0 }}>Supervisor Assignment (God Mode)</p>
                </div>
                <select className="input" value={form.supervisorId || ''} onChange={e => setForm(f => ({ ...f, supervisorId: e.target.value }))}>
                  <option value="">No supervisor</option>
                  {supervisors.map(s => (
                    <option key={s.id} value={s.id}>{s.title ? `${s.title} ` : ''}{s.firstName} {s.lastName}</option>
                  ))}
                </select>
                {supervisorLoadFailed && (
                  <p style={{ fontSize: '12px', color: '#EF4444', margin: '8px 0 0', lineHeight: '1.5' }}>
                    Couldn't load the supervisor list — this dropdown may be incomplete. Try closing and reopening this modal.
                  </p>
                )}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 w-full">
                  <label className={`flex items-start gap-3 w-full ${form.supervisorId ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                    <input
                      type="checkbox"
                      checked={forceApprove}
                      disabled={!form.supervisorId}
                      onChange={e => setForceApprove(e.target.checked)}
                      className="mt-0.5 w-5 h-5 flex-shrink-0 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 leading-snug block">
                      Force approve this assignment (bypasses supervisor confirmation)
                    </span>
                  </label>
                </div>
              </div>
            </>
          )}

          {role === 'company' && (
            <>
              <div>
                <label className="input-label">Company Name</label>
                <input className="input" value={form.companyName || ''} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Industry</label>
                <input className="input" value={form.industry || ''} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Website</label>
                <input className="input" value={form.website || ''} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Address</label>
                <input className="input" value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Company Size</label>
                <input className="input" value={form.companySize || ''} onChange={e => setForm(f => ({ ...f, companySize: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Description</label>
                <textarea className="input" rows={3} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
            </>
          )}

          {role === 'supervisor' && (
            <>
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
                <input className="input" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Department</label>
                <input className="input" value={form.department || ''} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Faculty Code (for search & filter)</label>
                <select className="input" value={form.userFaculty || ''} onChange={e => setForm(f => ({ ...f, userFaculty: e.target.value }))}>
                  <option value="">Not set</option>
                  {FACULTIES.map(fac => <option key={fac} value={fac}>{fac}</option>)}
                </select>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} disabled={saving} onClick={handleSave}>
              <Save size={13} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
