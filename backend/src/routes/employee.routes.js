const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authMiddleware, authorize } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

// All routes require authentication
router.use(authMiddleware);

// Get all employees
router.get('/', employeeController.getAll);

// Get employee by ID
router.get('/:id', employeeController.getById);

// Create employee
router.post('/', authorize('admin', 'manager'), activityLogger('CREATE_EMPLOYEE'), employeeController.create);

// Update employee
router.put('/:id', authorize('admin', 'manager'), activityLogger('UPDATE_EMPLOYEE'), employeeController.update);

// Delete employee
router.delete('/:id', authorize('admin'), activityLogger('DELETE_EMPLOYEE'), employeeController.delete);

// Get employee attendance summary
router.get('/:id/attendance-summary', employeeController.getAttendanceSummary);

module.exports = router;
