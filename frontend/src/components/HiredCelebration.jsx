import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Trophy, PartyPopper } from 'lucide-react';
import { API_BASE_URL } from '../api/axios';

const CONFETTI_COLORS = ['#C41E3A', '#FBB839', '#34D399', '#1D4ED8', '#E05070', '#F0F0EE'];

function makeConfetti(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.2,
    duration: 2.6 + Math.random() * 1.8,
    size: 6 + Math.random() * 7,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rotate: Math.random() * 360,
    drift: (Math.random() - 0.5) * 160,
    round: Math.random() > 0.5,
  }));
}

function makeBursts(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    top: 15 + Math.random() * 45,
    left: 10 + Math.random() * 80,
    delay: Math.random() * 1.8,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  }));
}

// Fireworks/confetti celebration — shown on the student dashboard the first
// time they see a HIRED status. Dismissing it marks that application seen.
export default function HiredCelebration({ application, onClose }) {
  const { c } = useTheme();
  const confetti = useMemo(() => makeConfetti(70), []);
  const bursts = useMemo(() => makeBursts(6), []);

  const companyName = application?.JobPosting?.Company?.companyName || 'the company';
  const jobTitle = application?.JobPosting?.title || 'the role';
  const logoSrc = application?.JobPosting?.Company?.profileImageUrl
    ? `${API_BASE_URL}/${application.JobPosting.Company.profileImageUrl}`
    : null;

  return (
    <div className="layer-overlay" style={{ background: 'rgba(5,5,8,0.65)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      {/* Confetti field */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {confetti.map(p => (
          <span key={p.id} style={{
            position: 'absolute', top: '-5vh', left: `${p.left}%`,
            width: `${p.size}px`, height: `${p.size * (p.round ? 1 : 0.4)}px`,
            background: p.color,
            borderRadius: p.round ? '50%' : '2px',
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s cubic-bezier(0.4,0.1,0.6,1) ${p.delay}s forwards`,
            '--drift': `${p.drift}px`,
            opacity: 0,
          }} />
        ))}
        {bursts.map(b => (
          <span key={b.id} style={{
            position: 'absolute', top: `${b.top}%`, left: `${b.left}%`,
            width: '16px', height: '16px', borderRadius: '50%',
            background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
            animation: `firework-burst 1.8s ease-out ${b.delay}s infinite`,
          }} />
        ))}
      </div>

      {/* Celebration card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', zIndex: 1,
          background: c.surface, border: `1px solid ${c.border}`,
          boxShadow: 'var(--lift-hover), 0 40px 80px rgba(0,0,0,0.35)',
          width: '100%', maxWidth: '440px',
          padding: '40px 32px 32px',
          textAlign: 'center',
          animation: 'layer-pop-in 0.4s cubic-bezier(0.16,1,0.3,1)',
        }}>
        <div style={{
          width: '76px', height: '76px', margin: '0 auto 18px',
          background: 'linear-gradient(135deg, #FBB839 0%, #F59E0B 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '50%',
          boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
          animation: 'trophy-bounce 1.4s ease-in-out infinite',
        }}>
          <Trophy size={36} style={{ color: '#fff' }} />
        </div>

        <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: c.green, margin: '0 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <PartyPopper size={12} /> Congratulations
        </p>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: c.txt1, margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: '1.3' }}>
          You've been hired!
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', margin: '0 0 8px' }}>
          <div style={{ width: '32px', height: '32px', flexShrink: 0, background: logoSrc ? 'transparent' : c.red, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {logoSrc
              ? <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: '#fff', fontWeight: '800', fontSize: '13px' }}>{companyName[0]}</span>}
          </div>
          <p style={{ fontSize: '15px', fontWeight: '700', color: c.txt1, margin: 0 }}>{companyName}</p>
        </div>
        <p style={{ fontSize: '13px', color: c.txt3, margin: '0 0 26px' }}>
          brought you on board as <strong style={{ color: c.txt2 }}>{jobTitle}</strong>
        </p>

        <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
          Let's go! <PartyPopper size={14} />
        </button>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(110vh) translateX(var(--drift)) rotate(600deg); opacity: 0; }
        }
        @keyframes firework-burst {
          0%   { transform: scale(0); opacity: 0.9; }
          60%  { opacity: 0.7; }
          100% { transform: scale(9); opacity: 0; }
        }
        @keyframes trophy-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-6px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
