const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department-supabase.controller');
const { authMiddleware, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get all departments
router.get('/', departmentController.getAll);

// Get department by ID
router.get('/:id', departmentController.getById);

// Create department
router.post('/', authorize('admin', 'manager'), departmentController.create);

// Update department
router.put('/:id', authorize('admin', 'manager'), departmentController.update);

// Delete department
router.delete('/:id', authorize('admin'), departmentController.delete);

module.exports = router;
