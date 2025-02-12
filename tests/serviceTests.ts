import { expect } from 'chai';
import sinon from 'sinon';
import { Broadcast } from '../model/broadcastModel';
import broadcastService from '../service/broadcastService';
import { redisClient } from '../config/redis';
import { producer } from '../config/kafka';

describe('BroadcastService', () => {
  let createStub: sinon.SinonStub;
  let findStub: sinon.SinonStub;
  let findOneAndUpdateStub: sinon.SinonStub;
  let updateManyStub: sinon.SinonStub;
  let redisSetExStub: sinon.SinonStub;
  let producerSendStub: sinon.SinonStub;

  beforeEach(() => {
    // Stub Mongoose model methods
    createStub = sinon.stub(Broadcast, 'create');
    findStub = sinon.stub(Broadcast, 'find');
    findOneAndUpdateStub = sinon.stub(Broadcast, 'findOneAndUpdate');
    updateManyStub = sinon.stub(Broadcast, 'updateMany');

    // Stub Redis and Kafka methods
    redisSetExStub = sinon.stub(redisClient, 'setEx');
    producerSendStub = sinon.stub(producer, 'send').resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createBroadcast', () => {
    it('should create a broadcast, cache it in redis, and return the broadcast', async () => {
      const now = Date.now();
      const startTime = new Date(now + 60000);
      const endTime = new Date(now + 120000);
      const data = {
        title: 'Test Broadcast',
        description: 'Desc',
        hostUserId: 'user123',
        activityType: 'test',
        startTime,
        endTime,
        location: { 
            type: 'Point' as const, 
            coordinates: [1, 2] as [number, number] 
        },
      };
      const fakeBroadcast = { id: 'abc', toJSON: () => data, endTime };
      createStub.resolves(fakeBroadcast);
      redisSetExStub.resolves();

      const result = await broadcastService.createBroadcast(data);
      expect(result).to.equal(fakeBroadcast);
      sinon.assert.calledOnce(createStub);
      sinon.assert.calledOnce(redisSetExStub);
    });

    it('should throw an error if broadcast creation fails', async () => {
      const data = {
        title: 'Test',
        hostUserId: 'user123',
        activityType: 'test',
        startTime: new Date(),
        endTime: new Date(),
        location: { 
            type: 'Point' as const, 
            coordinates: [1, 2] as [number, number] 
        },
      };
      createStub.rejects(new Error('Creation error'));
      try {
        await broadcastService.createBroadcast(data);
      } catch (error) {
        expect((error as Error).message).to.equal('Creation error');
      }
    });
  });

  describe('getActiveBroadcasts', () => {
    it('should return active broadcasts based on geolocation', async () => {
      const fakeBroadcasts = [{ id: 'abc', title: 'Test Broadcast' }];
      // Stub find() to return an object with a limit() method
      findStub.returns({ limit: sinon.stub().returns(Promise.resolve(fakeBroadcasts)) });
      const result = await broadcastService.getActiveBroadcasts(1, 2, 5000);
      expect(result).to.deep.equal(fakeBroadcasts);
    });

    it('should throw an error if find fails', async () => {
      findStub.throws(new Error('Find error'));
      try {
        await broadcastService.getActiveBroadcasts(1, 2, 5000);
      } catch (error) {
        expect((error as Error).message).to.equal('Find error');
      }
    });
  });

  describe('joinBroadcast', () => {
    it('should update broadcast participants, send a notification, and return the updated broadcast', async () => {
      const updatedBroadcast = { id: 'abc', participants: ['user123'] };
      findOneAndUpdateStub.resolves(updatedBroadcast);
      const result = await broadcastService.joinBroadcast('abc', 'user123');
      expect(result).to.equal(updatedBroadcast);
      sinon.assert.calledOnce(findOneAndUpdateStub);
      sinon.assert.calledOnce(producerSendStub);
    });

    it('should return null if the broadcast is not found', async () => {
      findOneAndUpdateStub.resolves(null);
      const result = await broadcastService.joinBroadcast('invalid', 'user123');
      expect(result).to.be.null;
    });

    it('should throw an error if joining fails', async () => {
      findOneAndUpdateStub.rejects(new Error('Join error'));
      try {
        await broadcastService.joinBroadcast('abc', 'user123');
      } catch (error) {
        expect((error as Error).message).to.equal('Join error');
      }
    });
  });

  describe('expireBroadcasts', () => {
    it('should update broadcasts to expired', async () => {
      updateManyStub.resolves({ modifiedCount: 1 });
      const result = await broadcastService.expireBroadcasts();
      expect(result).to.deep.equal({ modifiedCount: 1 });
      sinon.assert.calledOnce(updateManyStub);
    });

    it('should throw an error if updateMany fails', async () => {
      updateManyStub.rejects(new Error('Expire error'));
      try {
        await broadcastService.expireBroadcasts();
      } catch (error) {
        expect((error as Error).message).to.equal('Expire error');
      }
    });
  });
});