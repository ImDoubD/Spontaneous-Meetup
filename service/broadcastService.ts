import BroadcastModel, { IBroadcast } from '../model/broadcastModel';
import { redisClient } from '../config/redis';
// import { producer } from '../config/kafka';
import NotificationService from './notificationsService';

class BroadcastService {
  async createBroadcast(data: Partial<IBroadcast>): Promise<IBroadcast>{
    const broadcast = await BroadcastModel.create({
      ...data,
      status: 'active'
    });

    // Cache in Redis
    const ttl = Math.ceil((broadcast.endTime.getTime() - Date.now()) / 1000);
    await redisClient.setEx(
      `broadcast:${broadcast.id}`,
      ttl,
      JSON.stringify(broadcast.toJSON())
    );

    await NotificationService.sendNotification({
        type: 'BROADCAST_CREATED',
        userId: data.hostUserId as string,
        broadcastId: broadcast.id,
    });

    return broadcast;
  }

  async getActiveBroadcasts(lng: number, lat: number, radius: number) {
    return BroadcastModel.find({
      status: 'active',
      endTime: { $gt: new Date() },
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: radius,
        },
      },
    }).limit(100);
  }


  async joinBroadcast(broadcastId: string, userId: string) {
    const broadcast = await BroadcastModel.findOneAndUpdate(
      { _id: broadcastId, status: 'active' },
      { $addToSet: { participants: userId } },
      { new: true }
    );

    // Send notification via Kafka
    if (broadcast) {
        await NotificationService.sendNotification({
          type: 'USER_JOINED',
          userId,
          broadcastId,
          metadata: {
            participantsCount: broadcast.participants.length,
          },
        });
    }

    return broadcast;
  }

  async expireBroadcasts() {
    const now = new Date();
    return BroadcastModel.updateMany(
      { endTime: { $lte: now }, status: 'active' },
      { $set: { status: 'expired' } }
    );
  }
}

export default new BroadcastService();