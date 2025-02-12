import app from './app';
import expirationWorker from './worker';
import { connectKafka } from './config/kafka';
import { connectDB } from './config/database';
import { connectRedis, redisClient } from './config/redis';

// Import routes AFTER connection (see below)
let broadcastRoutes: any;
let authRoutes: any;

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to the database
    await connectDB();
    console.log('Database connected.');

    // Connect to Redis
    await connectRedis();
    console.log('Redis connected.');
    const pingResponse = await redisClient.ping();
    console.log('Redis ping response:', pingResponse);

    // Connect to Kafka
    await connectKafka();
    console.log('Kafka connected.');

    // Now that all external services are connected,
    // import and register routes which use rate limiting (Redis)
    broadcastRoutes = (await import('./routes/broadcastRoutes')).default;
    authRoutes = (await import('./routes/authRoutes')).default;
    app.use('/broadcasts', broadcastRoutes);
    app.use('/users', authRoutes);

    // Start background worker and then the server
    expirationWorker.start();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  try {
    await redisClient.quit();
    console.log('Redis client closed.');
  } catch (err) {
    console.error('Error closing Redis client:', err);
  }
  process.exit(0);
});

startServer();
