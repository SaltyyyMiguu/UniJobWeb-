import { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../../api/axios';
import StudentLayout from '../../components/layouts/StudentLayout';
import { useTheme } from '../../context/ThemeContext';
import {
  CheckCircle, XCircle, Clock, Briefcase, MapPin,
  PartyPopper, AlertCircle, Trophy, Gift, Calendar, LogOut, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import CompanyProfileModal from '../../components/CompanyProfileModal';
import { usePdfViewer } from '../../hooks/usePdfViewer';
import PdfViewerModal from '../../components/PdfViewerModal';

const STATUS = {
  PENDING:       { label: 'Under Review',          icon: Clock,         badgeClass: 'badge-amber',  color: '#B45309' },
  ACCEPTED:      { label: 'Invited to Interview',  icon: PartyPopper,   badgeClass: 'badge-blue',   color: '#1D4ED8' },
  OFFERED:       { label: 'Offer Received!',       icon: Gift,          badgeClass: 'badge-green',  color: '#1A7F5A' },
  HIRED:         { label: 'Hired ✓',              icon: Trophy,        badgeClass: 'badge-green',  color: '#059669' },
  REJECTED:      { label: 'Not Selected',          icon: XCircle,       badgeClass: 'badge-red',    color: '#EF4444' },
  WITHDRAWN:     { label: 'Withdrawn',             icon: AlertCircle,   badgeClass: 'badge-muted',  color: '#6B7280' },
  AUTO_REJECTED: { label: 'Offer Expired',         icon: AlertCircle,   badgeClass: 'badge-muted',  color: '#6B7280' },
  // Legacy
  OFFER_ACCEPTED:{ label: 'Confirmed (legacy)',    icon: CheckCircle,   badgeClass: 'badge-green',  color: '#1A7F5A' },
  OFFER_REJECTED:{ label: 'Declined (legacy)',     icon: AlertCircle,   badgeClass: 'badge-muted',  color: '#6B7280' },
};

function getDaysLeft(expiresAt) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function OfferedBanner({ app, onAcceptOffer, onDeclineOffer, responding, c }) {
  const daysLeft = getDaysLeft(app.offerExpiresAt);
  const isResponding = responding === app.id;
  const { viewerUrl, viewerTitle, openPdf, closePdf } = usePdfViewer();
  return (
    <div style={{
      marginTop: '12px', padding: '14px 16px',
      background: 'linear-gradient(135deg, rgba(26,127,90,0.08) 0%, rgba(26,127,90,0.04) 100%)',
      border: '1px solid rgba(26,127,90,0.3)',
    }}>
      {viewerUrl && <PdfViewerModal url={viewerUrl} title={viewerTitle} onClose={closePdf} />}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
        <Gift size={16} style={{ color: c.green, flexShrink: 0, marginTop: '2px' }} />
        <div>
          <p style={{ fontSize: '13px', fontWeight: '700', color: c.txt1, margin: 0 }}>
            You have received a formal offer!
          </p>
          <p style={{ fontSize: '12px', color: c.txt2, margin: '3px 0 0' }}>
            <strong>{app.JobPosting?.Company?.companyName}</strong> has extended an offer for{' '}
            <strong>{app.JobPosting?.title}</strong>.
            {daysLeft !== null && (
              <span style={{ color: daysLeft <= 2 ? '#EF4444' : '#B45309', fontWeight: '700', marginLeft: '6px' }}>
                {daysLeft === 0 ? 'Expires today!' : `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`}
              </span>
            )}
          </p>
        </div>
      </div>
      {app.offerLetterUrl && (
        <a href={`${API_BASE_URL}/${app.offerLetterUrl}`} target="_blank" rel="noreferrer"
          onClick={e => { if (window.innerWidth <= 768) { e.preventDefault(); openPdf(`${API_BASE_URL}/${app.offerLetterUrl}`, 'Offer Letter'); } }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: c.green, fontWeight: '600', padding: '6px 12px', border: '1px solid rgba(26,127,90,0.3)', background: 'rgba(26,127,90,0.07)', marginBottom: '10px', cursor: 'pointer', textDecoration: 'none' }}>
          View Offer Letter PDF
        </a>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onAcceptOffer(app.id)}
          disabled={isResponding}
          className="btn btn-primary btn-sm"
          style={{ flex: 1, justifyContent: 'center', background: c.green, borderColor: c.green }}>
          <CheckCircle size={13} /> {isResponding ? 'Please wait…' : 'Accept Offer'}
        </button>
        <button
          onClick={() => onDeclineOffer(app.id)}
          disabled={isResponding}
          className="btn btn-outline btn-sm"
          style={{ color: '#EF4444', borderColor: '#EF4444', flexShrink: 0 }}>
          <XCircle size={12} /> Decline
        </button>
      </div>
    </div>
  );
}

function AcceptedBanner({ app, onWithdraw, withdrawing, onConfirmSlot, c }) {
  const slots = app.interviewSlots || [];
  const [selectedSlot, setSelectedSlot] = useState(app.confirmedSlot || '');
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setConfirming(true);
    try { await onConfirmSlot(app.id, selectedSlot); }
    finally { setConfirming(false); }
  };

  return (
    <div style={{
      marginTop: '12px', padding: '14px 16px',
      background: 'linear-gradient(135deg, rgba(29,78,216,0.06) 0%, rgba(29,78,216,0.02) 100%)',
      border: '1px solid rgba(29,78,216,0.25)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
        <PartyPopper size={16} style={{ color: '#1D4ED8', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <p style={{ fontSize: '13px', fontWeight: '700', color: c.txt1, margin: 0 }}>
            You've been invited to an interview!
          </p>
          <p style={{ fontSize: '12px', color: c.txt2, margin: '3px 0 0' }}>
            <strong>{app.JobPosting?.Company?.companyName}</strong> has invited you to interview for{' '}
            <strong>{app.JobPosting?.title}</strong>.
          </p>
        </div>
      </div>

      {/* Interview slot selection */}
      {slots.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: c.txt2, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={12} /> Available Interview Slots — pick one:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
            {slots.map(slot => {
              const isConfirmed = app.confirmedSlot === slot;
              const isSelected = selectedSlot === slot;
              return (
                <label key={slot} className="interview-slot-label" style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 12px',
                  background: isSelected ? 'rgba(29,78,216,0.1)' : c.surface2,
                  border: `1px solid ${isSelected ? 'rgba(29,78,216,0.4)' : c.border}`,
                  cursor: app.confirmedSlot ? 'default' : 'pointer',
                  fontSize: '12px', color: c.txt1, fontWeight: isConfirmed ? '700' : '500',
                }}>
                  {!app.confirmedSlot && (
                    <input type="radio" name={`slot-${app.id}`} value={slot}
                      checked={isSelected} onChange={() => setSelectedSlot(slot)}
                      style={{ margin: 0, accentColor: '#1D4ED8' }} />
                  )}
                  {isConfirmed && <CheckCircle size={14} style={{ color: '#1D4ED8', flexShrink: 0 }} />}
                  <span>{new Date(slot).toLocaleString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  {isConfirmed && <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#1D4ED8', fontWeight: '700' }}>Confirmed ✓</span>}
                </label>
              );
            })}
          </div>
          {!app.confirmedSlot && selectedSlot && (
            <button onClick={handleConfirm} disabled={confirming} className="btn btn-sm interview-confirm-btn"
              style={{ background: '#1D4ED8', color: '#fff', border: 'none' }}>
              <Calendar size={12} /> {confirming ? 'Confirming…' : 'Confirm This Slot'}
            </button>
          )}
        </div>
      )}

      {slots.length === 0 && !app.confirmedSlot && (
        <p style={{ fontSize: '12px', color: c.txt3, margin: '0 0 12px', fontStyle: 'italic' }}>
          The company will propose interview time slots shortly. Check back or message them directly.
        </p>
      )}

      <button
        onClick={() => onWithdraw(app.id)}
        disabled={withdrawing === app.id}
        className="btn btn-outline btn-sm"
        style={{ color: '#EF4444', borderColor: '#EF4444' }}>
        <LogOut size={12} />
        {withdrawing === app.id ? 'Withdrawing…' : 'Withdraw Application'}
      </button>
    </div>
  );
}

function WithdrawButton({ app, onWithdraw, withdrawing, c }) {
  return (
    <div className="mobile-app-actions" style={{ marginTop: '10px' }}>
      <button
        onClick={() => onWithdraw(app.id)}
        disabled={withdrawing === app.id}
        className="btn btn-outline btn-sm"
        style={{ color: '#EF4444', borderColor: '#EF4444', fontSize: '11px' }}>
        <LogOut size={11} />
        {withdrawing === app.id ? 'Withdrawing…' : 'Withdraw Application'}
      </button>
    </div>
  );
}

function ConfirmModal({ onConfirm, onCancel, c, message, confirmLabel = 'Yes, Withdraw', confirmColor = '#EF4444', icon: Icon = AlertCircle }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div className="card compact-modal-panel" style={{ width: '100%', maxWidth: '360px', padding: '28px' }}>
        <Icon size={24} style={{ color: confirmColor, marginBottom: '12px' }} />
        <p style={{ fontSize: '14px', color: c.txt1, marginBottom: '20px', lineHeight: '1.6' }}>
          {message || 'Are you sure you want to withdraw this application? This cannot be undone.'}
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onCancel} className="btn btn-outline btn-sm" style={{ flex: 1 }}>Keep It</button>
          <button onClick={onConfirm} className="btn btn-sm" style={{ flex: 1, background: confirmColor, color: '#fff', border: 'none', justifyContent: 'center' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentApplications() {
  const { c } = useTheme();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(null); // reused as "responding" for accept/decline too
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'withdraw'|'accept'|'decline', appId }
  const [tab, setTab] = useState('active'); // 'active' | 'history'
  const [viewingCompany, setViewingCompany] = useState(null); // { id, name }
  const { viewerUrl, viewerTitle, openPdf, closePdf } = usePdfViewer();

  const fetchApps = () =>
    api.get('/student/applications')
      .then(r => setApps(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { fetchApps(); }, []);

  const handleWithdraw = (appId) => setConfirmAction({ type: 'withdraw', appId });
  const handleAcceptOffer = (appId) => setConfirmAction({ type: 'accept', appId });
  const handleDeclineOffer = (appId) => setConfirmAction({ type: 'decline', appId });

  const handleConfirmSlot = async (appId, slot) => {
    try {
      await api.put(`/student/applications/${appId}/confirm-slot`, { slot });
      toast.success('Interview slot confirmed!');
      fetchApps();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm slot.');
    }
  };

  const RESPONSE_FOR_TYPE = { withdraw: 'WITHDRAWN', accept: 'HIRED', decline: 'REJECTED' };
  const SUCCESS_MESSAGE   = { withdraw: 'Application withdrawn.', accept: 'Offer accepted — congratulations!', decline: 'Offer declined.' };
  const FAILURE_MESSAGE   = { withdraw: 'Failed to withdraw.', accept: 'Failed to accept offer.', decline: 'Failed to decline offer.' };

  const executeConfirmedAction = async () => {
    const { type, appId } = confirmAction;
    setConfirmAction(null);
    setWithdrawing(appId);
    try {
      await api.put(`/student/applications/${appId}`, { response: RESPONSE_FOR_TYPE[type] });
      toast.success(SUCCESS_MESSAGE[type]);
      fetchApps();
    } catch (err) {
      toast.error(err.response?.data?.message || FAILURE_MESSAGE[type]);
    } finally {
      setWithdrawing(null);
    }
  };

  const ACTIVE_STATUSES  = ['OFFERED', 'ACCEPTED', 'PENDING'];
  const HISTORY_STATUSES = ['HIRED', 'REJECTED', 'WITHDRAWN', 'AUTO_REJECTED', 'OFFER_ACCEPTED', 'OFFER_REJECTED'];

  const offeredApps  = apps.filter(a => a.status === 'OFFERED');
  const acceptedApps = apps.filter(a => a.status === 'ACCEPTED');
  const pendingApps  = apps.filter(a => a.status === 'PENDING');
  const historyApps  = apps.filter(a => HISTORY_STATUSES.includes(a.status));

  const activeCount  = offeredApps.length + acceptedApps.length;

  return (
    <StudentLayout>
      {confirmAction && (
        <ConfirmModal c={c}
          onConfirm={executeConfirmedAction}
          onCancel={() => setConfirmAction(null)}
          message={
            confirmAction.type === 'accept'
              ? 'Accept this offer? This will confirm your hire, decline your other active applications automatically, and cannot be undone.'
              : confirmAction.type === 'decline'
                ? 'Decline this offer? This cannot be undone.'
                : 'Are you sure you want to withdraw this application? This cannot be undone.'
          }
          confirmLabel={confirmAction.type === 'accept' ? 'Yes, Accept' : confirmAction.type === 'decline' ? 'Yes, Decline' : 'Yes, Withdraw'}
          confirmColor={confirmAction.type === 'accept' ? c.green : '#EF4444'}
          icon={confirmAction.type === 'accept' ? CheckCircle : AlertCircle}
        />
      )}
      {viewingCompany && (
        <CompanyProfileModal
          companyId={viewingCompany.id}
          companyName={viewingCompany.name}
          onClose={() => setViewingCompany(null)}
        />
      )}
      {viewerUrl && <PdfViewerModal url={viewerUrl} title={viewerTitle} onClose={closePdf} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 className="page-title">My Applications</h1>
          {!loading && (
            <p style={{ fontSize: '12px', color: c.txt3, margin: '4px 0 0' }}>
              {apps.length} application{apps.length !== 1 ? 's' : ''}
              {activeCount > 0 && (
                <span style={{ marginLeft: '8px', color: c.green, fontWeight: '700' }}>
                  · {activeCount} requiring attention
                </span>
              )}
            </p>
          )}
        </div>
        {activeCount > 0 && (
          <span style={{ padding: '4px 10px', background: 'rgba(26,127,90,0.1)', color: c.green, fontSize: '11px', fontWeight: '700', border: '1px solid rgba(26,127,90,0.3)' }}>
            {offeredApps.length > 0 ? `🎉 ${offeredApps.length} Offer${offeredApps.length > 1 ? 's' : ''}` : `📋 ${acceptedApps.length} Interview${acceptedApps.length > 1 ? 's' : ''}`}
          </span>
        )}
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', borderBottom: `1px solid ${c.border}` }}>
        {[['active', `Active (${ACTIVE_STATUSES.reduce((n, s) => n + apps.filter(a => a.status === s).length, 0)})`], ['history', `History (${historyApps.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
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

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: '28px', height: '28px', border: `3px solid ${c.border}`, borderTopColor: c.red, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : tab === 'active' ? (
        <>
          {apps.filter(a => ACTIVE_STATUSES.includes(a.status)).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Briefcase size={40} style={{ color: c.border, margin: '0 auto 12px' }} />
              <p style={{ color: c.txt3, fontSize: '14px', margin: 0 }}>No active applications.</p>
              <p style={{ color: c.txt3, fontSize: '12px', margin: '4px 0 0' }}>Browse internships and submit your first application!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {offeredApps.length > 0 && (
                <section>
                  <p className="section-label" style={{ marginBottom: '8px' }}>🎉 Offers Pending Response</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                    {offeredApps.map(app => (
                      <ApplicationCard key={app.id} app={app} c={c} onWithdraw={handleWithdraw} withdrawing={withdrawing} onViewCompany={setViewingCompany} onConfirmSlot={handleConfirmSlot} onAcceptOffer={handleAcceptOffer} onDeclineOffer={handleDeclineOffer} />
                    ))}
                  </div>
                </section>
              )}
              {acceptedApps.length > 0 && (
                <section>
                  <p className="section-label" style={{ marginBottom: '8px' }}>📋 Interview Invitations</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                    {acceptedApps.map(app => (
                      <ApplicationCard key={app.id} app={app} c={c} onWithdraw={handleWithdraw} withdrawing={withdrawing} onViewCompany={setViewingCompany} onConfirmSlot={handleConfirmSlot} onAcceptOffer={handleAcceptOffer} onDeclineOffer={handleDeclineOffer} />
                    ))}
                  </div>
                </section>
              )}
              {pendingApps.length > 0 && (
                <section>
                  <p className="section-label" style={{ marginBottom: '8px' }}>⏳ Pending Review</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pendingApps.map(app => (
                      <ApplicationCard key={app.id} app={app} c={c} onWithdraw={handleWithdraw} withdrawing={withdrawing} onViewCompany={setViewingCompany} onConfirmSlot={handleConfirmSlot} onAcceptOffer={handleAcceptOffer} onDeclineOffer={handleDeclineOffer} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      ) : (
        /* History tab */
        <div>
          {historyApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: c.txt3, fontSize: '13px' }}>No closed applications yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {historyApps.map(app => {
                const cfg = STATUS[app.status] || STATUS.REJECTED;
                const Icon = cfg.icon;
                const logoSrc = app.JobPosting?.Company?.profileImageUrl ? `${API_BASE_URL}/${app.JobPosting.Company.profileImageUrl}` : null;
                return (
                  <div key={app.id} className="card mobile-app-card" style={{ padding: '16px 20px', opacity: ['WITHDRAWN', 'AUTO_REJECTED'].includes(app.status) ? 0.7 : 1 }}>
                    <span className={`badge ${cfg.badgeClass}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Icon size={10} />{cfg.label}
                    </span>
                    <div className="mobile-app-header" style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                      <div className="app-card-logo" style={{ width: '40px', height: '40px', background: logoSrc ? 'transparent' : c.red, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '15px', flexShrink: 0, overflow: 'hidden' }}>
                        {logoSrc ? <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : app.JobPosting?.Company?.companyName?.[0] || 'C'}
                      </div>
                      <div className="app-card-info" style={{ minWidth: 0 }}>
                        <p className="mobile-app-title" style={{ fontSize: '14px', fontWeight: '700', color: c.txt1, margin: 0 }}>{app.JobPosting?.title}</p>
                        <p style={{ fontSize: '12px', color: c.red, margin: '2px 0 0', fontWeight: '600' }}>{app.JobPosting?.Company?.companyName}</p>
                        <div className="app-card-meta" style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', color: c.txt3 }}>{app.JobPosting?.category}</span>
                          <span style={{ fontSize: '11px', color: c.txt3 }}>Applied {new Date(app.createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                    {(app.resumeSnapshot || app.offerLetterUrl) && (
                      <div className="mobile-app-actions app-card-status-actions">
                        {/* Resume snapshot link */}
                        {app.resumeSnapshot && (
                          <a className="mobile-app-resume-link" href={`${API_BASE_URL}/${app.resumeSnapshot}`} target="_blank" rel="noreferrer"
                            onClick={e => { if (window.innerWidth <= 768) { e.preventDefault(); openPdf(`${API_BASE_URL}/${app.resumeSnapshot}`, 'Resume (at time of apply)'); } }}
                            style={{ fontSize: '11px', color: c.green, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                            📄 Resume (at time of apply)
                          </a>
                        )}
                        {/* Offer letter link */}
                        {app.offerLetterUrl && (
                          <a className="mobile-app-resume-link" href={`${API_BASE_URL}/${app.offerLetterUrl}`} target="_blank" rel="noreferrer"
                            onClick={e => { if (window.innerWidth <= 768) { e.preventDefault(); openPdf(`${API_BASE_URL}/${app.offerLetterUrl}`, 'Offer Letter'); } }}
                            style={{ fontSize: '11px', color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                            📋 Offer Letter
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </StudentLayout>
  );
}

function ApplicationCard({ app, c, onWithdraw, withdrawing, onViewCompany, onConfirmSlot, onAcceptOffer, onDeclineOffer }) {
  const cfg = STATUS[app.status] || STATUS.PENDING;
  const Icon = cfg.icon;
  const logoSrc = app.JobPosting?.Company?.profileImageUrl
    ? `${API_BASE_URL}/${app.JobPosting.Company.profileImageUrl}`
    : null;
  const logoLetter = app.JobPosting?.Company?.companyName?.[0] || 'C';

  const borderColor =
    app.status === 'OFFERED'   ? c.green :
    app.status === 'ACCEPTED'  ? '#1D4ED8' :
    app.status === 'HIRED'     ? '#059669' :
    ['REJECTED', 'AUTO_REJECTED'].includes(app.status) ? '#EF4444' :
    c.border;

  return (
    <div className="card mobile-app-card" style={{ padding: '16px 20px', borderLeft: `3px solid ${borderColor}` }}>
      <span className={`badge ${cfg.badgeClass}`} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
        <Icon size={10} />{cfg.label}
      </span>
      <div className="mobile-app-header" style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        <div className="app-card-logo" style={{ width: '42px', height: '42px', background: logoSrc ? 'transparent' : c.red, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '16px', flexShrink: 0, overflow: 'hidden' }}>
          {logoSrc
            ? <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : logoLetter}
        </div>
        <div className="app-card-info" style={{ minWidth: 0 }}>
          <p className="mobile-app-title" style={{ fontSize: '14px', fontWeight: '700', color: c.txt1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {app.JobPosting?.title}
          </p>
          <button
            onClick={() => onViewCompany({ id: app.JobPosting?.Company?.id, name: app.JobPosting?.Company?.companyName })}
            style={{ fontSize: '12px', color: c.red, margin: '2px 0 0', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '3px' }}>
            {app.JobPosting?.Company?.companyName}
            <Building2 size={10} style={{ opacity: 0.6 }} />
          </button>
          <div className="app-card-meta" style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: c.txt3 }}>{app.JobPosting?.category}</span>
            {app.JobPosting?.location && (
              <span style={{ fontSize: '11px', color: c.txt3, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <MapPin size={10} />{app.JobPosting.location}
              </span>
            )}
            <span style={{ fontSize: '11px', color: c.txt3 }}>
              Applied {new Date(app.createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Context banners */}
      <div className="app-card-status-actions">
        {app.status === 'OFFERED' && (
          <OfferedBanner app={app} onAcceptOffer={onAcceptOffer} onDeclineOffer={onDeclineOffer} responding={withdrawing} c={c} />
        )}
        {app.status === 'ACCEPTED' && (
          <AcceptedBanner app={app} onWithdraw={onWithdraw} withdrawing={withdrawing} onConfirmSlot={onConfirmSlot} c={c} />
        )}
        {app.status === 'PENDING' && (
          <WithdrawButton app={app} onWithdraw={onWithdraw} withdrawing={withdrawing} c={c} />
        )}
        {app.status === 'HIRED' && (
          <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={14} style={{ color: '#059669' }} />
            <p style={{ fontSize: '12px', color: '#059669', fontWeight: '600', margin: 0 }}>
              Congratulations! You have been officially hired for this position.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
