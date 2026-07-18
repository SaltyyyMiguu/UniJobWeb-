const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
  getPendingCompanies, verifyCompany, rejectCompany, getAllCompanies, getAllSupervisors,
  getDashboard, getAllStudents,
  getAllUsers, changeUserPassword, toggleUserArchive, updateUserProfile,
} = require('../controllers/adminController');

router.use(authenticateToken, authorizeRoles('ADMIN'));

router.get('/dashboard', getDashboard);
router.get('/students', getAllStudents);
router.get('/companies', getAllCompanies);
router.get('/companies/pending', getPendingCompanies);
router.put('/companies/:id/verify', verifyCompany);
router.delete('/companies/:id', rejectCompany);
router.get('/supervisors', getAllSupervisors);
router.get('/users', getAllUsers);
router.put('/users/:userId/password', changeUserPassword);
router.put('/users/:userId/profile', updateUserProfile);
router.put('/users/:userId/toggle-archive', toggleUserArchive);

module.exports = router;
