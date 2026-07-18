import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import CompanyLayout from '../../components/layouts/CompanyLayout';
import { useTheme } from '../../context/ThemeContext';
import {
  CheckCircle, Users, ChevronRight, Gift, Trophy, Filter, X
} from 'lucide-react';
import StudentProfileModal from '../../components/StudentProfileModal';
import JobDetailModal from '../../components/JobDetailModal';
import { ApplicantCard, ClosedApplicantCard, PIPELINE } from '../../components/ApplicantPipelineParts';
import { useApplicantPipeline } from '../../hooks/useApplicantPipeline';

const ACTIVE_STATUSES = ['PENDING', 'ACCEPTED', 'OFFERED'];
const CLOSED_STATUSES = ['HIRED', 'REJECTED', 'WITHDRAWN', 'AUTO_REJECTED', 'OFFER_ACCEPTED', 'OFFER_REJECTED'];
// Explicit, directive-specified option list for the closed tab — narrower
// than the full CLOSED_STATUSES above, which also includes two legacy
// statuses (OFFER_ACCEPTED/OFFER_REJECTED) that aren't meant to appear here.
const CLOSED_STATUS_OPTIONS = ['HIRED', 'REJECTED', 'WITHDRAWN', 'AUTO_REJECTED'];

export default function CompanyATS() {
  const { c } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const { apps, loading, updating, handleAction, handleSetSlots } = useApplicantPipeline();
  const [myJobs, setMyJobs] = useState([]);
  const [archivedJobs, setArchivedJobs] = useState([]);
  const [tab, setTab] = useState('active'); // 'active' | 'closed'
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewingStudent, setViewingStudent] = useState(null); // { id, name, resumeSnapshot }
  const [viewingJobDetail, setViewingJobDetail] = useState(null); // { job, readOnly }

  // Job filter is fully URL-driven — auto-selects when arriving with ?jobId=... from
  // Manage Jobs, and stays in sync if the user changes the dropdown or the URL directly.
  const jobFilter = searchParams.get('jobId') || 'all';

  const setJobFilter = (value) => {
    if (value === 'all') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ jobId: value }, { replace: true });
    }
  };

  useEffect(() => {
    api.get('/company/jobs').then(res => setMyJobs(res.data)).catch(console.error);
    api.get('/company/jobs/archived').then(res => setArchivedJobs(res.data)).catch(console.error);
  }, []);

  // Scope everything below to the selected job — "All Jobs" keeps the full list.
  const scopedApps = jobFilter === 'all' ? apps : apps.filter(a => a.JobPosting?.id === jobFilter);

  const active = scopedApps.filter(a => ACTIVE_STATUSES.includes(a.status) && (statusFilter === 'all' || a.status === statusFilter));
  const closed = scopedApps.filter(a => CLOSED_STATUSES.includes(a.status) && (statusFilter === 'all' || a.status === statusFilter));

  // Company-wide active count, independent of the current job filter — used
  // for the "All Jobs" dropdown option, which must always reflect the total
  // across every job regardless of which one is currently selected.
  const totalActiveCount = apps.filter(a => ACTIVE_STATUSES.includes(a.status)).length;

  const pendingCount  = scopedApps.filter(a => a.status === 'PENDING').length;
  const acceptedCount = scopedApps.filter(a => a.status === 'ACCEPTED').length;
  const offeredCount  = scopedApps.filter(a => a.status === 'OFFERED').length;
  const hiredCount    = scopedApps.filter(a => a.status === 'HIRED').length;

  const selectedJob = jobFilter !== 'all' ? myJobs.find(j => j.id === jobFilter) : null;

  return (
    <CompanyLayout>
      {viewingStudent && (
        <StudentProfileModal
          studentId={viewingStudent.id}
          studentName={viewingStudent.name}
          resumeSnapshot={viewingStudent.resumeSnapshot}
          onClose={() => setViewingStudent(null)}
        />
      )}
      {viewingJobDetail && (
        <JobDetailModal
          job={viewingJobDetail.job}
          onClose={() => setViewingJobDetail(null)}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 className="page-title">
          Applicant Pipeline
          {selectedJob && (
            <span style={{ fontSize: '14px', fontWeight: '500', color: c.txt3, marginLeft: '10px' }}>
              — {selectedJob.title}
            </span>
          )}
        </h1>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span className="badge badge-amber"><Users size={10} />{pendingCount} Pending</span>
          <span className="badge badge-blue"><ChevronRight size={10} />{acceptedCount} Interviewing</span>
          <span className="badge badge-green"><Gift size={10} />{offeredCount} Offered</span>
          <span className="badge badge-green"><Trophy size={10} />{hiredCount} Hired</span>
        </div>
      </div>

      {/* Filter by Job / Filter by Status */}
      <div className="ats-filter-row" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Filter size={13} style={{ color: c.txt3, flexShrink: 0 }} />
          <label style={{ fontSize: '12px', fontWeight: '600', color: c.txt2, flexShrink: 0 }}>Filter by Job:</label>
          <select
            className="input ats-filter-select"
            value={jobFilter}
            onChange={e => setJobFilter(e.target.value)}
            style={{ maxWidth: '320px', width: 'auto' }}>
            <option value="all">All Jobs ({totalActiveCount})</option>
            {myJobs.length > 0 && (
              <optgroup label="Active Jobs">
                {myJobs.map(job => {
                  const count = apps.filter(a => a.JobPosting?.id === job.id && ACTIVE_STATUSES.includes(a.status)).length;
                  return <option key={job.id} value={job.id}>{job.title} ({count})</option>;
                })}
              </optgroup>
            )}
            {archivedJobs.length > 0 && (
              <optgroup label="Archived Jobs">
                {archivedJobs.map(job => {
                  const count = apps.filter(a => a.JobPosting?.id === job.id && ACTIVE_STATUSES.includes(a.status)).length;
                  return <option key={job.id} value={job.id}>{job.title} ({count})</option>;
                })}
              </optgroup>
            )}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: c.txt2, flexShrink: 0 }}>Filter by Status:</label>
          <select
            className="input ats-filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ maxWidth: '220px', width: 'auto' }}>
            <option value="all">{tab === 'active' ? 'All Active' : 'All Closed'}</option>
            {(tab === 'active' ? ACTIVE_STATUSES : CLOSED_STATUS_OPTIONS).map(s => (
              <option key={s} value={s}>{PIPELINE[s]?.label || s}</option>
            ))}
          </select>
        </div>

        {(jobFilter !== 'all' || statusFilter !== 'all') && (
          <button onClick={() => { setJobFilter('all'); setStatusFilter('all'); }} className="btn btn-ghost btn-sm" style={{ color: c.txt3 }}>
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '24px', borderBottom: `1px solid ${c.border}` }}>
        {[['active', 'Active Pipeline'], ['closed', 'Closed']].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setStatusFilter('all'); }} style={{
            padding: '8px 16px', fontSize: '13px', fontWeight: tab === key ? '700' : '500',
            color: tab === key ? c.red : c.txt3,
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: tab === key ? `2px solid ${c.red}` : '2px solid transparent',
            marginBottom: '-1px', transition: 'all 0.15s',
          }}>
            {label} ({key === 'active' ? active.length : closed.length})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: '28px', height: '28px', border: `3px solid ${c.border}`, borderTopColor: c.red, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : tab === 'active' ? (
        <div>
          {active.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <CheckCircle size={32} style={{ color: c.green, margin: '0 auto 12px' }} />
              <p style={{ fontSize: '14px', color: c.txt3, margin: 0 }}>No active applications in the pipeline.</p>
            </div>
          ) : (
            <div className="ats-applicant-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '14px' }}>
              {active.map(app => (
                <ApplicantCard key={app.id} app={app} c={c} onAction={handleAction} onViewStudent={setViewingStudent} onSetSlots={handleSetSlots} updating={updating} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '14px' }}>
          {closed.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <p style={{ fontSize: '13px', color: c.txt3, margin: 0 }}>No closed applications yet.</p>
            </div>
          ) : closed.map(app => (
            <ClosedApplicantCard key={app.id} app={app} c={c} onViewStudent={setViewingStudent} />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </CompanyLayout>
  );
}
