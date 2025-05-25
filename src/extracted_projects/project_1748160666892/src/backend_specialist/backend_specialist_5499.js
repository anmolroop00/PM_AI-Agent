const express = require('express');
const router = express.Router();
const { Post } = require('../models'); // Sequelize model
const { validatePost } = require('../middleware/validation'); // Validation middleware
const logger = require('../utils/logger');

// GET all posts (with pagination)
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Post.findAndCountAll({
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']] // Order by creation date
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      posts: rows
    });
  } catch (error) {
    logger.error('Error fetching posts:', error);
    next(error); // Pass error to error handling middleware
  }
});

// GET a single post
router.get('/:id', async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    logger.error(`Error fetching post with ID ${req.params.id}:`, error);
    next(error);
  }
});

// POST a new post
router.post('/', validatePost, async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const newPost = await Post.create({ title, content, userId: req.user.id }); // Assuming user ID is in req.user
    res.status(201).json(newPost);
  } catch (error) {
    logger.error('Error creating post:', error);
    next(error);
  }
});

// PUT (update) an existing post
router.put('/:id', validatePost, async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { title, content } = req.body;

    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' }); // Check ownership
    }

    post.title = title;
    post.content = content;
    await post.save();

    res.json(post);
  } catch (error) {
    logger.error(`Error updating post with ID ${req.params.id}:`, error);
    next(error);
  }
});

// DELETE a post
router.delete('/:id', async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' }); // Check ownership
    }

    await post.destroy();
    res.status(204).send(); // No content
  } catch (error) {
    logger.error(`Error deleting post with ID ${req.params.id}:`, error);
    next(error);
  }
});

module.exports = router;