const rateLimit = require('express-rate-limit');

// Guards POST /api/auth/send-otp — caps how many OTP emails a single IP can
// trigger, since each request fires an outbound SMTP send (spam/cost vector).
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  // Dev-only escape hatch for manual testing — must be explicitly opted into
  // via .env, so the rate limit stays on by default everywhere else.
  skip: () => process.env.OTP_RATE_LIMIT_DISABLED === 'true',
  message: { message: 'Too many OTP requests from this IP. Please try again in 15 minutes.' },
});

module.exports = otpRateLimiter;
