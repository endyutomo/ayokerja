const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authMiddleware, authorize } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

// All routes require authentication
router.use(authMiddleware);

// Get all attendance records
router.get('/', attendanceController.getAll);

// Get today's attendance
router.get('/today', attendanceController.getToday);

// Get attendance summary
router.get('/summary', attendanceController.getSummary);

// Manual check-in/check-out
router.post('/manual', authorize('admin', 'manager', 'hr'), activityLogger('MANUAL_ATTENDANCE'), attendanceController.manualAttendance);

// Process attendance logs
router.post('/process-logs', authorize('admin'), attendanceController.processLogs);

// Get attendance by ID
router.get('/:id', attendanceController.getById);

// Update attendance
router.put('/:id', authorize('admin', 'manager', 'hr'), activityLogger('UPDATE_ATTENDANCE'), attendanceController.update);

// Delete attendance
router.delete('/:id', authorize('admin'), activityLogger('DELETE_ATTENDANCE'), attendanceController.delete);

module.exports = router;
