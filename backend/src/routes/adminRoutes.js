const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/faculty', adminController.getFacultyList);
router.put('/faculty/:id/toggle-status', adminController.toggleFacultyStatus);
router.post('/slots', adminController.createSlot);
router.put('/slots/:id', adminController.updateSlot);
router.delete('/slots/:id', adminController.deleteSlot);
router.post('/areas', adminController.createArea);
router.post('/allocate', adminController.directAllocation);
router.get('/reports', adminController.getReports);

module.exports = router;

