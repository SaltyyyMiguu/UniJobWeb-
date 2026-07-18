import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { API_BASE_URL } from '../../api/axios';
import SupervisorLayout from '../../components/layouts/SupervisorLayout';
import { useTheme } from '../../context/ThemeContext';
import { PIPELINE } from '../../components/ApplicantPipelineParts';
import { ArrowLeft, Briefcase, FileText, GraduationCap, Mail, Hash, ThumbsUp, ThumbsDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePdfViewer } from '../../hooks/usePdfViewer';
import PdfViewerModal from '../../components/PdfViewerModal';

function PlacementCard({ app, onApprove, onReject, acting, c }) {
  const pipeline = PIPELINE[app.status] || PIPELINE.PENDING;
  const logoSrc = app.JobPosting?.Company?.profileImageUrl
    ? `${API_BASE_URL}/${app.JobPosting.Company.profileImageUrl}`
    : null;
  const { viewerUrl, viewerTitle, openPdf, closePdf } = usePdfViewer();

  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      {viewerUrl && <PdfViewerModal url={viewerUrl} title={viewerTitle} onClose={closePdf} />}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', minWidth: 0 }}>
          <div style={{ width: '38px', height: '38px', flexShrink: 0, background: logoSrc ? 'transparent' : c.red, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {logoSrc
              ? <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>{app.JobPosting?.Company?.companyName?.[0] || 'C'}</span>}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '14px', fontWeight: '700', color: c.txt1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.JobPosting?.title}</p>
            <p style={{ fontSize: '12px', color: c.txt3, margin: '2px 0 0' }}>{app.JobPosting?.Company?.companyName}</p>
          </div>
        </div>
        <span className={`badge ${pipeline.badgeClass}`} style={{ flexShrink: 0 }}>{pipeline.label}</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: (app.resumeSnapshot || app.offerLetterUrl || app.status === 'HIRED') ? '10px' : 0 }}>
        {app.resumeSnapshot && (
          <a href={`${API_BASE_URL}/${app.resumeSnapshot}`} target="_blank" rel="noreferrer"
            onClick={e => { if (window.innerWidth <= 768) { e.preventDefault(); openPdf(`${API_BASE_URL}/${app.resumeSnapshot}`, 'Resume'); } }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: c.green, fontWeight: '600', padding: '6px 12px', border: '1px solid rgba(26,127,90,0.3)', background: 'rgba(26,127,90,0.07)' }}>
            <FileText size={12} />View Resume
          </a>
        )}
        {app.offerLetterUrl && (
          <a href={`${API_BASE_URL}/${app.offerLetterUrl}`} target="_blank" rel="noreferrer"
            onClick={e => { if (window.innerWidth <= 768) { e.preventDefault(); openPdf(`${API_BASE_URL}/${app.offerLetterUrl}`, 'Offer Letter'); } }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1D4ED8', fontWeight: '600', padding: '6px 12px', border: '1px solid rgba(29,78,216,0.3)', background: 'rgba(29,78,216,0.07)' }}>
            <FileText size={12} />View Offer Letter PDF
          </a>
        )}
      </div>

      {/* Placement approval — only surfaces once the company has HIRED the student */}
      {app.status === 'HIRED' && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: c.green, borderColor: c.green }}
            disabled={acting}
            onClick={() => onApprove(app.id)}>
            <ThumbsUp size={14} /> Approve Placement
          </button>
          <button
            className="btn" style={{ flex: 1, justifyContent: 'center', background: '#EF4444', color: '#fff', border: 'none' }}
            disabled={acting}
            onClick={() => onReject(app.id)}>
            <ThumbsDown size={14} /> Reject Placement
          </button>
        </div>
      )}
    </div>
  );
}

export default function SupervisorStudentDetail() {
  const { c } = useTheme();
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = () => {
    api.get(`/supervisor/students/${studentId}`)
      .then(res => { setStudent(res.data.student); setApplications(res.data.applications); })
      .catch(() => toast.error('Failed to load student.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [studentId]);

  const handlePlacement = async (appId, action) => {
    setActing(true);
    try {
      await api.put(`/supervisor/students/${studentId}/applications/${appId}/${action}-placement`);
      toast.success(action === 'approve' ? 'Placement approved.' : 'Placement rejected.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <SupervisorLayout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: '28px', height: '28px', border: `3px solid ${c.border}`, borderTopColor: c.red, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </SupervisorLayout>
    );
  }

  if (!student) {
    return (
      <SupervisorLayout>
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: c.txt3 }}>Student not found or you do not have access.</p>
        </div>
      </SupervisorLayout>
    );
  }

  return (
    <SupervisorLayout>
      <button onClick={() => navigate('/supervisor/dashboard')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: c.txt3, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '18px', fontWeight: '500' }}>
        <ArrowLeft size={13} /> Back to Dashboard
      </button>

      <div className="card" style={{ padding: '20px 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: c.txt1, margin: 0 }}>{student.firstName} {student.lastName}</h1>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.txt2 }}>
            <GraduationCap size={12} style={{ color: c.txt3 }} /> {student.degreeProgram}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.txt2, fontFamily: 'monospace' }}>
            <Hash size={12} style={{ color: c.txt3 }} /> {student.ucsiId}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.txt2 }}>
            <Mail size={12} style={{ color: c.txt3 }} /> {student.User?.email}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Briefcase size={15} style={{ color: c.red }} />
        <p className="section-label" style={{ margin: 0 }}>Application Pipeline (Read-Only)</p>
      </div>

      {applications.length === 0 ? (
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: c.txt3, margin: 0 }}>This student has not applied to any internships yet.</p>
        </div>
      ) : (
        <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))', gap: '12px' }}>
          {applications.map(app => (
            <PlacementCard
              key={app.id} app={app} c={c} acting={acting}
              onApprove={(appId) => handlePlacement(appId, 'approve')}
              onReject={(appId) => handlePlacement(appId, 'reject')}
            />
          ))}
        </div>
      )}
    </SupervisorLayout>
  );
}
