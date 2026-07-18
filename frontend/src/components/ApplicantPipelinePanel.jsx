import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { CheckCircle, Users, ChevronRight, Gift, Trophy, X, ClipboardList } from 'lucide-react';
import StudentProfileModal from './StudentProfileModal';
import { ApplicantCard, ClosedApplicantCard } from './ApplicantPipelineParts';
import { useApplicantPipeline } from '../hooks/useApplicantPipeline';

const ACTIVE_STATUSES = ['PENDING', 'ACCEPTED', 'OFFERED'];
const CLOSED_STATUSES = ['HIRED', 'REJECTED', 'WITHDRAWN', 'AUTO_REJECTED', 'OFFER_ACCEPTED', 'OFFER_REJECTED'];

// Applicant pipeline for a single job, as a popout layer above the Manage Jobs
// grid (which stays visible-but-blurred behind it) — same interaction as the
// Saved Jobs panel on the student side.
export default function ApplicantPipelinePanel({ job, onClose }) {
  const { c } = useTheme();
  const { apps, loading, updating, handleAction, handleSetSlots } = useApplicantPipeline();
  const [tab, setTab] = useState('active');
  const [viewingStudent, setViewingStudent] = useState(null);

  const jobApps = apps.filter(a => a.JobPosting?.id === job.id);
  const active = jobApps.filter(a => ACTIVE_STATUSES.includes(a.status));
  const closed = jobApps.filter(a => CLOSED_STATUSES.includes(a.status));

  const pendingCount  = jobApps.filter(a => a.status === 'PENDING').length;
  const acceptedCount = jobApps.filter(a => a.status === 'ACCEPTED').length;
  const offeredCount  = jobApps.filter(a => a.status === 'OFFERED').length;
  const hiredCount    = jobApps.filter(a => a.status === 'HIRED').length;

  return (
    <div className="layer-overlay" onClick={onClose}>
      <div className="layer-panel" onClick={e => e.stopPropagation()}>
        {viewingStudent && (
          <StudentProfileModal
            studentId={viewingStudent.id}
            studentName={viewingStudent.name}
            resumeSnapshot={viewingStudent.resumeSnapshot}
            onClose={() => setViewingStudent(null)}
          />
        )}

        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
            <ClipboardList size={17} style={{ color: c.red, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: c.txt1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {job.title}
              </h2>
              <p style={{ fontSize: '11px', color: c.txt3, margin: '2px 0 0' }}>Applicant Pipeline</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span className="badge badge-amber"><Users size={10} />{pendingCount}</span>
              <span className="badge badge-blue"><ChevronRight size={10} />{acceptedCount}</span>
              <span className="badge badge-green"><Gift size={10} />{offeredCount}</span>
              <span className="badge badge-green"><Trophy size={10} />{hiredCount}</span>
            </div>
            <button onClick={onClose} title="Close" className="modal-close-btn">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '2px', padding: '0 22px', borderBottom: `1px solid ${c.border}`, flexShrink: 0 }}>
          {[['active', 'Active Pipeline'], ['closed', 'Closed']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '10px 14px', fontSize: '13px', fontWeight: tab === key ? '700' : '500',
              color: tab === key ? c.red : c.txt3,
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: tab === key ? `2px solid ${c.red}` : '2px solid transparent',
              marginBottom: '-1px', transition: 'all 0.15s',
            }}>
              {label} ({key === 'active' ? active.length : closed.length})
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 22px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ width: '28px', height: '28px', border: `3px solid ${c.border}`, borderTopColor: c.red, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : tab === 'active' ? (
            active.length === 0 ? (
              <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                <CheckCircle size={32} style={{ color: c.green, margin: '0 auto 12px' }} />
                <p style={{ fontSize: '14px', color: c.txt3, margin: 0 }}>No active applications for this job.</p>
              </div>
            ) : (
              <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: '14px' }}>
                {active.map(app => (
                  <ApplicantCard key={app.id} app={app} c={c} onAction={handleAction} onViewStudent={setViewingStudent} onSetSlots={handleSetSlots} updating={updating} />
                ))}
              </div>
            )
          ) : (
            closed.length === 0 ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: c.txt3, margin: 0 }}>No closed applications for this job yet.</p>
              </div>
            ) : (
              <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: '14px' }}>
                {closed.map(app => (
                  <ClosedApplicantCard key={app.id} app={app} c={c} onViewStudent={setViewingStudent} />
                ))}
              </div>
            )
          )}
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}
