const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
  getProfile, updateProfile, getDashboard, createJob, getMyJobs, updateJob, deleteJob, hardDeleteJob, getArchivedJobs,
  getApplications, updateApplicationStatus, setInterviewSlots,
  getMyChats, getUnreadCount,
  getNewApplicantCount, markApplicantsSeen,
  getPublicCompanyProfile,
  uploadProfileImage, uploadProfileImageMulter,
  uploadJobImage, uploadListingImageMulter,
  uploadOfferLetter, uploadOfferLetterMulter,
  deactivateAccount,
} = require('../controllers/companyController');

router.use(authenticateToken, authorizeRoles('COMPANY'));

router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile-image', uploadProfileImageMulter.single('profileImage'), uploadProfileImage);
router.post('/jobs', createJob);
router.get('/jobs', getMyJobs);
router.get('/jobs/archived', getArchivedJobs);
router.put('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);
router.delete('/jobs/:id/permanent', hardDeleteJob);
router.get('/applications', getApplications);
router.put('/applications/:id', updateApplicationStatus);
router.post('/applications/:id/interview-slots', setInterviewSlots);
router.post('/applications/:id/offer-letter', uploadOfferLetterMulter.single('offerLetter'), uploadOfferLetter);
router.post('/jobs/:id/image', uploadListingImageMulter.single('listingImage'), uploadJobImage);
router.get('/chats', getMyChats);
router.get('/unread-count', getUnreadCount);
router.get('/notifications/count', getNewApplicantCount);
router.post('/notifications/mark-seen', markApplicantsSeen);
router.delete('/account', deactivateAccount);
// Public company profile (for students to view)
router.get('/public/:companyId', getPublicCompanyProfile);

module.exports = router;
