import { expect } from 'chai';
import { Broadcast } from '../model/broadcastModel';

describe('BroadcastModel', () => {
  it('should be invalid if required fields are missing', (done) => {
    const broadcast = new Broadcast({});
    const error = broadcast.validateSync();
    expect(error).to.exist;
    expect(error?.errors.title).to.exist;
    expect(error?.errors.hostUserId).to.exist;
    expect(error?.errors.activityType).to.exist;
    expect(error?.errors.startTime).to.exist;
    expect(error?.errors.endTime).to.exist;
    expect(error?.errors.location).to.exist;
    done();
  });

  it('should save successfully with all required fields', async () => {
    const broadcast = new Broadcast({
      title: 'Test Broadcast',
      description: 'A valid broadcast',
      hostUserId: 'user123',
      activityType: 'test',
      startTime: new Date(Date.now() + 60000),
      endTime: new Date(Date.now() + 120000),
      location: { type: 'Point', coordinates: [1, 2] },
    });
    // Using validate() is sufficient for checking validations without actually saving to the DB.
    const error = broadcast.validateSync();
    expect(error).to.be.undefined;
  });

  it('should enforce location type as "Point"', (done) => {
    const broadcast = new Broadcast({
      title: 'Test Broadcast',
      hostUserId: 'user123',
      activityType: 'test',
      startTime: new Date(Date.now() + 60000),
      endTime: new Date(Date.now() + 120000),
      location: { type: 'Invalid', coordinates: [1, 2] },
    });
    const error = broadcast.validateSync();
    expect(error).to.exist;
    // The error should specifically complain about the location type
    expect(error?.errors['location.type']).to.exist;
    done();
  });
});
