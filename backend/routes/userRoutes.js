const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getActiveSupervisors, uploadCoverPhoto, uploadCoverPhotoMulter } = require('../controllers/userController');

router.use(authenticateToken);

router.get('/supervisors', getActiveSupervisors);
router.post('/cover-photo', uploadCoverPhotoMulter.single('coverPhoto'), uploadCoverPhoto);

module.exports = router;
