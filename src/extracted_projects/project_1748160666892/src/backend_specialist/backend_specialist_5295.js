// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { protect, admin } = require('../middleware/authMiddleware'); // Protects routes, requires admin role
const logger = require('../utils/logger');

// @desc    Get all posts (Admin)
// @route   GET /api/admin/posts
// @access  Private/Admin
router.get('/posts', protect, admin, async (req, res, next) => {
  try {
    const posts = await Post.getAll();
    res.json(posts);
  } catch (error) {
    logger.error(`Error getting posts (admin): ${error.message}`);
    next(error);
  }
});

// @desc    Create a post (Admin)
// @route   POST /api/admin/posts
// @access  Private/Admin
router.post('/posts', protect, admin, async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const authorId = req.user.id; // Get user ID from the authenticated user
    const post = await Post.create(title, content, authorId);
    res.status(201).json(post); // 201 Created
  } catch (error) {
    logger.error(`Error creating post (admin): ${error.message}`);
    next(error);
  }
});

// @desc    Get post by ID (Admin)
// @route   GET /api/admin/posts/:id
// @access  Private/Admin
router.get('/posts/:id', protect, admin, async (req, res, next) => {
  try {
    const post = await Post.getById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    logger.error(`Error getting post by ID (admin): ${error.message}`);
    next(error);
  }
});

// @desc    Update a post (Admin)
// @route   PUT /api/admin/posts/:id
// @access  Private/Admin
router.put('/posts/:id', protect, admin, async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const post = await Post.update(req.params.id, title, content);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    logger.error(`Error updating post (admin): ${error.message}`);
    next(error);
  }
});

// @desc    Delete a post (Admin)
// @route   DELETE /api/admin/posts/:id
// @access  Private/Admin
router.delete('/posts/:id', protect, admin, async (req, res, next) => {
  try {
    await Post.delete(req.params.id);
    res.status(204).send(); // 204 No Content (successful deletion)
  } catch (error) {
    logger.error(`Error deleting post (admin): ${error.message}`);
    next(error);
  }
});

module.exports = router;