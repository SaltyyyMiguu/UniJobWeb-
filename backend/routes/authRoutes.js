const express = require('express');
const router = express.Router();
const {
  sendOtp, verifyOtp, registerStudent, registerCompany, registerSupervisor, login, getMe,
  changePassword, forgotPassword, resetPassword
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const otpRateLimiter = require('../middleware/otpRateLimiter');

router.post('/send-otp', otpRateLimiter, sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register/student', registerStudent);
router.post('/register/company', registerCompany);
router.post('/register/supervisor', registerSupervisor);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.put('/change-password', authenticateToken, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
