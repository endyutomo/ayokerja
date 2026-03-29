const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave-supabase.controller');
const { authMiddleware, authorize } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

// All routes require authentication
router.use(authMiddleware);

// Get all leave requests
router.get('/', leaveController.getAll);

// Get leave types
router.get('/types/all', leaveController.getLeaveTypes);

// Create leave type
router.post('/types', authorize('admin', 'manager', 'hr'), leaveController.createLeaveType);

// Get employee leave balance
router.get('/balance/:employeeId', leaveController.getLeaveBalance);

// Get leave request by ID
router.get('/:id', leaveController.getById);

// Create leave request
router.post('/', leaveController.create);

// Approve leave request
router.post('/:id/approve', authorize('admin', 'manager', 'hr'), activityLogger('APPROVE_LEAVE'), leaveController.approve);

// Reject leave request
router.post('/:id/reject', authorize('admin', 'manager', 'hr'), activityLogger('REJECT_LEAVE'), leaveController.reject);

module.exports = router;
