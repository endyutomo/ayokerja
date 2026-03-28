const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shift.controller');
const { authMiddleware, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get all shifts
router.get('/', shiftController.getAll);

// Get shift by ID
router.get('/:id', shiftController.getById);

// Create shift
router.post('/', authorize('admin', 'manager', 'hr'), shiftController.create);

// Update shift
router.put('/:id', authorize('admin', 'manager', 'hr'), shiftController.update);

// Delete shift
router.delete('/:id', authorize('admin'), shiftController.delete);

module.exports = router;
