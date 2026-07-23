/**
 * auditLogger.js — Structured [AUDIT] logging for security/business-critical
 * events (logins, application/placement status changes), visible in Render's
 * log stream.
 *
 * SECURITY: never pass req.body, a password, or a raw JWT into auditLog().
 * Only log specific known-safe fields (IDs, roles, emails, status names). If
 * a request body genuinely needs to be included for debugging, run it
 * through scrubBody() first — it never returns a password/token verbatim.
 */

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'otp', 'pin'];

function isSensitiveKey(key) {
  const lower = key.toLowerCase();
  return SENSITIVE_KEYS.some(s => lower.includes(s));
}

// Shallow-redacts any key that looks sensitive (password, newPassword,
// confirmPassword, token, resetToken, otp, ...) — case-insensitive substring
// match, so new fields are caught by default instead of needing an
// allowlist update every time someone adds a field to a request body.
function scrubBody(body) {
  if (!body || typeof body !== 'object') return body;
  const clean = { ...body };
  for (const key of Object.keys(clean)) {
    if (isSensitiveKey(key)) clean[key] = '[REDACTED]';
  }
  return clean;
}

function auditLog(message) {
  console.log(`[AUDIT] ${new Date().toISOString()} - ${message}`);
}

module.exports = { auditLog, scrubBody };
