const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authMiddleware, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Attendance report
router.get('/attendance', authorize('admin', 'manager', 'hr'), reportController.getAttendanceReport);

// Employee summary report
router.get('/employee-summary', authorize('admin', 'manager', 'hr'), reportController.getEmployeeSummaryReport);

// Late report
router.get('/late', authorize('admin', 'manager', 'hr'), reportController.getLateReport);

// Overtime report
router.get('/overtime', authorize('admin', 'manager', 'hr'), reportController.getOvertimeReport);

// Leave report
router.get('/leave', authorize('admin', 'manager', 'hr'), reportController.getLeaveReport);

// Device activity report
router.get('/device', authorize('admin', 'manager'), reportController.getDeviceReport);

module.exports = router;
