const redis = require('redis');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const redisClient = redis.createClient({
  url: process.env.REDIS_URI || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;
