import { RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis';

const createRateLimiter = (wMs: number, mx: number, msg: string) => {
  if (!redisClient.isOpen) {
    throw new Error('Redis client not connected when initializing rate limiter');
  }

  return require('express-rate-limit')({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    }),
    windowMs: wMs,
    max: mx,
    message: msg,
    standardHeaders: true,
    legacyHeaders: false
  });
};

export const rateLimit = {
  global: createRateLimiter(
    15 * 60 * 1000, 
    1000,
    'Too many requests from this IP, please try again later'
  ),
  createBroadcast: createRateLimiter(
    60 * 60 * 1000, 
    10,
    'Too many broadcasts created, please try again later'
  ),
  joinBroadcast: createRateLimiter(
    15 * 60 * 1000, 
    30,
    'Too many join attempts, please try again later'
  ),
  leaveBroadcast: createRateLimiter(
    15 * 60 * 1000, 
    30,
    'Too many leave attempts, please try again later'
  )
};