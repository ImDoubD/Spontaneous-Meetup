import cron from 'node-cron';
import BroadcastService from './service/broadcastService';

const expirationWorker = cron.schedule('*/5 * * * *', async () => {
    try {
        console.log('Running broadcast expiration check');
        const result = await BroadcastService.expireBroadcasts();
        console.info(`Expired ${result.modifiedCount} broadcasts`);
    } catch (error) {
        console.error('Error expiring broadcasts:', error);
    }
});

export default expirationWorker;