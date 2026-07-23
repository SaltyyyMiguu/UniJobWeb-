const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Student, Company, Supervisor, EmailOtp } = require('../models');
const { sendStudentEmail, sendOtpEmail } = require('../utils/mailer');
const { auditLog } = require('../utils/auditLogger');

const UCSI_EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@ucsiuniversity\.edu\.my$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Shared by all three registerX functions below — 403s the request unless
// this email has a verified OTP record on file, then deletes that record
// (it's single-use; a fresh registration attempt needs a fresh OTP).
const requireVerifiedOtp = async (email) => {
  const record = await EmailOtp.findOne({ where: { email } });
  if (!record || !record.isVerified) return false;
  await record.destroy();
  return true;
};

// ─── POST /api/auth/send-otp ──────────────────────────────────────────────────
const sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }

    // Don't burn an OTP/email send on an address that's already registered.
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'This email is already registered. Try logging in instead.' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await EmailOtp.upsert({ email, otp, expiresAt, isVerified: false });

    // Fired asynchronously — never awaited, always caught, so a dead SMTP
    // server can't delay or break this response (see utils/mailer.js).
    sendOtpEmail(email, otp).catch(console.error);

    res.json({ message: 'Verification code sent. Please check your inbox.' });
  } catch (error) {
    console.error('[sendOtp] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── POST /api/auth/verify-otp ────────────────────────────────────────────────
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and code are required.' });
    }

    const record = await EmailOtp.findOne({ where: { email } });
    if (!record || record.otp !== String(otp)) {
      return res.status(400).json({ message: 'Incorrect verification code.' });
    }
    if (new Date() > record.expiresAt) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    record.isVerified = true;
    await record.save();

    res.json({ message: 'Email verified.' });
  } catch (error) {
    console.error('[verifyOtp] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── POST /api/auth/register/student ─────────────────────────────────────────
const registerStudent = async (req, res) => {
  const { email, password, firstName, lastName, ucsiId, degreeProgram } = req.body;
  try {
    // UCSI Gateway — students must use official email
    if (!UCSI_EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Student accounts require a @ucsiuniversity.edu.my email address.' });
    }

    // Cross-role uniqueness — check if this email exists as a company too
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.role === 'COMPANY'
          ? 'This email is already registered as a Company account.'
          : 'Email already in use.'
      });
    }

    if (!(await requireVerifiedOtp(email))) {
      return res.status(403).json({ message: 'Email not verified.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, role: 'STUDENT' });
    const student = await Student.create({ userId: user.id, firstName, lastName, ucsiId, degreeProgram });

    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role }, profile: student });
  } catch (error) {
    console.error('[Registration failed.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── POST /api/auth/register/company ─────────────────────────────────────────
const registerCompany = async (req, res) => {
  const { email, password, companyName, ssmNumber, industry } = req.body;
  try {
    // Cross-role uniqueness — check if this email exists as a student too
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.role === 'STUDENT'
          ? 'This email is already registered as a Student account.'
          : 'Email already in use.'
      });
    }

    const existingSSM = await Company.findOne({ where: { ssmNumber } });
    if (existingSSM) return res.status(400).json({ message: 'SSM Number already registered.' });

    if (!(await requireVerifiedOtp(email))) {
      return res.status(403).json({ message: 'Email not verified.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, role: 'COMPANY' });
    const company = await Company.create({ userId: user.id, companyName, ssmNumber, industry });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
      profile: company,
      message: 'Registration successful. Your account is pending admin verification.'
    });
  } catch (error) {
    console.error('[Registration failed.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── POST /api/auth/register/supervisor ──────────────────────────────────────
const registerSupervisor = async (req, res) => {
  const { email, password, firstName, lastName, department, title } = req.body;
  try {
    // Cross-role uniqueness — check if this email exists as another role
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.role !== 'SUPERVISOR'
          ? `This email is already registered as a ${existingUser.role.charAt(0)}${existingUser.role.slice(1).toLowerCase()} account.`
          : 'Email already in use.'
      });
    }

    if (!(await requireVerifiedOtp(email))) {
      return res.status(403).json({ message: 'Email not verified.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, role: 'SUPERVISOR' });
    const supervisor = await Supervisor.create({ userId: user.id, firstName, lastName, department, title });

    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role }, profile: supervisor });
  } catch (error) {
    console.error('[Registration failed.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      auditLog(`Login Failed - Email: ${email} - Reason: User Not Found`);
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Soft-delete check
    if (user.isArchived) {
      auditLog(`Login Failed - Email: ${email} - Reason: Account Deactivated`);
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact the administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      auditLog(`Login Failed - Email: ${email} - Reason: Invalid Password`);
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    if (user.role === 'COMPANY') {
      const company = await Company.findOne({ where: { userId: user.id } });
      if (!company.isVerified) {
        auditLog(`Login Failed - Email: ${email} - Reason: Company Not Verified`);
        return res.status(403).json({ message: 'Your company account is pending admin verification.' });
      }
    }

    const token = generateToken(user);
    auditLog(`Login Success - User ID: ${user.id} - Role: ${user.role}`);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('[Login failed.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = req.user;
    let profile = null;
    if (user.role === 'STUDENT') profile = await Student.findOne({ where: { userId: user.id } });
    if (user.role === 'COMPANY') profile = await Company.findOne({ where: { userId: user.id } });
    if (user.role === 'SUPERVISOR') profile = await Supervisor.findOne({ where: { userId: user.id } });
    res.json({ user: { id: user.id, email: user.email, role: user.role }, profile });
  } catch (error) {
    console.error('[Failed to fetch user data.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new passwords are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters.' });
  }
  try {
    const user = await User.findByPk(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect.' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('[Failed to change password.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
// Generates a reset token, emails it via mailer.js, and returns only a
// generic success message — the raw token must never appear in the API
// response or it'd let anyone with a user's email hijack their account.
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal whether email exists — standard security practice
      return res.json({ message: 'If that email exists, a reset token has been generated.' });
    }

    const resetToken = crypto.randomUUID();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // 1 hour expiry

    user.resetToken = resetToken;
    user.resetTokenExpiry = expiry;
    await user.save();

    // Fired asynchronously — never awaited, always caught, so a dead SMTP
    // server can't delay or break this response (see utils/mailer.js).
    sendStudentEmail(user.email, '', '', '', 'PASSWORD_RESET', {
      ctaLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
    }).catch(console.error);

    res.json({ message: 'If that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('[forgotPassword] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }
  try {
    const user = await User.findOne({ where: { resetToken: token } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token.' });
    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      return res.status(400).json({ message: 'Reset token has expired. Please request a new one.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('[Failed to reset password.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

module.exports = { sendOtp, verifyOtp, registerStudent, registerCompany, registerSupervisor, login, getMe, changePassword, forgotPassword, resetPassword };
