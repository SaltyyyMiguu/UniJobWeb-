const bcrypt = require('bcryptjs');
const { sequelize, Company, User, Student, Application, JobPosting, Supervisor } = require('../models');

// ─── GET /api/admin/companies/pending ────────────────────────────────────────
const getPendingCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll({
      where: { isVerified: false },
      include: [{ model: User, attributes: ['email', 'createdAt', 'isArchived'] }]
    });
    res.json(companies);
  } catch (error) {
    console.error('[Failed to fetch pending companies.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/admin/companies ─────────────────────────────────────────────────
// All companies regardless of verification status — for the Master Data tab
const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll({
      include: [{ model: User, attributes: ['id', 'email', 'createdAt', 'isArchived'] }],
      order: [['companyName', 'ASC']],
    });
    res.json(companies);
  } catch (error) {
    console.error('[Failed to fetch companies.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/admin/supervisors ───────────────────────────────────────────────
const getAllSupervisors = async (req, res) => {
  try {
    const supervisors = await Supervisor.findAll({
      include: [{ model: User, attributes: ['id', 'email', 'createdAt', 'isArchived', 'faculty'] }],
      order: [['firstName', 'ASC']],
    });
    res.json(supervisors);
  } catch (error) {
    console.error('[Failed to fetch supervisors.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── PUT /api/admin/companies/:id/verify ─────────────────────────────────────
const verifyCompany = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found.' });
    company.isVerified = true;
    await company.save();
    res.json({ message: 'Company verified successfully.', company });
  } catch (error) {
    console.error('[Failed to verify company.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── DELETE /api/admin/companies/:id ─────────────────────────────────────────
const rejectCompany = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found.' });
    const user = await User.findByPk(company.userId);
    await company.destroy();
    if (user) await user.destroy();
    res.json({ message: 'Company rejected and removed from system.' });
  } catch (error) {
    console.error('[Failed to reject company.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const totalCompanies = await Company.count({ where: { isVerified: true } });
    const totalPlacements = await Application.count({ where: { status: 'HIRED' } });
    const pendingVerifications = await Company.count({ where: { isVerified: false } });

    res.json({ totalStudents, totalCompanies, totalPlacements, pendingVerifications });
  } catch (error) {
    console.error('[Failed to fetch dashboard data.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/admin/students ──────────────────────────────────────────────────
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        { model: User, attributes: ['email', 'id', 'isArchived', 'faculty'] },
        {
          model: Application,
          where: { status: 'HIRED' },
          required: false,
          include: [{ model: JobPosting, attributes: ['title'], include: [{ model: Company, attributes: ['companyName'] }] }]
        }
      ]
    });
    res.json(students);
  } catch (error) {
    console.error('[Failed to fetch students.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
// List all users (students + companies) for admin password management
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'role', 'isArchived', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error('[Failed to fetch users.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── PUT /api/admin/users/:userId/password ────────────────────────────────────
// Admin can reset any user's password without knowing their current password
const changeUserPassword = async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters.' });
  }
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: `Password updated for ${user.email}.` });
  } catch (error) {
    console.error('[Failed to update password.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── PUT /api/admin/users/:userId/profile ─────────────────────────────────────
// "God Mode" edit — admin edits any user's role-specific profile fields.
// For students, an optional `supervisorId` in the body force-assigns a supervisor
// and bypasses the request/accept handshake entirely (supervisorStatus -> APPROVED).
// `userFaculty` (distinct from Student's own free-text `faculty` field) updates the
// User-level faculty ENUM used for admin/supervisor search & filter tooling.
const updateUserProfile = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const user = await User.findByPk(req.params.userId, { transaction: t });
    if (!user) { await t.rollback(); return res.status(404).json({ message: 'User not found.' }); }

    if (req.body.userFaculty !== undefined) {
      user.faculty = req.body.userFaculty || null;
      await user.save({ transaction: t });
    }

    let profile = null;

    if (user.role === 'STUDENT') {
      const student = await Student.findOne({ where: { userId: user.id }, transaction: t });
      if (!student) { await t.rollback(); return res.status(404).json({ message: 'Student profile not found.' }); }
      const { firstName, lastName, degreeProgram, faculty, supervisorId, forceApproveSupervisor } = req.body;
      if (firstName !== undefined) student.firstName = firstName;
      if (lastName !== undefined) student.lastName = lastName;
      if (degreeProgram !== undefined) student.degreeProgram = degreeProgram;
      if (faculty !== undefined) student.faculty = faculty;
      if (supervisorId !== undefined) {
        student.supervisorId = supervisorId || null;
        if (supervisorId && forceApproveSupervisor) student.supervisorStatus = 'APPROVED';
        else if (!supervisorId) student.supervisorStatus = null;
      }
      await student.save({ transaction: t });
      profile = student;
    } else if (user.role === 'COMPANY') {
      const company = await Company.findOne({ where: { userId: user.id }, transaction: t });
      if (!company) { await t.rollback(); return res.status(404).json({ message: 'Company profile not found.' }); }
      const { companyName, industry, description, website, address, companySize } = req.body;
      if (companyName !== undefined) company.companyName = companyName;
      if (industry !== undefined) company.industry = industry;
      if (description !== undefined) company.description = description;
      if (website !== undefined) company.website = website;
      if (address !== undefined) company.address = address;
      if (companySize !== undefined) company.companySize = companySize;
      await company.save({ transaction: t });
      profile = company;
    } else if (user.role === 'SUPERVISOR') {
      const supervisor = await Supervisor.findOne({ where: { userId: user.id }, transaction: t });
      if (!supervisor) { await t.rollback(); return res.status(404).json({ message: 'Supervisor profile not found.' }); }
      const { firstName, lastName, department, title } = req.body;
      if (firstName !== undefined) supervisor.firstName = firstName;
      if (lastName !== undefined) supervisor.lastName = lastName;
      if (department !== undefined) supervisor.department = department;
      if (title !== undefined) supervisor.title = title;
      await supervisor.save({ transaction: t });
      profile = supervisor;
    } else {
      await t.rollback();
      return res.status(400).json({ message: 'This role has no editable profile.' });
    }

    await t.commit();
    res.json({ message: 'User updated successfully.', profile });
  } catch (error) {
    await t.rollback();
    console.error('[Failed to update user.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── PUT /api/admin/users/:userId/toggle-archive ─────────────────────────────
const toggleUserArchive = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.isArchived = !user.isArchived;
    await user.save();
    res.json({ message: user.isArchived ? 'User deactivated.' : 'User reactivated.', user });
  } catch (error) {
    console.error('[Failed to update user.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

module.exports = {
  getPendingCompanies, verifyCompany, rejectCompany,
  getAllCompanies, getAllSupervisors,
  getDashboard, getAllStudents,
  getAllUsers, changeUserPassword, toggleUserArchive,
  updateUserProfile,
};
