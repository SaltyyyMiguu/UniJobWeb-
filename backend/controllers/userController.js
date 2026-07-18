const { Supervisor, User } = require('../models');

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

module.exports = { getActiveSupervisors };
