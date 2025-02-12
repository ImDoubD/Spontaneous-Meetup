import dotenv from "dotenv";
import { createClient } from 'redis';

dotenv.config();

const redisClient = createClient({
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: 19148
    }
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis connecting...'));
redisClient.on('ready', () => console.log('Redis connected'));

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
        // Test connection
        await redisClient.set('connection-test', 'OK');
        const res = await redisClient.get('connection-test');
        console.log('Redis connection test:', res === 'OK' ? 'Success' : 'Failed');
    }
    return redisClient;
};

export { redisClient };