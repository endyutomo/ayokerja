const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { authMiddleware, authorize } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

// All routes require authentication
router.use(authMiddleware);

// Get all devices
router.get('/', deviceController.getAll);

// Get device statistics
router.get('/stats/summary', deviceController.getStatistics);

// Get device by ID
router.get('/:id', deviceController.getById);

// Create device
router.post('/', authorize('admin', 'manager'), activityLogger('CREATE_DEVICE'), deviceController.create);

// Update device
router.put('/:id', authorize('admin', 'manager'), activityLogger('UPDATE_DEVICE'), deviceController.update);

// Delete device
router.delete('/:id', authorize('admin'), activityLogger('DELETE_DEVICE'), deviceController.delete);

// Test device connection
router.post('/:id/test-connection', authorize('admin', 'manager'), deviceController.testConnection);

// Restart device
router.post('/:id/restart', authorize('admin', 'manager'), activityLogger('RESTART_DEVICE'), deviceController.restart);

module.exports = router;
