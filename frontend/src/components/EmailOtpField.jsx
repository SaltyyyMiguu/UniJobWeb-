import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

// Pre-registration email verification: type an email, send a 6-digit OTP,
// verify it, then the email locks read-only with a "Verified" badge. Shared
// across Student/Company/Supervisor registration since the flow and backend
// endpoints (/auth/send-otp, /auth/verify-otp) are identical for all three —
// only the label/placeholder/validation regex differ per caller.
export default function EmailOtpField({
  label, id, email, onEmailChange, placeholder,
  emailValid = true, invalidMessage,
  verified, onVerified,
}) {
  const [sentForEmail, setSentForEmail] = useState(null);
  const [otpValue, setOtpValue] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Re-editing the email after an OTP was sent invalidates that OTP (it was
  // mailed to the old address) — hide the code entry until they resend.
  const otpSent = sentForEmail !== null && sentForEmail === email;

  const handleSendOtp = async () => {
    if (!email || !emailValid) return toast.error(invalidMessage || 'Enter a valid email first.');
    setSending(true);
    try {
      await api.post('/auth/send-otp', { email });
      setSentForEmail(email);
      setOtpValue('');
      toast.success('Verification code sent — check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send verification code.');
    } finally { setSending(false); }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) return toast.error('Enter the 6-digit code.');
    setVerifying(true);
    try {
      await api.post('/auth/verify-otp', { email, otp: otpValue });
      onVerified(true);
      toast.success('Email verified!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code.');
    } finally { setVerifying(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div>
        <label className="input-label">{label}</label>
        <div className="otp-row">
          <input
            className="input auth-mobile-input"
            id={id} name="email" type="email" required
            placeholder={placeholder}
            value={email}
            readOnly={verified}
            disabled={verified}
            onChange={e => onEmailChange(e.target.value)}
            style={{ borderColor: email && !emailValid ? '#EF4444' : undefined, opacity: verified ? 0.75 : 1 }}
          />
          {verified ? (
            <span className="badge badge-green" style={{ padding: '0 14px', borderRadius: '12px', flexShrink: 0 }}>
              <CheckCircle2 size={13} /> Verified
            </span>
          ) : (
            <button type="button" onClick={handleSendOtp} disabled={sending || !email || !emailValid}
              className="btn btn-outline auth-mobile-btn">
              {sending ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : (otpSent ? 'Resend' : 'Send OTP')}
            </button>
          )}
        </div>
        {email && !emailValid && invalidMessage && (
          <p style={{ fontSize: '11px', color: '#EF4444', margin: '4px 0 0' }}>{invalidMessage}</p>
        )}
      </div>

      {otpSent && !verified && (
        <div>
          <label className="input-label">Verification Code</label>
          <div className="otp-row">
            <input
              className="input auth-mobile-input"
              type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              placeholder="6-digit code"
              value={otpValue}
              onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <button type="button" onClick={handleVerifyOtp} disabled={verifying || otpValue.length !== 6}
              className="btn btn-primary auth-mobile-btn">
              {verifying ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Verify'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
