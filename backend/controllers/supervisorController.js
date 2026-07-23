const { Supervisor, Student, Application, JobPosting, Company, User } = require('../models');

// Stage-rank used to compute a student's "highest application stage" for the
// My Students table — higher index = better/further outcome. Closed-negative
// outcomes (withdrawn/rejected/expired) rank lowest since they represent no
// net progress, even though they can occur late in the calendar timeline.
const STAGE_RANK = [
  'AUTO_REJECTED', 'WITHDRAWN', 'REJECTED',
  'PENDING',
  'ACCEPTED',
  'OFFER_REJECTED', 'OFFERED', 'OFFER_ACCEPTED',
  'HIRED',
  'REJECTED_BY_UNI',
  'APPROVED_BY_UNI',
];

const highestStage = (applications = []) => {
  if (!applications.length) return null;
  return applications.reduce((best, app) => {
    const rank = STAGE_RANK.indexOf(app.status);
    const bestRank = STAGE_RANK.indexOf(best.status);
    return rank > bestRank ? app : best;
  });
};

// ─── GET /api/supervisor/dashboard ────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const supervisor = await Supervisor.findOne({ where: { userId: req.user.id } });
    if (!supervisor) return res.status(404).json({ message: 'Supervisor profile not found.' });

    const pending = await Student.findAll({
      where: { supervisorId: supervisor.id, supervisorStatus: 'PENDING' },
      include: [{ model: User, attributes: ['email'] }],
      order: [['updatedAt', 'DESC']],
    });

    const approvedStudents = await Student.findAll({
      where: { supervisorId: supervisor.id, supervisorStatus: 'APPROVED' },
      include: [
        { model: User, attributes: ['email', 'faculty'] },
        { model: Application, attributes: ['id', 'status'], required: false },
      ],
      order: [['firstName', 'ASC']],
    });

    const approved = approvedStudents.map(s => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      degreeProgram: s.degreeProgram,
      ucsiId: s.ucsiId,
      email: s.User?.email,
      faculty: s.User?.faculty || null,
      highestStage: highestStage(s.Applications)?.status || null,
    }));

    res.json({ pending, approved });
  } catch (error) {
    console.error('[Failed to fetch dashboard.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/supervisor/profile ──────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const supervisor = await Supervisor.findOne({ where: { userId: req.user.id } });
    if (!supervisor) return res.status(404).json({ message: 'Supervisor profile not found.' });
    res.json(supervisor);
  } catch (error) {
    console.error('[Failed to fetch profile.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── PUT /api/supervisor/profile ──────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const supervisor = await Supervisor.findOne({ where: { userId: req.user.id } });
    if (!supervisor) return res.status(404).json({ message: 'Supervisor profile not found.' });
    const { firstName, lastName, department, title } = req.body;
    if (firstName !== undefined) supervisor.firstName = firstName;
    if (lastName !== undefined) supervisor.lastName = lastName;
    if (department !== undefined) supervisor.department = department;
    if (title !== undefined) supervisor.title = title;
    await supervisor.save();
    res.json({ message: 'Profile updated successfully.', supervisor });
  } catch (error) {
    console.error('[Failed to update profile.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── PUT /api/supervisor/students/:studentId/accept ───────────────────────────
const acceptStudent = async (req, res) => {
  try {
    const supervisor = await Supervisor.findOne({ where: { userId: req.user.id } });
    if (!supervisor) return res.status(404).json({ message: 'Supervisor profile not found.' });

    const student = await Student.findByPk(req.params.studentId);
    if (!student || student.supervisorId !== supervisor.id || student.supervisorStatus !== 'PENDING') {
      return res.status(404).json({ message: 'Pending request not found.' });
    }
    student.supervisorStatus = 'APPROVED';
    await student.save();
    res.json({ message: 'Student accepted.', student });
  } catch (error) {
    console.error('[Failed to accept student.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── PUT /api/supervisor/students/:studentId/reject ───────────────────────────
const rejectStudent = async (req, res) => {
  try {
    const supervisor = await Supervisor.findOne({ where: { userId: req.user.id } });
    if (!supervisor) return res.status(404).json({ message: 'Supervisor profile not found.' });

    const student = await Student.findByPk(req.params.studentId);
    if (!student || student.supervisorId !== supervisor.id || student.supervisorStatus !== 'PENDING') {
      return res.status(404).json({ message: 'Pending request not found.' });
    }
    student.supervisorStatus = 'REJECTED';
    student.supervisorId = null;
    await student.save();
    res.json({ message: 'Student rejected.', student });
  } catch (error) {
    console.error('[Failed to reject student.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── GET /api/supervisor/students/:studentId ──────────────────────────────────
const getStudentDetail = async (req, res) => {
  try {
    const supervisor = await Supervisor.findOne({ where: { userId: req.user.id } });
    if (!supervisor) return res.status(404).json({ message: 'Supervisor profile not found.' });

    const student = await Student.findByPk(req.params.studentId, {
      include: [{ model: User, attributes: ['email'] }],
    });
    if (!student || student.supervisorId !== supervisor.id || student.supervisorStatus !== 'APPROVED') {
      return res.status(403).json({ message: 'You do not have access to this student.' });
    }

    const applications = await Application.findAll({
      where: { studentId: student.id },
      include: [{
        model: JobPosting,
        attributes: ['id', 'title', 'category', 'location', 'allowance', 'duration', 'positionsLeft', 'description', 'requirements', 'benefits', 'isActive', 'createdAt'],
        include: [{ model: Company, attributes: ['id', 'companyName', 'profileImageUrl', 'industry', 'website', 'isVerified'] }],
      }],
      order: [['createdAt', 'DESC']],
    });

    res.json({ student, applications });
  } catch (error) {
    console.error('[Failed to fetch student.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── Shared guard for the two placement-approval endpoints ────────────────────
const findGuardedApplication = async (req, res) => {
  const supervisor = await Supervisor.findOne({ where: { userId: req.user.id } });
  if (!supervisor) { res.status(404).json({ message: 'Supervisor profile not found.' }); return null; }

  const student = await Student.findByPk(req.params.studentId);
  if (!student || student.supervisorId !== supervisor.id || student.supervisorStatus !== 'APPROVED') {
    res.status(403).json({ message: 'You do not have access to this student.' });
    return null;
  }

  const application = await Application.findOne({
    where: { id: req.params.appId, studentId: student.id },
  });
  if (!application) { res.status(404).json({ message: 'Application not found.' }); return null; }
  if (application.status !== 'HIRED') {
    res.status(400).json({ message: 'Only HIRED applications can be reviewed for placement.' });
    return null;
  }
  return application;
};

// ─── PUT /api/supervisor/students/:studentId/applications/:appId/approve-placement
const approvePlacement = async (req, res) => {
  try {
    const application = await findGuardedApplication(req, res);
    if (!application) return;
    application.status = 'APPROVED_BY_UNI';
    await application.save();
    res.json({ message: 'Placement approved.', application });
  } catch (error) {
    console.error('[Failed to approve placement.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── PUT /api/supervisor/students/:studentId/applications/:appId/reject-placement
const rejectPlacement = async (req, res) => {
  try {
    const application = await findGuardedApplication(req, res);
    if (!application) return;
    application.status = 'REJECTED_BY_UNI';
    await application.save();
    res.json({ message: 'Placement rejected.', application });
  } catch (error) {
    console.error('[Failed to reject placement.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── DELETE /api/supervisor/account ───────────────────────────────────────────
const deactivateAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.isArchived = true;
    await user.save();
    res.json({ message: 'Account deactivated. You will be signed out.' });
  } catch (error) {
    console.error('[Failed to deactivate account.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

module.exports = {
  getDashboard, getProfile, updateProfile,
  acceptStudent, rejectStudent, getStudentDetail,
  approvePlacement, rejectPlacement,
  deactivateAccount,
};
