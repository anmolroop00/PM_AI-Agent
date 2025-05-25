const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', err);

  // Customize error responses based on error type
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }

  if (err.name === 'SequelizeValidationError') {
    // Handle Sequelize validation errors
    const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
    return res.status(400).json({ errors });
  }

  // Default error response
  res.status(500).json({ message: 'Internal server error' });
};

module.exports = { errorHandler };