const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get dashboard statistics
router.get('/statistics', dashboardController.getStatistics);

// Get weekly chart data
router.get('/weekly-chart', dashboardController.getWeeklyChart);

// Get monthly summary
router.get('/monthly-summary', dashboardController.getMonthlySummary);

// Get department-wise attendance
router.get('/department-attendance', dashboardController.getDepartmentAttendance);

// Get overtime summary
router.get('/overtime-summary', dashboardController.getOvertimeSummary);

// Get late arrivals
router.get('/late-arrivals', dashboardController.getLateArrivals);

module.exports = router;
