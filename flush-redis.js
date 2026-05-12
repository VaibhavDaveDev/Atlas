const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

redis
  .flushall()
  .then(() => {
    console.log('Redis cache cleared!');
  })
  .catch((error) => {
    console.error('Failed to flush Redis:', error);
  })
  .finally(() => {
    redis.disconnect();
    process.exit(0);
  });
