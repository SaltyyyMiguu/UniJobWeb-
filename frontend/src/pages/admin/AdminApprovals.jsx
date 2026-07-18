import { useEffect, useState } from 'react';
import api from '../../api/axios';
import AdminLayout from '../../components/layouts/AdminLayout';
import { useTheme } from '../../context/ThemeContext';
import { CheckCircle, XCircle, Building2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminApprovals() {
  const { c } = useTheme();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const fetchPending = () => api.get('/admin/companies/pending').then(r => setCompanies(r.data)).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { fetchPending(); }, []);

  const verify = async (id) => {
    setActing(id + 'v');
    try { await api.put(`/admin/companies/${id}/verify`); toast.success('Company verified!'); fetchPending(); }
    catch { toast.error('Failed.'); } finally { setActing(null); }
  };

  const reject = async (id) => {
    if (!confirm('Permanently reject and remove this company?')) return;
    setActing(id + 'r');
    try { await api.delete(`/admin/companies/${id}`); toast.success('Company rejected.'); fetchPending(); }
    catch { toast.error('Failed.'); } finally { setActing(null); }
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Company Approvals</h1>
        <p style={{ fontSize: '13px', color: c.txt3, margin: '8px 0 0' }}>
          Verify company SSM numbers before granting access to post jobs and interact with students.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: '28px', height: '28px', border: `3px solid ${c.border}`, borderTopColor: c.red, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : companies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <CheckCircle size={40} style={{ color: c.green, margin: '0 auto 12px' }} />
          <p style={{ color: c.txt1, fontWeight: '600', fontSize: '14px', margin: 0 }}>All caught up!</p>
          <p style={{ color: c.txt3, fontSize: '13px', margin: '4px 0 0' }}>No companies pending verification.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {companies.map(company => (
            <div key={company.id} className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '14px', flex: 1, minWidth: 0 }}>
                <div style={{ width: '40px', height: '40px', background: '#1A2235', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '16px', flexShrink: 0 }}>
                  {company.companyName?.[0]?.toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: c.txt1, margin: 0 }}>{company.companyName}</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: c.txt2 }}>
                      <Mail size={11} />{company.User?.email}
                    </span>
                    <span className="badge badge-muted">SSM: {company.ssmNumber}</span>
                    {company.industry && <span className="badge badge-muted">{company.industry}</span>}
                  </div>
                  <p style={{ fontSize: '11px', color: c.txt3, margin: '6px 0 0' }}>
                    Registered on {new Date(company.User?.createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button onClick={() => verify(company.id)} disabled={!!acting}
                  className="btn btn-sm" style={{ background: c.green, color: '#fff', borderColor: c.green }}>
                  <CheckCircle size={12} />Verify
                </button>
                <button onClick={() => reject(company.id)} disabled={!!acting}
                  className="btn btn-outline btn-sm" style={{ color: '#EF4444', borderColor: '#EF4444' }}>
                  <XCircle size={12} />Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </AdminLayout>
  );
}
