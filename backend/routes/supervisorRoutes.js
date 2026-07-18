const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
  getDashboard, getProfile, updateProfile,
  acceptStudent, rejectStudent, getStudentDetail,
  approvePlacement, rejectPlacement,
  deactivateAccount,
} = require('../controllers/supervisorController');

router.use(authenticateToken, authorizeRoles('SUPERVISOR'));

router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/students/:studentId/accept', acceptStudent);
router.put('/students/:studentId/reject', rejectStudent);
router.get('/students/:studentId', getStudentDetail);
router.put('/students/:studentId/applications/:appId/approve-placement', approvePlacement);
router.put('/students/:studentId/applications/:appId/reject-placement', rejectPlacement);
router.delete('/account', deactivateAccount);

module.exports = router;
