const rateLimit = require('express-rate-limit');

// Guards POST /api/auth/login — without this, login has zero throttling and
// is a direct credential-stuffing/brute-force target (unlike the OTP routes,
// which already had a limiter). Capped tighter than the OTP limiter since a
// legitimate user rarely needs more than a handful of attempts.
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts from this IP. Please try again in 15 minutes.' },
});

module.exports = loginRateLimiter;
