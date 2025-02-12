import { producer, consumer } from '../config/kafka';

export type SendNotificationParams = {
    type: 'BROADCAST_CREATED' | 'USER_JOINED' | 'BROADCAST_EXPIRED';
    userId: string;
    broadcastId: string;
    metadata?: Record<string, any>;
  };

class NotificationService {
  private static instance: NotificationService;

  private constructor() {
    this.setupConsumers();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async setupConsumers() {
    await consumer.connect();
    await consumer.subscribe({ topics: ['notifications'], fromBeginning: true });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const payload = JSON.parse(message.value?.toString() || '');
          console.log(`Processing notification: ${payload.type}`);
          
          // Add actual notification logic here
          // e.g., send email, push notification, etc.
          
        } catch (error) {
          console.error('Error processing notification:', error);
        }
      },
    });
  }

  public async sendNotification(params: SendNotificationParams) {
    try {
      await producer.send({
        topic: 'notifications',
        messages: [{
          value: JSON.stringify({
            type: params.type,
            userId: params.userId,
            broadcastId: params.broadcastId,
            timestamp: new Date(),
            metadata: params.metadata,
          }),
        }],
      });
      console.log(`Notification sent: ${params.type}`);
    } catch (error) {
        console.error('Error sending notification:', error);
      throw error;
    }
  }
}

export default NotificationService.getInstance();