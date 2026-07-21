import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { X, Globe, ExternalLink, Phone, MapPin, Building2, Users, Calendar, CheckCircle } from 'lucide-react';
import api, { resolveFileUrl } from '../api/axios';

export default function CompanyProfileModal({ companyId, companyName, onClose }) {
  const { c } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/company/public/${companyId}`)
      .then(r => setProfile(r.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [companyId]);

  const avatarSrc = profile?.profileImageUrl ? resolveFileUrl(profile.profileImageUrl) : null;
  const avatarLetter = (profile?.companyName || companyName || 'C')[0].toUpperCase();

  return (
    <div className="mobile-modal-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card mobile-modal-panel" style={{ width: '100%', maxWidth: '500px', maxHeight: '85vh', overflow: 'auto', padding: 0 }}>
        {/* Header */}
        <div className="mobile-modal-header" style={{ height: '70px', background: 'linear-gradient(135deg, #1A2235 0%, #2A3A55 100%)', position: 'relative' }}>
          <button onClick={onClose} title="Close" className="modal-close-btn modal-close-btn--on-banner">
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: '0 24px 24px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-34px', left: '24px', width: '68px', height: '68px', border: '3px solid var(--surface)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {avatarSrc
              ? <img src={avatarSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '24px', fontWeight: '800', color: '#C41E3A' }}>{avatarLetter}</span>}
          </div>
          <div style={{ paddingTop: '44px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: c.txt1, margin: 0 }}>{profile?.companyName || companyName}</h2>
              {profile?.isVerified && <span className="badge badge-green"><CheckCircle size={9} />Verified</span>}
            </div>
            {profile?.industry && <p style={{ fontSize: '13px', color: c.txt2, margin: '4px 0 0' }}>{profile.industry}</p>}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: c.txt3, fontSize: '13px' }}>Loading…</div>
          ) : !profile ? (
            <div style={{ textAlign: 'center', padding: '32px', color: c.txt3, fontSize: '13px' }}>Could not load profile.</div>
          ) : (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {profile.description && (
                <div>
                  <p className="section-label" style={{ marginBottom: '6px' }}>About</p>
                  <p style={{ fontSize: '13px', color: c.txt2, lineHeight: '1.7', margin: 0 }}>{profile.description}</p>
                </div>
              )}

              <div>
                <p className="section-label" style={{ marginBottom: '10px' }}>Details</p>
                <div className="mobile-stack-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    [Building2, 'Industry', profile.industry],
                    [Users, 'Company Size', profile.companySize],
                    [Calendar, 'Founded', profile.foundedYear],
                    [MapPin, 'Location', profile.address],
                  ].filter(([, , v]) => v).map(([Icon, label, value]) => (
                    <div key={label}>
                      <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: c.txt3, margin: 0 }}>{label}</p>
                      <p style={{ fontSize: '13px', color: c.txt1, margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Icon size={11} style={{ color: c.txt3 }} />{value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.red, fontWeight: '600', textDecoration: 'none' }}>
                    <Globe size={12} />Website
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#0A66C2', fontWeight: '600', textDecoration: 'none' }}>
                    <ExternalLink size={12} />LinkedIn
                  </a>
                )}
                {profile.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.txt2 }}>
                    <Phone size={12} />{profile.phone}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
