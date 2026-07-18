import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { X, GraduationCap, Code2, ExternalLink, Globe, Phone, FileText, Mail } from 'lucide-react';
import api, { API_BASE_URL } from '../api/axios';
import { usePdfViewer } from '../hooks/usePdfViewer';
import PdfViewerModal from './PdfViewerModal';

export default function StudentProfileModal({ studentId, studentName, resumeSnapshot, onClose }) {
  const { c } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { viewerUrl, viewerTitle, openPdf, closePdf } = usePdfViewer();

  useEffect(() => {
    api.get(`/student/public/${studentId}`)
      .then(r => setProfile(r.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [studentId]);

  const avatarSrc = profile?.profileImageUrl ? `${API_BASE_URL}/${profile.profileImageUrl}` : null;
  const initials = profile
    ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase()
    : (studentName || 'S')[0].toUpperCase();
  const skills = (() => { try { return JSON.parse(profile?.skills || '[]'); } catch { return []; } })();

  return (
    <div className="mobile-modal-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {viewerUrl && <PdfViewerModal url={viewerUrl} title={viewerTitle} onClose={closePdf} />}
      <div className="card mobile-modal-panel" style={{ width: '100%', maxWidth: '460px', maxHeight: '85vh', overflow: 'auto', padding: 0 }}>
        {/* Header */}
        <div className="mobile-modal-header" style={{ height: '70px', background: 'linear-gradient(135deg, #1A2235 0%, #C41E3A 100%)', position: 'relative' }}>
          <button onClick={onClose} title="Close" className="modal-close-btn modal-close-btn--on-banner">
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: '0 24px 24px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-34px', left: '24px', width: '68px', height: '68px', borderRadius: '50%', border: '3px solid var(--surface)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '24px', fontWeight: '800', color: '#C41E3A' }}>{initials}</span>}
          </div>
          <div style={{ paddingTop: '44px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: c.txt1, margin: 0 }}>
              {profile ? `${profile.firstName} ${profile.lastName}` : studentName}
            </h2>
            {profile?.degreeProgram && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px', padding: '3px 8px', background: 'var(--red-dim)', border: '1px solid var(--red-border)', width: 'fit-content' }}>
                <GraduationCap size={11} style={{ color: 'var(--red)' }} />
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--red)' }}>{profile.degreeProgram}</span>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: c.txt3, fontSize: '13px' }}>Loading…</div>
          ) : !profile ? (
            <div style={{ textAlign: 'center', padding: '32px', color: c.txt3, fontSize: '13px' }}>Could not load profile.</div>
          ) : (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {profile?.User?.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: c.txt2 }}>
                  <Mail size={12} style={{ color: c.txt3 }} />{profile.User.email}
                </div>
              )}

              {profile.bio && (
                <div>
                  <p className="section-label" style={{ marginBottom: '6px' }}>About</p>
                  <p style={{ fontSize: '13px', color: c.txt2, lineHeight: '1.7', margin: 0 }}>{profile.bio}</p>
                </div>
              )}

              {skills.length > 0 && (
                <div>
                  <p className="section-label" style={{ marginBottom: '8px' }}>Skills</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {skills.map(skill => (
                      <span key={skill} style={{ padding: '3px 10px', border: `1px solid ${c.border}`, fontSize: '12px', color: c.txt2, background: c.surface2 }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {profile.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.txt2 }}>
                    <Phone size={12} />{profile.phone}
                  </span>
                )}
                {profile.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#0A66C2', fontWeight: '600', textDecoration: 'none' }}>
                    <ExternalLink size={12} />LinkedIn
                  </a>
                )}
                {profile.githubUrl && (
                  <a href={profile.githubUrl} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.txt2, textDecoration: 'none' }}>
                    <Code2 size={12} />GitHub
                  </a>
                )}
                {profile.portfolioUrl && (
                  <a href={profile.portfolioUrl} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.red, fontWeight: '600', textDecoration: 'none' }}>
                    <Globe size={12} />Portfolio
                  </a>
                )}
              </div>

              {/* Resume — shows snapshot if available, otherwise current */}
              {(resumeSnapshot || profile.resumeUrl) && (
                <div>
                  <p className="section-label" style={{ marginBottom: '6px' }}>Resume</p>
                  <a
                    href={`${API_BASE_URL}/${resumeSnapshot || profile.resumeUrl}`}
                    target="_blank" rel="noreferrer"
                    onClick={e => {
                      if (window.innerWidth <= 768) {
                        e.preventDefault();
                        openPdf(`${API_BASE_URL}/${resumeSnapshot || profile.resumeUrl}`, `${studentName || 'Student'} — Resume`);
                      }
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: c.green, fontWeight: '600', padding: '8px 14px', border: `1px solid rgba(26,127,90,0.3)`, background: 'rgba(26,127,90,0.07)', textDecoration: 'none' }}>
                    <FileText size={12} />
                    {resumeSnapshot ? 'View Resume (at application time)' : 'View Current Resume'}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
