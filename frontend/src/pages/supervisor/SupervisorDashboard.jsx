import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import SupervisorLayout from '../../components/layouts/SupervisorLayout';
import { useTheme } from '../../context/ThemeContext';
import { PIPELINE } from '../../components/ApplicantPipelineParts';
import { Check, X, Users, Clock, GraduationCap, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const FACULTIES = ['FCCI (IT)', 'ICAD (Arts)', 'FBM (Business)', 'IMus (Music)'];

export default function SupervisorDashboard() {
  const { c } = useTheme();
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null); // studentId currently being accepted/rejected
  const [search, setSearch] = useState('');
  const [faculty, setFaculty] = useState('');

  const load = () => {
    api.get('/supervisor/dashboard')
      .then(res => { setPending(res.data.pending); setApproved(res.data.approved); })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filteredApproved = useMemo(() => {
    const q = search.toLowerCase();
    return approved.filter(s => {
      const matchesSearch = !q || `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.ucsiId?.toLowerCase().includes(q);
      const matchesFaculty = !faculty || s.faculty === faculty;
      return matchesSearch && matchesFaculty;
    });
  }, [approved, search, faculty]);

  const respond = async (studentId, action) => {
    setActing(studentId);
    try {
      await api.put(`/supervisor/students/${studentId}/${action}`);
      toast.success(action === 'accept' ? 'Student accepted.' : 'Student rejected.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setActing(null);
    }
  };

  return (
    <SupervisorLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Supervisor Dashboard</h1>
        <p style={{ fontSize: '13px', color: c.txt3, margin: '8px 0 0' }}>Manage your assigned students and their internship placements.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: '28px', height: '28px', border: `3px solid ${c.border}`, borderTopColor: c.red, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Pending Requests */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Clock size={15} style={{ color: c.amber }} />
              <p className="section-label" style={{ margin: 0 }}>Pending Requests</p>
              {pending.length > 0 && <span className="badge badge-amber">{pending.length}</span>}
            </div>

            {pending.length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: c.txt3, margin: 0 }}>No pending supervision requests.</p>
              </div>
            ) : (
              <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '12px' }}>
                {pending.map(student => (
                  <div key={student.id} className="card" style={{ padding: '16px 18px' }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: c.txt1, margin: 0 }}>{student.firstName} {student.lastName}</p>
                    <p style={{ fontSize: '12px', color: c.txt3, margin: '3px 0 0' }}>{student.degreeProgram}</p>
                    <p style={{ fontSize: '11px', color: c.txt3, margin: '2px 0 12px', fontFamily: 'monospace' }}>{student.ucsiId} · {student.User?.email}</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                        disabled={acting === student.id}
                        onClick={() => respond(student.id, 'accept')}>
                        <Check size={13} /> Accept
                      </button>
                      <button
                        className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center', color: '#EF4444', borderColor: '#EF4444' }}
                        disabled={acting === student.id}
                        onClick={() => respond(student.id, 'reject')}>
                        <X size={13} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Students */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Users size={15} style={{ color: c.red }} />
              <p className="section-label" style={{ margin: 0 }}>My Students</p>
              {approved.length > 0 && <span className="badge badge-muted">{approved.length}</span>}
            </div>

            {approved.length === 0 ? (
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <GraduationCap size={28} style={{ color: c.border, margin: '0 auto 10px' }} />
                <p style={{ fontSize: '13px', color: c.txt3, margin: 0 }}>No approved students yet.</p>
              </div>
            ) : (
              <>
                {/* Search + Faculty filter */}
                <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: c.txt3 }} />
                    <input className="input pill-input" value={search} placeholder="Search by name, email, or UCSI ID…"
                      onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '34px' }} />
                  </div>
                  <select className="input pill-input" value={faculty} onChange={e => setFaculty(e.target.value)}>
                    <option value="">All Faculties</option>
                    {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div className="card" style={{ overflowX: 'auto' }}>
                  <table className="table-clean">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>UCSI ID</th>
                        <th>Faculty</th>
                        <th>Programme</th>
                        <th>Highest Stage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApproved.map(student => {
                        const stage = student.highestStage ? PIPELINE[student.highestStage] : null;
                        return (
                          <tr key={student.id} onClick={() => navigate(`/supervisor/students/${student.id}`)} style={{ cursor: 'pointer' }}>
                            <td data-label="Student" style={{ color: c.txt1, fontWeight: '600' }}>{student.firstName} {student.lastName}</td>
                            <td data-label="UCSI ID" style={{ fontFamily: 'monospace', fontSize: '12px' }}>{student.ucsiId}</td>
                            <td data-label="Faculty" style={{ fontSize: '12px' }}>{student.faculty || <span style={{ color: c.txt3 }}>—</span>}</td>
                            <td data-label="Programme" style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.degreeProgram}</td>
                            <td data-label="Highest Stage">
                              {stage
                                ? <span className={`badge ${stage.badgeClass}`}>{stage.label}</span>
                                : <span style={{ fontSize: '12px', color: c.txt3 }}>No applications yet</span>}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredApproved.length === 0 && (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: c.txt3 }}>No students match your search.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </SupervisorLayout>
  );
}
