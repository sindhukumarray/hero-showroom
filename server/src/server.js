const dotenv = require('dotenv');

// Load environment variables before importing app and database configs
dotenv.config();

const app = require('./app');
const { connectDB } = require('./config/database');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn(
        '[Database Warning] MONGODB_URI is not configured in environment. Server starting without database connection for testing/health verification.'
      );
    } else {
      await connectDB();
    }
  } catch (error) {
    console.error(`[Database Startup Error] ${error.message}`);
    if (NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  const server = app.listen(PORT, () => {
    console.log(`[Server] Hero Showroom API running on port ${PORT} [Mode: ${NODE_ENV}]`);
    console.log(`[Server] Health Check available at http://localhost:${PORT}/api/health`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('[Unhandled Rejection]', err.message);
    server.close(() => process.exit(1));
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('[Uncaught Exception]', err.message);
    process.exit(1);
  });

  return server;
};

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
