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
// Public student profile (accessible by company via this student route, or directly)
router.get('/public/:studentId', getPublicStudentProfile);

module.exports = router;
