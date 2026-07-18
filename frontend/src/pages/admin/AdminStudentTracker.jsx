import { useEffect, useState } from 'react';
import api from '../../api/axios';
import AdminLayout from '../../components/layouts/AdminLayout';
import { useTheme } from '../../context/ThemeContext';
import { CheckCircle, Clock, Search } from 'lucide-react';

export default function AdminStudentTracker() {
  const { c } = useTheme();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/students').then(res => setStudents(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const placed = students.filter(s => s.Applications?.length > 0);
  const seeking = students.filter(s => !s.Applications?.length);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return !q || `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.ucsiId?.includes(q) || s.degreeProgram?.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Student Tracker</h1>
        <p style={{ fontSize: '13px', color: c.txt3, margin: '8px 0 0' }}>Monitor internship placement status for all registered UCSI students.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-num" style={{ color: c.green }}>{placed.length}</div>
              <div className="stat-label">Students Placed</div>
            </div>
            <CheckCircle size={18} style={{ color: c.green, opacity: 0.5 }} />
          </div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-num" style={{ color: c.amber }}>{seeking.length}</div>
              <div className="stat-label">Still Seeking</div>
            </div>
            <Clock size={18} style={{ color: c.amber, opacity: 0.5 }} />
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: c.txt3 }} />
        <input className="input pill-input" value={search} placeholder="Search by name, UCSI ID, or programme…"
          onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '34px' }} />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: '28px', height: '28px', border: `3px solid ${c.border}`, borderTopColor: c.red, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="table-clean">
            <thead>
              <tr>
                <th>Student</th>
                <th>UCSI ID</th>
                <th>Programme</th>
                <th>Email</th>
                <th>Status</th>
                <th>Company / Position</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(student => {
                const acceptedApp = student.Applications?.[0];
                const isPlaced = !!acceptedApp;
                return (
                  <tr key={student.id}>
                    <td data-label="Student" style={{ color: c.txt1, fontWeight: '600' }}>{student.firstName} {student.lastName}</td>
                    <td data-label="UCSI ID" style={{ fontFamily: 'monospace', fontSize: '12px' }}>{student.ucsiId}</td>
                    <td data-label="Programme" style={{ fontSize: '12px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.degreeProgram}</td>
                    <td data-label="Email" style={{ fontSize: '12px' }}>{student.User?.email}</td>
                    <td data-label="Status">
                      {isPlaced
                        ? <span className="badge badge-green"><CheckCircle size={9} />Placed</span>
                        : <span className="badge badge-amber"><Clock size={9} />Seeking</span>}
                    </td>
                    <td data-label="Company / Position" style={{ fontSize: '12px', color: c.txt2 }}>
                      {acceptedApp
                        ? `${acceptedApp.JobPosting?.Company?.companyName} — ${acceptedApp.JobPosting?.title}`
                        : <span style={{ color: c.txt3 }}>—</span>}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: c.txt3 }}>No students match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </AdminLayout>
  );
}
