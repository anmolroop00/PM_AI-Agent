// models/Post.js
// This is a simplified example. Consider using an ORM like Sequelize for more complex models.

const { pool } = require('../config/db');

const Post = {
  getAll: async () => {
    const result = await pool.query('SELECT * FROM posts');
    return result.rows;
  },
  getById: async (id) => {
    const result = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
    return result.rows[0];
  },
  create: async (title, content, authorId) => {
    const result = await pool.query(
      'INSERT INTO posts (title, content, author_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
      [title, content, authorId]
    );
    return result.rows[0];
  },
  update: async (id, title, content) => {
    const result = await pool.query(
      'UPDATE posts SET title = $2, content = $3, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, title, content]
    );
    return result.rows[0];
  },
  delete: async (id) => {
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);
  },
};

module.exports = Post;