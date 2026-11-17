const express = require('express');
const router = express.Router();
const engineeringController = require('../controllers/engineeringController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Requirements & Tests can be viewed by anyone or faculty/admin
router.get('/requirements', engineeringController.getRequirements);
router.get('/test-cases', engineeringController.getTestCases);
router.get('/defects', engineeringController.getDefects);
router.get('/health', engineeringController.getSystemHealth);

// Test execution, defect modification, and audit logs
router.post('/run-tests', authenticateToken, engineeringController.runAutomatedTests);
router.post('/defects', authenticateToken, engineeringController.createDefect);
router.put('/defects/:id', authenticateToken, requireAdmin, engineeringController.updateDefect);
router.get('/audit-logs', authenticateToken, requireAdmin, engineeringController.getAuditLogs);

module.exports = router;

