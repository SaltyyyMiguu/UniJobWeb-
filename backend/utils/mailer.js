/**
 * mailer.js — Automated email notifications (Phase 9)
 *
 * CRITICAL: Every exported function here is designed to NEVER throw. Any SMTP
 * failure (bad credentials, timeout, connection refused) is caught and logged
 * via console.error, then the function resolves quietly. Callers should still
 * fire these WITHOUT awaiting them before sending an HTTP response — see the
 * `.catch()` call sites in the controllers — so a slow or failing mail server
 * can never delay or break a database transaction or API response.
 */
const nodemailer = require('nodemailer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 587;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465 (SSL), false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── Shared HTML shell — matches the app's UCSI crimson branding ─────────────
function wrapTemplate({ heading, body, ctaLink = `${FRONTEND_URL}/login`, ctaLabel = 'Log In to UniJobLink' }) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; background: #F7F7F5; padding: 32px 24px;">
    <div style="background: #1A2235; padding: 20px 24px; display: flex; align-items: center; gap: 10px;">
      <span style="display:inline-block; width: 28px; height: 28px; background: #C41E3A; color: #fff; font-weight: 900; font-size: 13px; text-align: center; line-height: 28px;">U</span>
      <span style="color: #fff; font-weight: 700; font-size: 15px;">UniJobLink</span>
    </div>
    <div style="background: #ffffff; border: 1px solid #E5E5E3; border-top: none; padding: 28px 24px;">
      <h2 style="margin: 0 0 14px; font-size: 18px; color: #111111; letter-spacing: -0.02em;">${heading}</h2>
      <p style="margin: 0 0 22px; font-size: 14px; line-height: 1.6; color: #333333;">${body}</p>
      <a href="${ctaLink}" style="display: inline-block; background: #C41E3A; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 20px;">${ctaLabel}</a>
    </div>
    <p style="text-align: center; font-size: 11px; color: #999999; margin: 16px 0 0;">© ${new Date().getFullYear()} UCSI University · UniJobLink Official Internship Hub</p>
  </div>`;
}

// Internal helper — every send funnels through here so the non-blocking
// error-catching contract only needs to be implemented once.
async function dispatch(to, subject, html) {
  try {
    if (!to) { console.error('[mailer] Skipped send — no recipient email provided.'); return; }
    await transporter.sendMail({
      from: process.env.SMTP_USER ? `"UniJobLink" <${process.env.SMTP_USER}>` : 'UniJobLink <no-reply@unijoblink.local>',
      to, subject, html,
    });
  } catch (error) {
    // Per directive: never let a mail failure break the caller's flow.
    console.error(`[mailer] Failed to send "${subject}" to ${to}:`, error.message);
  }
}

// ─── Student notifications ────────────────────────────────────────────────────
// type: 'INTERVIEW' | 'OFFER' | 'REJECTED'
async function sendStudentEmail(email, name, companyName, jobTitle, type, extraData = {}) {
  const templates = {
    INTERVIEW: {
      subject: `Interview Invitation — ${jobTitle} at ${companyName}`,
      heading: 'You have an interview invitation!',
      body: `Good news! <strong>${companyName}</strong> invited you to interview for <strong>${jobTitle}</strong>. Log in to check your messages.`,
    },
    OFFER: {
      subject: `Offer Extended — ${jobTitle} at ${companyName}`,
      heading: 'Congratulations — you have an offer!',
      body: `Congratulations! <strong>${companyName}</strong> offered you the <strong>${jobTitle}</strong> role. Log in to view your Offer Letter PDF.`,
    },
    REJECTED: {
      subject: `Application Update — ${jobTitle} at ${companyName}`,
      heading: 'Application update',
      body: `Update: <strong>${companyName}</strong> has decided to move forward with other candidates for <strong>${jobTitle}</strong>.`,
    },
    // Generic — used for password reset across all roles, hence no company/job context.
    PASSWORD_RESET: {
      subject: 'Reset your UniJobLink password',
      heading: 'Password reset requested',
      body: 'We received a request to reset your password. Click the button below to choose a new one. If you did not request this, you can safely ignore this email — your password will not be changed.',
    },
  };
  const t = templates[type];
  if (!t) { console.error(`[mailer] Unknown student email type: ${type}`); return; }
  const html = wrapTemplate({ heading: t.heading, body: t.body, ctaLink: extraData.ctaLink, ctaLabel: type === 'PASSWORD_RESET' ? 'Reset Password' : undefined });
  return dispatch(email, t.subject, html);
}

// ─── Company notifications ────────────────────────────────────────────────────
// type: 'OFFER_ACCEPTED' | 'OFFER_REJECTED'
async function sendCompanyEmail(email, hrName, studentName, jobTitle, type) {
  const templates = {
    OFFER_ACCEPTED: {
      subject: `Offer Accepted — ${studentName} for ${jobTitle}`,
      heading: 'Your offer was accepted!',
      body: `Great news! <strong>${studentName}</strong> has officially ACCEPTED your offer for <strong>${jobTitle}</strong>.`,
    },
    OFFER_REJECTED: {
      subject: `Offer Declined — ${jobTitle}`,
      heading: 'Offer declined',
      body: `<strong>${studentName}</strong> has declined your offer for <strong>${jobTitle}</strong>. The position has been reopened in your ATS.`,
    },
  };
  const t = templates[type];
  if (!t) { console.error(`[mailer] Unknown company email type: ${type}`); return; }
  const html = wrapTemplate({ heading: t.heading, body: t.body });
  return dispatch(email, t.subject, html);
}

// ─── Supervisor notifications ─────────────────────────────────────────────────
// type: 'ACTION_REQUIRED'
async function sendSupervisorEmail(email, supervisorName, studentName, companyName, type) {
  const templates = {
    ACTION_REQUIRED: {
      subject: `Action Required — Approve Placement for ${studentName}`,
      heading: 'Placement approval needed',
      body: `Your student, <strong>${studentName}</strong>, has been hired by <strong>${companyName}</strong>. Please log in to your Supervisor Portal to review the job scope and Approve/Reject the academic placement.`,
    },
  };
  const t = templates[type];
  if (!t) { console.error(`[mailer] Unknown supervisor email type: ${type}`); return; }
  const html = wrapTemplate({ heading: t.heading, body: t.body, ctaLabel: 'Go to Supervisor Portal' });
  return dispatch(email, t.subject, html);
}

// ─── Pre-registration OTP ─────────────────────────────────────────────────────
async function sendOtpEmail(email, otp) {
  const html = wrapTemplate({
    heading: 'Verify your email',
    body: `Your UniJobLink verification code is:</p><p style="margin: 0 0 22px; font-size: 28px; font-weight: 700; letter-spacing: 0.1em; color: #C41E3A;">${otp}</p><p style="margin: 0 0 22px; font-size: 14px; line-height: 1.6; color: #333333;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.`,
    ctaLink: FRONTEND_URL,
    ctaLabel: 'Go to UniJobLink',
  });
  return dispatch(email, 'Your UniJobLink verification code', html);
}

module.exports = { sendStudentEmail, sendCompanyEmail, sendSupervisorEmail, sendOtpEmail };
