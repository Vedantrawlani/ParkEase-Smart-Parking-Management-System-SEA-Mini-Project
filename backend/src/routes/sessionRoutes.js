const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/entry', authenticateToken, sessionController.recordEntry);
router.post('/exit', authenticateToken, sessionController.recordExit);
router.get('/active', authenticateToken, sessionController.getActiveSessions);
router.get('/history', authenticateToken, sessionController.getSessionHistory);

module.exports = router;

