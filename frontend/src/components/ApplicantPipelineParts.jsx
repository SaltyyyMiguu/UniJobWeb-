import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  CheckCircle, XCircle, FileText, User, GraduationCap, Mail, Hash,
  Briefcase, Clock, Send, Trophy, AlertTriangle, Calendar,
  ChevronRight, Loader2, Gift, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePdfViewer } from '../hooks/usePdfViewer';
import PdfViewerModal from './PdfViewerModal';
import { resolveFileUrl } from '../api/axios';

// Pipeline stages: which actions are available from each status
export const PIPELINE = {
  PENDING:  { label: 'Pending Review',         badgeClass: 'badge-amber',  next: ['ACCEPTED', 'REJECTED'] },
  ACCEPTED: { label: 'Interview Invited',       badgeClass: 'badge-blue',   next: ['OFFERED', 'REJECTED'] },
  OFFERED:  { label: 'Offer Extended',          badgeClass: 'badge-green',  next: ['HIRED', 'REJECTED'] },
  HIRED:    { label: 'Hired ✓',                badgeClass: 'badge-green',  next: [] },
  REJECTED: { label: 'Rejected',               badgeClass: 'badge-red',    next: [] },
  WITHDRAWN:{ label: 'Withdrawn',              badgeClass: 'badge-muted',  next: [] },
  AUTO_REJECTED: { label: 'Offer Expired',     badgeClass: 'badge-muted',  next: [] },
  // Legacy
  OFFER_ACCEPTED: { label: 'Offer Accepted (legacy)', badgeClass: 'badge-green', next: [] },
  OFFER_REJECTED: { label: 'Offer Declined (legacy)', badgeClass: 'badge-muted', next: [] },
  // University placement review (post-HIRED)
  APPROVED_BY_UNI: { label: 'Placement Approved ✓', badgeClass: 'badge-green', next: [] },
  REJECTED_BY_UNI: { label: 'Placement Rejected',    badgeClass: 'badge-red',   next: [] },
};

export function OfferModal({ app, onClose, onSubmit, submitting }) {
  const { c } = useTheme();
  const [days, setDays] = useState(7);
  const [offerFile, setOfferFile] = useState(null);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div className="card compact-modal-panel" style={{ width: '100%', maxWidth: '420px', padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Gift size={20} style={{ color: c.green }} />
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: c.txt1, margin: 0 }}>Extend Offer</h2>
        </div>
        <p style={{ fontSize: '13px', color: c.txt2, marginBottom: '16px', lineHeight: '1.5' }}>
          Extending offer to <strong>{app.Student?.firstName} {app.Student?.lastName}</strong> for{' '}
          <strong>{app.JobPosting?.title}</strong>.
        </p>
        <label style={{ fontSize: '12px', fontWeight: '600', color: c.txt2, display: 'block', marginBottom: '6px' }}>
          Offer Expiry (days from now)
        </label>
        <input
          type="number" min="1" max="30" value={days}
          onChange={e => setDays(Math.max(1, parseInt(e.target.value) || 7))}
          className="input" style={{ marginBottom: '16px', width: '100%' }}
        />
        <label style={{ fontSize: '12px', fontWeight: '600', color: c.txt2, display: 'block', marginBottom: '6px' }}>
          Offer Letter PDF <span style={{ fontWeight: '400', color: c.txt3 }}>(optional)</span>
        </label>
        <input
          type="file" accept="application/pdf"
          onChange={e => setOfferFile(e.target.files?.[0] || null)}
          style={{ fontSize: '12px', color: c.txt2, marginBottom: '16px', width: '100%' }}
        />
        {offerFile && <p style={{ fontSize: '11px', color: c.green, margin: '-10px 0 14px' }}>📎 {offerFile.name}</p>}
        <p style={{ fontSize: '11px', color: c.txt3, marginBottom: '20px' }}>
          If the candidate does not respond by then, the offer will automatically expire.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onClose} className="btn btn-outline btn-sm" style={{ flex: 1 }}>Cancel</button>
          <button
            onClick={() => onSubmit('OFFERED', days, offerFile)}
            disabled={submitting}
            className="btn btn-sm"
            style={{ flex: 1, background: c.green, color: '#fff', border: 'none', justifyContent: 'center' }}>
            {submitting ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={12} />}
            {submitting ? 'Sending…' : 'Send Offer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  const { c } = useTheme();
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div className="card compact-modal-panel" style={{ width: '100%', maxWidth: '360px', padding: '28px' }}>
        <AlertTriangle size={24} style={{ color: danger ? '#EF4444' : '#B45309', marginBottom: '12px' }} />
        <p style={{ fontSize: '14px', color: c.txt1, marginBottom: '20px', lineHeight: '1.6' }}>{message}</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onCancel} className="btn btn-outline btn-sm" style={{ flex: 1 }}>Cancel</button>
          <button
            onClick={onConfirm}
            className="btn btn-sm"
            style={{ flex: 1, background: danger ? '#EF4444' : c.red, color: '#fff', border: 'none', justifyContent: 'center' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function InterviewSlotPicker({ app, onSave, onClose }) {
  const { c } = useTheme();
  const [slots, setSlots] = useState(app.interviewSlots?.length ? app.interviewSlots : ['', '', '']);
  const [saving, setSaving] = useState(false);

  const updateSlot = (i, val) => setSlots(s => s.map((v, idx) => idx === i ? val : v));

  const handleSave = async () => {
    const valid = slots.filter(s => s.trim());
    if (valid.length === 0) return toast.error('Add at least one slot.');
    setSaving(true);
    try { await onSave(valid); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="card compact-modal-panel" style={{ width: '100%', maxWidth: '420px', padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Calendar size={18} style={{ color: '#1D4ED8' }} />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: c.txt1, margin: 0 }}>Propose Interview Slots</h3>
        </div>
        <p style={{ fontSize: '12px', color: c.txt2, margin: '0 0 16px' }}>
          Offer up to 3 date/time options. {app.Student?.firstName} will pick one.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {slots.map((slot, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: c.txt3, width: '16px', flexShrink: 0 }}>{i + 1}.</span>
              <input type="datetime-local" className="input" value={slot}
                onChange={e => updateSlot(i, e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                style={{ flex: 1 }} />
              {slot && <button onClick={() => updateSlot(i, '')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.txt3, display: 'flex', padding: '2px' }}><Trash2 size={12} /></button>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onClose} className="btn btn-outline btn-sm" style={{ flex: 1 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-sm" style={{ flex: 1, background: '#1D4ED8', color: '#fff', border: 'none', justifyContent: 'center' }}>
            {saving ? 'Saving…' : <><Calendar size={12} /> Propose Slots</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ApplicantCard({ app, onAction, onViewStudent, onSetSlots, updating, c }) {
  const [showOfferModal, setShowOfferModal]     = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(null); // { status, label }
  const [showSlotPicker, setShowSlotPicker]     = useState(false);
  const { viewerUrl, viewerTitle, openPdf, closePdf } = usePdfViewer();
  const isUpdating = updating === app.id;

  const initial = `${app.Student?.firstName?.[0] || ''}${app.Student?.lastName?.[0] || ''}`.toUpperCase();
  const avatarSrc = app.Student?.profileImageUrl ? resolveFileUrl(app.Student.profileImageUrl) : null;
  const pipeline = PIPELINE[app.status] || PIPELINE.PENDING;

  const handleAction = (status, extraData = {}) => {
    if (status === 'OFFERED') {
      setShowOfferModal(true);
      return;
    }
    if (status === 'HIRED') {
      setShowConfirmModal({ status, label: 'Confirm Hire' });
      return;
    }
    if (status === 'REJECTED') {
      setShowConfirmModal({ status, label: 'Reject', danger: true });
      return;
    }
    onAction(app.id, status, extraData);
  };

  const submitOffer = (status, days, file) => {
    setShowOfferModal(false);
    onAction(app.id, status, { offerExpiresInDays: days, offerFile: file });
  };

  const submitConfirm = () => {
    const { status } = showConfirmModal;
    setShowConfirmModal(null);
    onAction(app.id, status);
  };

  return (
    <>
      {showOfferModal && (
        <OfferModal app={app} onClose={() => setShowOfferModal(false)}
          onSubmit={submitOffer} submitting={isUpdating} />
      )}
      {showSlotPicker && (
        <InterviewSlotPicker
          app={app}
          onClose={() => setShowSlotPicker(false)}
          onSave={(slots) => onSetSlots(app.id, slots)}
        />
      )}
      {showConfirmModal && (
        <ConfirmModal
          message={
            showConfirmModal.status === 'HIRED'
              ? `Confirm hiring ${app.Student?.firstName} ${app.Student?.lastName}? This will decrement positions left and auto-reject their other active applications.`
              : `Reject ${app.Student?.firstName} ${app.Student?.lastName}? This action cannot be undone.`
          }
          onConfirm={submitConfirm}
          onCancel={() => setShowConfirmModal(null)}
          confirmLabel={showConfirmModal.label}
          danger={showConfirmModal.danger}
        />
      )}
      {viewerUrl && <PdfViewerModal url={viewerUrl} title={viewerTitle} onClose={closePdf} />}

      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--red) 0%, #E05070 100%)' }} />
        <div style={{ padding: '16px' }}>
          {/* Student header */}
          <div className="applicant-card-header" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: avatarSrc ? 'transparent' : c.surface2, border: `2px solid ${c.border}`, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {avatarSrc
                ? <img src={avatarSrc} alt={initial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '16px', fontWeight: '700', color: c.red }}>{initial || <User size={18} />}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <button
                onClick={() => onViewStudent({ id: app.Student?.id, name: `${app.Student?.firstName} ${app.Student?.lastName}`, resumeSnapshot: app.resumeSnapshot })}
                style={{ fontSize: '15px', fontWeight: '700', color: c.txt1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {app.Student?.firstName} {app.Student?.lastName}
                <User size={11} style={{ opacity: 0.4 }} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <GraduationCap size={12} style={{ color: 'var(--red)', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', fontWeight: '600', color: c.txt2 }}>
                  {app.Student?.degreeProgram || 'Degree not set'}
                </span>
              </div>
            </div>
            <span className={`badge ${pipeline.badgeClass}`} style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
              {pipeline.label}
            </span>
          </div>

          {/* Applied for */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '10px' }}>
            <Briefcase size={12} style={{ color: c.red, flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '12px', fontWeight: '600', color: c.txt1, margin: 0, whiteSpace: 'normal', overflowWrap: 'break-word' }}>
              {app.JobPosting?.title}
              <span style={{ color: c.txt3, fontWeight: '400' }}> · {app.JobPosting?.category}</span>
              {app.JobPosting?.positionsLeft !== undefined && (
                <span style={{ color: '#B45309', fontWeight: '600' }}> · {app.JobPosting.positionsLeft} left</span>
              )}
            </p>
          </div>

          {/* Interview slot status for ACCEPTED */}
          {app.status === 'ACCEPTED' && (
            <div style={{ marginBottom: '10px' }}>
              {app.confirmedSlot ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={12} style={{ color: '#1D4ED8', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: '#1D4ED8', fontWeight: '600' }}>
                    Interview confirmed: {new Date(app.confirmedSlot).toLocaleString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ) : app.interviewSlots?.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={12} style={{ color: c.txt3, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: c.txt2 }}>{app.interviewSlots.length} slot{app.interviewSlots.length !== 1 ? 's' : ''} proposed — awaiting student confirmation</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Offer expiry if OFFERED */}
          {app.status === 'OFFERED' && app.offerExpiresAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Calendar size={12} style={{ color: c.green }} />
              <span style={{ fontSize: '12px', color: c.green, fontWeight: '600' }}>
                Offer expires {new Date(app.offerExpiresAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}

          {/* Details */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            {app.Student?.ucsiId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: c.txt2 }}>
                <Hash size={10} style={{ color: c.txt3 }} />{app.Student.ucsiId}
              </div>
            )}
            {app.Student?.User?.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: c.txt2 }}>
                <Mail size={10} style={{ color: c.txt3 }} />{app.Student.User.email}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: c.txt3 }}>
              <Clock size={10} />{new Date(app.createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Bottom-anchored action footer — Resume link + pipeline actions, all
           full-width and stacked on mobile via .applicant-card-actions. */}
        {((app.resumeSnapshot || app.Student?.resumeUrl) || pipeline.next.length > 0) && (
          <div className="applicant-card-actions" style={{ padding: '10px 16px', borderTop: `1px solid ${c.border}`, background: c.surface2, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(app.resumeSnapshot || app.Student?.resumeUrl) && (
              <a href={resolveFileUrl(app.resumeSnapshot || app.Student.resumeUrl)}
                target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: c.green, fontWeight: '600', padding: '6px 12px', border: `1px solid rgba(26,127,90,0.3)`, background: 'rgba(26,127,90,0.07)' }}
                onClick={e => {
                  e.stopPropagation();
                  if (window.innerWidth <= 768) {
                    e.preventDefault();
                    openPdf(resolveFileUrl(app.resumeSnapshot || app.Student.resumeUrl), `${app.Student?.firstName} ${app.Student?.lastName} — Resume`);
                  }
                }}>
                <FileText size={12} />View Resume PDF
              </a>
            )}
            {pipeline.next.includes('ACCEPTED') && (
              <button onClick={() => handleAction('ACCEPTED')} disabled={isUpdating}
                className="btn btn-sm" style={{ flex: 1, minWidth: '120px', background: '#1D4ED8', color: '#fff', border: 'none', justifyContent: 'center' }}>
                <ChevronRight size={12} /> Invite to Interview
              </button>
            )}
            {pipeline.next.includes('OFFERED') && (
              <>
                <button onClick={() => setShowSlotPicker(true)} disabled={isUpdating}
                  className="btn btn-outline btn-sm" style={{ minWidth: '130px', color: '#1D4ED8', borderColor: '#1D4ED8', justifyContent: 'center' }}>
                  <Calendar size={12} /> {app.interviewSlots?.length > 0 ? 'Edit Slots' : 'Schedule Interview'}
                </button>
                <button onClick={() => handleAction('OFFERED')} disabled={isUpdating}
                  className="btn btn-sm" style={{ flex: 1, minWidth: '120px', background: c.green, color: '#fff', border: 'none', justifyContent: 'center' }}>
                  <Gift size={12} /> Extend Offer
                </button>
              </>
            )}
            {pipeline.next.includes('HIRED') && (
              <button onClick={() => handleAction('HIRED')} disabled={isUpdating}
                className="btn btn-sm" style={{ flex: 1, minWidth: '120px', background: '#059669', color: '#fff', border: 'none', justifyContent: 'center' }}>
                <Trophy size={12} /> Confirm Hired
              </button>
            )}
            {pipeline.next.includes('REJECTED') && (
              <button onClick={() => handleAction('REJECTED')} disabled={isUpdating}
                className="btn btn-outline btn-sm" style={{ flex: 1, minWidth: '80px', color: '#EF4444', borderColor: '#EF4444', justifyContent: 'center' }}>
                <XCircle size={12} /> Reject
              </button>
            )}
            {isUpdating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: c.txt3 }}>
                <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> Updating…
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// Read-only card for HIRED/REJECTED/WITHDRAWN/AUTO_REJECTED applications — audit
// trail view with resume/offer letter access, no pipeline actions.
export function ClosedApplicantCard({ app, onViewStudent, c }) {
  const pipeline = PIPELINE[app.status] || PIPELINE.REJECTED;
  const initial = `${app.Student?.firstName?.[0] || ''}${app.Student?.lastName?.[0] || ''}`.toUpperCase();
  const avatarSrc = app.Student?.profileImageUrl ? resolveFileUrl(app.Student.profileImageUrl) : null;
  const hasResume = app.resumeSnapshot || app.Student?.resumeUrl;
  const { viewerUrl, viewerTitle, openPdf, closePdf } = usePdfViewer();

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {viewerUrl && <PdfViewerModal url={viewerUrl} title={viewerTitle} onClose={closePdf} />}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--red) 0%, #E05070 100%)' }} />
      <div style={{ padding: '16px' }}>
        {/* Student header */}
        <div className="applicant-card-header" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: avatarSrc ? 'transparent' : c.surface2, border: `2px solid ${c.border}`, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {avatarSrc
              ? <img src={avatarSrc} alt={initial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '16px', fontWeight: '700', color: c.red }}>{initial || <User size={18} />}</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <button
              onClick={() => onViewStudent({ id: app.Student?.id, name: `${app.Student?.firstName} ${app.Student?.lastName}`, resumeSnapshot: app.resumeSnapshot })}
              style={{ fontSize: '15px', fontWeight: '700', color: c.txt1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {app.Student?.firstName} {app.Student?.lastName}
              <User size={11} style={{ opacity: 0.4 }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <GraduationCap size={12} style={{ color: 'var(--red)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: '600', color: c.txt2 }}>
                {app.Student?.degreeProgram || 'Degree not set'}
              </span>
            </div>
          </div>
          <span className={`badge ${pipeline.badgeClass}`} style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
            {pipeline.label}
          </span>
        </div>

        {/* Job info */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
          <Briefcase size={12} style={{ color: c.red, flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '12px', fontWeight: '600', color: c.txt1, margin: 0, whiteSpace: 'normal', overflowWrap: 'break-word' }}>
            {app.JobPosting?.title}
            <span style={{ color: c.txt3, fontWeight: '400' }}> · {app.JobPosting?.category}</span>
          </p>
        </div>
      </div>

      {/* Bottom-anchored action footer — Resume/Offer-letter links, full-width
         and stacked on mobile via .applicant-card-actions. */}
      {(hasResume || app.offerLetterUrl) && (
        <div className="applicant-card-actions" style={{ padding: '10px 16px', borderTop: `1px solid ${c.border}`, background: c.surface2, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {hasResume && (
            <a href={resolveFileUrl(app.resumeSnapshot || app.Student.resumeUrl)}
              target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: c.green, fontWeight: '600', padding: '6px 12px', border: `1px solid rgba(26,127,90,0.3)`, background: 'rgba(26,127,90,0.07)' }}
              onClick={e => {
                e.stopPropagation();
                if (window.innerWidth <= 768) {
                  e.preventDefault();
                  openPdf(resolveFileUrl(app.resumeSnapshot || app.Student.resumeUrl), `${app.Student?.firstName} ${app.Student?.lastName} — Resume`);
                }
              }}>
              <FileText size={12} />View Resume PDF
            </a>
          )}
          {app.offerLetterUrl && (
            <a href={resolveFileUrl(app.offerLetterUrl)}
              target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: '#1D4ED8', fontWeight: '600', padding: '6px 12px', border: '1px solid rgba(29,78,216,0.3)', background: 'rgba(29,78,216,0.07)' }}
              onClick={e => {
                e.stopPropagation();
                if (window.innerWidth <= 768) {
                  e.preventDefault();
                  openPdf(resolveFileUrl(app.offerLetterUrl), `${app.Student?.firstName} ${app.Student?.lastName} — Offer Letter`);
                }
              }}>
              <FileText size={12} />View Offer Letter
            </a>
          )}
        </div>
      )}
    </div>
  );
}
