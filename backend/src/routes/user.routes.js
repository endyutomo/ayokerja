const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authMiddleware, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get all users
router.get('/', authorize('admin', 'manager'), userController.getAll);

// Get user by ID
router.get('/:id', userController.getById);

// Create user
router.post('/', authorize('admin', 'manager'), userController.create);

// Update user
router.put('/:id', userController.update);

// Delete user
router.delete('/:id', authorize('admin'), userController.delete);

// Get user permissions
router.get('/:id/permissions', userController.getPermissions);

// Update user permissions
router.put('/:id/permissions', authorize('admin'), userController.updatePermissions);

module.exports = router;
