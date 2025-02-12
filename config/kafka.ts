import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'meetup-service',
  brokers: ['localhost:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'notification-group', allowAutoTopicCreation: true });

const connectKafka = async () => {
    try {
        await producer.connect();
        await consumer.connect();
        console.log('Kafka connected successfully');
    } catch (error) {
        console.error('Kafka connection error:', error);
        process.exit(1);
    }
};

export { producer, consumer, connectKafka };