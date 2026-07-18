import { useEffect, useState } from 'react';
import api from '../../api/axios';
import AdminLayout from '../../components/layouts/AdminLayout';
import AdminEditUserModal from '../../components/AdminEditUserModal';
import { ConfirmModal } from '../../components/ApplicantPipelineParts';
import { useTheme } from '../../context/ThemeContext';
import { Edit3, Lock, ToggleLeft, ToggleRight, Search, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const FACULTIES = ['FCCI (IT)', 'ICAD (Arts)', 'FBM (Business)', 'IMus (Music)'];

function PasswordModal({ user, onClose, onSave }) {
  const { c } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (newPassword.length < 8) return toast.error('Password must be at least 8 characters.');
    setSaving(true);
    try {
      await onSave(user.id, newPassword);
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="card compact-modal-panel" style={{ width: '100%', maxWidth: '380px', padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Lock size={16} style={{ color: c.red }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: c.txt1, margin: 0 }}>Reset Password</h3>
        </div>
        <p style={{ fontSize: '13px', color: c.txt2, margin: '0 0 16px' }}>
          Setting new password for <strong>{user.email}</strong>
        </p>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <input
            className="input"
            type={showPw ? 'text' : 'password'}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="New password (min 8 chars)"
            style={{ width: '100%', paddingRight: '40px' }}
          />
          <button onClick={() => setShowPw(s => !s)} type="button"
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: c.txt3, display: 'flex' }}>
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onClose} className="btn btn-outline btn-sm" style={{ flex: 1 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
            {saving ? 'Saving…' : 'Set Password'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUserManagement() {
  const { c } = useTheme();
  const [tab, setTab] = useState('students'); // 'students' | 'companies' | 'supervisors'
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [faculty, setFaculty] = useState('');
  const [editingUser, setEditingUser] = useState(null); // { user, role }
  const [passwordUser, setPasswordUser] = useState(null); // { id, email }
  const [userToDeactivate, setUserToDeactivate] = useState(null); // { id, name }

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/students'),
      api.get('/admin/companies'),
      api.get('/admin/supervisors'),
    ]).then(([s, co, su]) => {
      setStudents(s.data);
      setCompanies(co.data);
      setSupervisors(su.data);
    }).catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  // Reset filters when switching tabs so a stale faculty filter doesn't hide
  // everything on the Companies tab (which has no faculty field at all).
  const switchTab = (key) => { setTab(key); setSearch(''); setFaculty(''); };

  const handlePasswordChange = async (userId, newPassword) => {
    await api.put(`/admin/users/${userId}/password`, { newPassword });
    toast.success('Password updated successfully.');
  };

  const handleToggleArchive = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/toggle-archive`);
      toast.success(res.data.message);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user.');
    }
  };

  const q = search.toLowerCase();

  const filteredStudents = students.filter(s => {
    const matchesSearch = !q || `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.User?.email?.toLowerCase().includes(q) || s.ucsiId?.toLowerCase().includes(q);
    const matchesFaculty = !faculty || s.User?.faculty === faculty;
    return matchesSearch && matchesFaculty;
  });
  const filteredCompanies = companies.filter(co => {
    return !q || co.companyName?.toLowerCase().includes(q) || co.User?.email?.toLowerCase().includes(q);
  });
  const filteredSupervisors = supervisors.filter(su => {
    const matchesSearch = !q || `${su.firstName} ${su.lastName}`.toLowerCase().includes(q) || su.User?.email?.toLowerCase().includes(q);
    const matchesFaculty = !faculty || su.User?.faculty === faculty;
    return matchesSearch && matchesFaculty;
  });

  const openEdit = (user, role) => setEditingUser({ user, role });
  const showFacultyFilter = tab === 'students' || tab === 'supervisors';

  return (
    <AdminLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">User Management</h1>
        <p style={{ fontSize: '13px', color: c.txt3, margin: '8px 0 0' }}>Search, edit, and manage all students, companies, and supervisors.</p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '16px', borderBottom: `1px solid ${c.border}` }}>
        {[['students', `Students (${students.length})`], ['companies', `Companies (${companies.length})`], ['supervisors', `Supervisors (${supervisors.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => switchTab(key)} style={{
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

      {/* Search + Faculty filter */}
      <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: showFacultyFilter ? '1fr 220px' : '1fr', gap: '10px', marginBottom: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: c.txt3 }} />
          <input className="input pill-input" value={search} placeholder="Search by name, email, or UCSI ID…"
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '34px' }} />
        </div>
        {showFacultyFilter && (
          <select className="input pill-input" value={faculty} onChange={e => setFaculty(e.target.value)}>
            <option value="">All Faculties</option>
            {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: '28px', height: '28px', border: `3px solid ${c.border}`, borderTopColor: c.red, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          {tab === 'students' && (
            <table className="table-clean admin-user-table">
              <thead>
                <tr><th className="admin-user-card-cell"></th><th>Student</th><th>UCSI ID</th><th>Faculty</th><th>Supervisor</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => (
                  <tr key={s.id}>
                    <td className="admin-user-card-cell">
                      <div className="admin-card-header">
                        <div className="admin-user-avatar">{s.firstName?.[0]}{s.lastName?.[0]}</div>
                        <div className="admin-card-identity">
                          <div className="admin-card-name">{s.firstName} {s.lastName}</div>
                          <div className="admin-card-subtitle">{s.ucsiId}</div>
                        </div>
                      </div>
                      <div className="admin-card-tags">
                        {s.User?.isArchived
                          ? <span className="badge badge-muted admin-meta-tag">Deactivated</span>
                          : <span className="badge badge-green admin-meta-tag">Active</span>}
                        <span className="admin-meta-tag admin-meta-tag-neutral">Faculty: {s.User?.faculty || '—'}</span>
                        {s.supervisorStatus
                          ? <span className={`badge admin-meta-tag ${s.supervisorStatus === 'APPROVED' ? 'badge-green' : s.supervisorStatus === 'PENDING' ? 'badge-amber' : 'badge-red'}`}>Supervisor: {s.supervisorStatus}</span>
                          : <span className="admin-meta-tag admin-meta-tag-neutral">Supervisor: —</span>}
                      </div>
                    </td>
                    <td data-label="Student" className="admin-user-meta-hide-mobile" style={{ color: c.txt1, fontWeight: '600', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.firstName} {s.lastName}</td>
                    <td data-label="UCSI ID" className="admin-user-meta-hide-mobile" style={{ fontFamily: 'monospace', fontSize: '12px' }}>{s.ucsiId}</td>
                    <td data-label="Faculty" className="admin-user-meta-hide-mobile" style={{ fontSize: '12px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.User?.faculty || <span style={{ color: c.txt3 }}>—</span>}</td>
                    <td data-label="Supervisor" className="admin-user-meta-hide-mobile">
                      {s.supervisorStatus
                        ? <span className={`badge ${s.supervisorStatus === 'APPROVED' ? 'badge-green' : s.supervisorStatus === 'PENDING' ? 'badge-amber' : 'badge-red'}`}>{s.supervisorStatus}</span>
                        : <span style={{ fontSize: '12px', color: c.txt3 }}>—</span>}
                    </td>
                    <td data-label="Status" className="admin-user-status-cell">
                      {s.User?.isArchived
                        ? <span className="badge badge-muted">Deactivated</span>
                        : <span className="badge badge-green">Active</span>}
                    </td>
                    <td className="mobile-card-actions admin-user-actions admin-card-actions">
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px' }} onClick={() => openEdit(s, 'student')}><Edit3 size={11} /> Edit</button>
                        <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px' }} onClick={() => setPasswordUser({ id: s.User?.id, email: s.User?.email })}><Lock size={11} /><span className="mobile-only-text"> Reset</span></button>
                        <button className={`btn btn-outline btn-sm ${s.User?.isArchived ? 'is-success' : 'is-danger'}`} style={{ padding: '4px 10px', color: s.User?.isArchived ? c.green : '#EF4444', borderColor: s.User?.isArchived ? c.green : '#EF4444' }}
                          onClick={() => s.User?.isArchived
                            ? handleToggleArchive(s.User?.id)
                            : setUserToDeactivate({ id: s.User?.id, name: `${s.firstName} ${s.lastName}` })}>
                          {s.User?.isArchived ? <><ToggleRight size={11} /><span className="mobile-only-text"> Activate</span></> : <><ToggleLeft size={11} /><span className="mobile-only-text"> Deactivate</span></>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: c.txt3 }}>No students match your search.</td></tr>}
              </tbody>
            </table>
          )}

          {tab === 'companies' && (
            <table className="table-clean admin-user-table">
              <thead>
                <tr><th className="admin-user-card-cell"></th><th>Company</th><th>Industry</th><th>Email</th><th>Verification</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredCompanies.map(co => (
                  <tr key={co.id}>
                    <td className="admin-user-card-cell">
                      <div className="admin-card-header">
                        <div className="admin-user-avatar">{co.companyName?.[0]}</div>
                        <div className="admin-card-identity">
                          <div className="admin-card-name">{co.companyName}</div>
                          <div className="admin-card-subtitle">{co.industry || 'Industry not set'}</div>
                        </div>
                      </div>
                      <div className="admin-card-tags">
                        {co.User?.isArchived
                          ? <span className="badge badge-muted admin-meta-tag">Deactivated</span>
                          : <span className="badge badge-green admin-meta-tag">Active</span>}
                        {co.isVerified
                          ? <span className="badge badge-green admin-meta-tag">Verified</span>
                          : <span className="badge badge-amber admin-meta-tag">Pending Verification</span>}
                      </div>
                    </td>
                    <td data-label="Company" className="admin-user-meta-hide-mobile" style={{ color: c.txt1, fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{co.companyName}</td>
                    <td data-label="Industry" className="admin-user-meta-hide-mobile" style={{ fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{co.industry || '—'}</td>
                    <td data-label="Email" className="admin-user-meta-cell" style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span className="mobile-only-text admin-user-meta-label">Email: </span>{co.User?.email}
                    </td>
                    <td data-label="Verification" className="admin-user-meta-hide-mobile">{co.isVerified ? <span className="badge badge-green">Verified</span> : <span className="badge badge-amber">Pending</span>}</td>
                    <td data-label="Status" className="admin-user-status-cell">
                      {co.User?.isArchived
                        ? <span className="badge badge-muted">Deactivated</span>
                        : <span className="badge badge-green">Active</span>}
                    </td>
                    <td className="mobile-card-actions admin-user-actions admin-card-actions">
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px' }} onClick={() => openEdit(co, 'company')}><Edit3 size={11} /> Edit</button>
                        <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px' }} onClick={() => setPasswordUser({ id: co.User?.id, email: co.User?.email })}><Lock size={11} /><span className="mobile-only-text"> Reset</span></button>
                        <button className={`btn btn-outline btn-sm ${co.User?.isArchived ? 'is-success' : 'is-danger'}`} style={{ padding: '4px 10px', color: co.User?.isArchived ? c.green : '#EF4444', borderColor: co.User?.isArchived ? c.green : '#EF4444' }}
                          onClick={() => co.User?.isArchived
                            ? handleToggleArchive(co.User?.id)
                            : setUserToDeactivate({ id: co.User?.id, name: co.companyName })}>
                          {co.User?.isArchived ? <><ToggleRight size={11} /><span className="mobile-only-text"> Activate</span></> : <><ToggleLeft size={11} /><span className="mobile-only-text"> Deactivate</span></>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCompanies.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: c.txt3 }}>No companies match your search.</td></tr>}
              </tbody>
            </table>
          )}

          {tab === 'supervisors' && (
            <table className="table-clean admin-user-table">
              <thead>
                <tr><th className="admin-user-card-cell"></th><th>Supervisor</th><th>Title</th><th>Faculty</th><th>Email</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredSupervisors.map(su => (
                  <tr key={su.id}>
                    <td className="admin-user-card-cell">
                      <div className="admin-card-header">
                        <div className="admin-user-avatar">{su.firstName?.[0]}{su.lastName?.[0]}</div>
                        <div className="admin-card-identity">
                          <div className="admin-card-name">{su.firstName} {su.lastName}</div>
                          <div className="admin-card-subtitle">{su.title || 'Supervisor'}</div>
                        </div>
                      </div>
                      <div className="admin-card-tags">
                        {su.User?.isArchived
                          ? <span className="badge badge-muted admin-meta-tag">Deactivated</span>
                          : <span className="badge badge-green admin-meta-tag">Active</span>}
                        <span className="admin-meta-tag admin-meta-tag-neutral">Faculty: {su.User?.faculty || '—'}</span>
                      </div>
                    </td>
                    <td data-label="Supervisor" className="admin-user-meta-hide-mobile" style={{ color: c.txt1, fontWeight: '600', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{su.firstName} {su.lastName}</td>
                    <td data-label="Title" className="admin-user-meta-hide-mobile" style={{ fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{su.title || '—'}</td>
                    <td data-label="Faculty" className="admin-user-meta-hide-mobile" style={{ fontSize: '12px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{su.User?.faculty || <span style={{ color: c.txt3 }}>—</span>}</td>
                    <td data-label="Email" className="admin-user-meta-cell" style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span className="mobile-only-text admin-user-meta-label">Email: </span>{su.User?.email}
                    </td>
                    <td data-label="Status" className="admin-user-status-cell">
                      {su.User?.isArchived
                        ? <span className="badge badge-muted">Deactivated</span>
                        : <span className="badge badge-green">Active</span>}
                    </td>
                    <td className="mobile-card-actions admin-user-actions admin-card-actions">
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px' }} onClick={() => openEdit(su, 'supervisor')}><Edit3 size={11} /> Edit</button>
                        <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px' }} onClick={() => setPasswordUser({ id: su.User?.id, email: su.User?.email })}><Lock size={11} /><span className="mobile-only-text"> Reset</span></button>
                        <button className={`btn btn-outline btn-sm ${su.User?.isArchived ? 'is-success' : 'is-danger'}`} style={{ padding: '4px 10px', color: su.User?.isArchived ? c.green : '#EF4444', borderColor: su.User?.isArchived ? c.green : '#EF4444' }}
                          onClick={() => su.User?.isArchived
                            ? handleToggleArchive(su.User?.id)
                            : setUserToDeactivate({ id: su.User?.id, name: `${su.firstName} ${su.lastName}` })}>
                          {su.User?.isArchived ? <><ToggleRight size={11} /><span className="mobile-only-text"> Activate</span></> : <><ToggleLeft size={11} /><span className="mobile-only-text"> Deactivate</span></>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSupervisors.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: c.txt3 }}>No supervisors match your search.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      )}

      {editingUser && (
        <AdminEditUserModal
          user={editingUser.user}
          role={editingUser.role}
          onClose={() => setEditingUser(null)}
          onSaved={loadAll}
        />
      )}

      {passwordUser && (
        <PasswordModal
          user={passwordUser}
          onClose={() => setPasswordUser(null)}
          onSave={handlePasswordChange}
        />
      )}

      {userToDeactivate && (
        <ConfirmModal
          message={`Are you sure you want to deactivate the account for ${userToDeactivate.name}? They will no longer be able to log in.`}
          confirmLabel="Deactivate"
          danger
          onConfirm={() => {
            handleToggleArchive(userToDeactivate.id);
            setUserToDeactivate(null);
          }}
          onCancel={() => setUserToDeactivate(null)}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </AdminLayout>
  );
}
