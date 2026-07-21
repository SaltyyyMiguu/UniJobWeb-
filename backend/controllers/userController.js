const { Supervisor, User, Student, Company } = require('../models');
const { uploadCoverPhoto: uploadCoverPhotoMulter } = require('../utils/cloudinaryUploader');

// ─── GET /api/users/supervisors ───────────────────────────────────────────────
// Any authenticated role can hit this — students need it to populate the
// "Select Academic Supervisor" dropdown, admin needs it for the God Mode override.
const getActiveSupervisors = async (req, res) => {
  try {
    const supervisors = await Supervisor.findAll({
      include: [{ model: User, attributes: ['isArchived'] }],
      where: { '$User.isArchived$': false },
      attributes: ['id', 'firstName', 'lastName', 'department', 'title'],
      order: [['firstName', 'ASC']],
    });
    res.json(supervisors);
  } catch (error) {
    console.error('[Failed to fetch supervisors.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// ─── POST /api/users/cover-photo ──────────────────────────────────────────────
// Shared between students and companies — both models carry their own
// coverPhotoUrl column, so this just branches on the caller's role to decide
// which one to update.
const uploadCoverPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    if (req.user.role === 'STUDENT') {
      const student = await Student.findOne({ where: { userId: req.user.id } });
      if (!student) return res.status(404).json({ message: 'Student profile not found.' });
      student.coverPhotoUrl = req.file.path;
      await student.save();
      return res.json({ message: 'Cover photo updated.', coverPhotoUrl: student.coverPhotoUrl });
    }

    if (req.user.role === 'COMPANY') {
      const company = await Company.findOne({ where: { userId: req.user.id } });
      if (!company) return res.status(404).json({ message: 'Company profile not found.' });
      company.coverPhotoUrl = req.file.path;
      await company.save();
      return res.json({ message: 'Cover photo updated.', coverPhotoUrl: company.coverPhotoUrl });
    }

    res.status(403).json({ message: 'Only students and companies can set a cover photo.' });
  } catch (error) {
    console.error('[Failed to update cover photo.] DB error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

module.exports = { getActiveSupervisors, uploadCoverPhoto, uploadCoverPhotoMulter };
