const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan'); // Logging
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
const { errorHandler } = require('./middleware/errorHandler'); // Centralized error handling
const { authenticateToken } = require('./middleware/auth'); // Authentication middleware
const logger = require('./utils/logger'); // Custom logger

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } })); // Logging HTTP requests

// Routes
app.use('/api/posts', authenticateToken, postRoutes); // Secure post routes
app.use('/api/users', userRoutes);

// Error handling middleware (must be defined after routes)
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});