import { expect } from 'chai';
import sinon from 'sinon';
import { Request, Response } from 'express';
import BroadcastController from '../controller/broadcastController';
import BroadcastService from '../service/broadcastService';
import * as validations from '../validations';

describe('BroadcastController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let createBroadcastStub: sinon.SinonStub;
  let getActiveBroadcastsStub: sinon.SinonStub;
  let joinBroadcastStub: sinon.SinonStub;
  let validateCreateBroadcastStub: sinon.SinonStub;

  beforeEach(() => {
    req = { body: {}, query: {}, params: {} };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
    };

    // Stub service methods
    createBroadcastStub = sinon.stub(BroadcastService, 'createBroadcast');
    getActiveBroadcastsStub = sinon.stub(BroadcastService, 'getActiveBroadcasts');
    joinBroadcastStub = sinon.stub(BroadcastService, 'joinBroadcast');

    // Stub validation method
    validateCreateBroadcastStub = sinon.stub(validations, 'validateCreateBroadcast');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createBroadcast', () => {
    it('should create a broadcast and return 201 status', async () => {
      // Prepare valid request body
      req.body = {
        title: 'Test Broadcast',
        description: 'A sample broadcast',
        activityType: 'test',
        startTime: new Date(Date.now() + 60000).toISOString(),
        endTime: new Date(Date.now() + 120000).toISOString(),
        location: { type: 'Point', coordinates: [1, 2] },
      };
      // Simulate validation success returning the same data
      validateCreateBroadcastStub.returns({ success: true, data: req.body });
      // Simulate authenticated user attached to req (via auth middleware)
      (req as any).user = { id: 'user123' };

      const fakeBroadcast = { id: 'abc', ...req.body, hostUserId: 'user123' };
      createBroadcastStub.resolves(fakeBroadcast);

      await BroadcastController.createBroadcast(req as Request, res as Response);

      sinon.assert.calledOnce(validateCreateBroadcastStub);
      sinon.assert.calledOnce(createBroadcastStub);
      sinon.assert.calledWith(res.status as sinon.SinonStub, 201);
      sinon.assert.calledWith(res.json as sinon.SinonStub, fakeBroadcast);
    });

    it('should return 400 if validation fails', async () => {
      req.body = { title: 'Test Broadcast' }; // missing many required fields
      validateCreateBroadcastStub.returns({
        success: false,
        error: { issues: [{ message: 'Validation error: missing required fields' }] },
      });
      await BroadcastController.createBroadcast(req as Request, res as Response);
      sinon.assert.calledWith(res.status as sinon.SinonStub, 400);
      sinon.assert.calledWith(
        res.json as sinon.SinonStub,
        { error: 'Validation error: missing required fields' }
      );
    });

    it('should return 500 if service throws an error', async () => {
      req.body = {
        title: 'Test Broadcast',
        description: 'A sample broadcast',
        activityType: 'test',
        startTime: new Date(Date.now() + 60000).toISOString(),
        endTime: new Date(Date.now() + 120000).toISOString(),
        location: { type: 'Point', coordinates: [1, 2] },
      };
      validateCreateBroadcastStub.returns({ success: true, data: req.body });
      (req as any).user = { id: 'user123' };
      createBroadcastStub.rejects(new Error('Service error'));

      await BroadcastController.createBroadcast(req as Request, res as Response);
      sinon.assert.calledWith(res.status as sinon.SinonStub, 500);
    });
  });

  describe('getActiveBroadcasts', () => {
    it('should return 400 if lng or lat are missing', async () => {
      req.query = {};
      await BroadcastController.getActiveBroadcasts(req as Request, res as Response);
      sinon.assert.calledWith(res.status as sinon.SinonStub, 400);
    });

    it('should return active broadcasts', async () => {
      req.query = { lng: '1', lat: '2', radius: '5000' };
      const fakeBroadcasts = [{ id: 'abc', title: 'Test Broadcast' }];
      getActiveBroadcastsStub.resolves(fakeBroadcasts);

      await BroadcastController.getActiveBroadcasts(req as Request, res as Response);
      sinon.assert.calledOnce(getActiveBroadcastsStub);
      sinon.assert.calledWith(res.json as sinon.SinonStub, fakeBroadcasts);
    });

    it('should return 500 if service throws an error', async () => {
      req.query = { lng: '1', lat: '2' };
      getActiveBroadcastsStub.rejects(new Error('Service error'));

      await BroadcastController.getActiveBroadcasts(req as Request, res as Response);
      sinon.assert.calledWith(res.status as sinon.SinonStub, 500);
    });
  });

  describe('joinBroadcast', () => {
    it('should join broadcast and return updated broadcast', async () => {
      req.params = { id: 'abc' };
      (req as any).user = { id: 'user123' };
      const updatedBroadcast = { id: 'abc', participants: ['user123'] };
      joinBroadcastStub.resolves(updatedBroadcast);

      await BroadcastController.joinBroadcast(req as Request, res as Response);
      sinon.assert.calledOnce(joinBroadcastStub);
      sinon.assert.calledWith(res.json as sinon.SinonStub, updatedBroadcast);
    });

    it('should return 404 if broadcast is not found', async () => {
      req.params = { id: 'abc' };
      (req as any).user = { id: 'user123' };
      joinBroadcastStub.resolves(null);

      await BroadcastController.joinBroadcast(req as Request, res as Response);
      sinon.assert.calledWith(res.status as sinon.SinonStub, 404);
    });

    it('should return 500 if service throws an error', async () => {
      req.params = { id: 'abc' };
      (req as any).user = { id: 'user123' };
      joinBroadcastStub.rejects(new Error('Service error'));

      await BroadcastController.joinBroadcast(req as Request, res as Response);
      sinon.assert.calledWith(res.status as sinon.SinonStub, 500);
    });
  });
});
