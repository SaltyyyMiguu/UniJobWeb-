const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
  getProfile, updateProfile, requestSupervisor, uploadResume, upload, uploadProfileImage, uploadProfileImageMulter,
  searchJobs, applyForJob, getMyApplications, getDashboard, getRecommended,
  getMyChats, getUnreadCount, respondToOffer, confirmInterviewSlot,
  getUpdateCount, markUpdatesSeen, getHiredCelebration,
  getPublicStudentProfile, deactivateAccount,
} = require('../controllers/studentController');

// Public student profile — deliberately outside the STUDENT-only gate below,
// since its real caller is a COMPANY viewing an applicant (see
// getPublicStudentProfile for the per-request ownership check that replaces
// role-gating here: a blanket STUDENT-only restriction would 403 every
// legitimate company caller while doing nothing to stop one student from
// pulling another student's PII by guessing/observing a studentId).
router.get('/public/:studentId', authenticateToken, getPublicStudentProfile);

router.use(authenticateToken, authorizeRoles('STUDENT'));

router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/request-supervisor', requestSupervisor);
router.post('/resume', upload.single('resume'), uploadResume);
router.post('/profile-image', uploadProfileImageMulter.single('profileImage'), uploadProfileImage);
router.get('/jobs', searchJobs);
router.get('/recommended', getRecommended);
router.post('/apply/:jobId', applyForJob);
router.get('/applications', getMyApplications);
router.put('/applications/:id', respondToOffer);
router.put('/applications/:id/confirm-slot', confirmInterviewSlot);
router.get('/chats', getMyChats);
router.get('/unread-count', getUnreadCount);
router.get('/notifications/count', getUpdateCount);
router.post('/notifications/mark-seen', markUpdatesSeen);
router.get('/notifications/hired-celebration', getHiredCelebration);
router.delete('/account', deactivateAccount);

module.exports = router;
