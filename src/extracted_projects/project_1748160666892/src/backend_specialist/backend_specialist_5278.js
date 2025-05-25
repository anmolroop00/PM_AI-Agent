// routes/postRoutes.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { protect } = require('../middleware/authMiddleware'); // Protects routes for logged-in users
const logger = require('../utils/logger');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const posts = await Post.getAll();
    res.json(posts);
  } catch (error) {
    logger.error(`Error getting posts: ${error.message}`);
    next(error); // Pass error to error handling middleware
  }
});

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.getById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    logger.error(`Error getting post by ID: ${error.message}`);
    next(error);
  }
});

// @desc    Create a post
// @route   POST /api/posts
// @access  Private (requires authentication)
router.post('/', protect, async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const authorId = req.user.id; // Get user ID from the authenticated user
    const post = await Post.create(title, content, authorId);
    res.status(201).json(post); // 201 Created
  } catch (error) {
    logger.error(`Error creating post: ${error.message}`);
    next(error);
  }
});

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private (requires authentication)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const post = await Post.update(req.params.id, title, content);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    logger.error(`Error updating post: ${error.message}`);
    next(error);
  }
});

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private (requires authentication)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    await Post.delete(req.params.id);
    res.status(204).send(); // 204 No Content (successful deletion)
  } catch (error) {
    logger.error(`Error deleting post: ${error.message}`);
    next(error);
  }
});

module.exports = router;