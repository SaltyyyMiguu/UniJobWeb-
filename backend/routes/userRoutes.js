const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getActiveSupervisors } = require('../controllers/userController');

router.use(authenticateToken);

router.get('/supervisors', getActiveSupervisors);

module.exports = router;
