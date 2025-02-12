import { Request, Response } from 'express';
import BroadcastService from '../service/broadcastService';
import { validateCreateBroadcast } from '../validations';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

class BroadcastController {
    /**
     * Creates a new broadcast.
     * Validates request data using Zod and caches the broadcast in Redis.
     */
    async createBroadcast (req: Request, res: Response) {
        try {
            const authReq = req as AuthenticatedRequest;
            const validationResult = validateCreateBroadcast(req.body);
            if (!validationResult.success) {
                res.status(400).json({ error: validationResult.error.issues[0].message });
            }

            const broadcast = await BroadcastService.createBroadcast({
                ...validationResult.data,
                hostUserId: authReq.user.id,
            });

            res.status(201).json(broadcast);
        } catch (error) {
            console.error('Error creating broadcast:', error);
            res.status(500).json({ error: 'Server error' });
        }
    };
    
    /**
     * Retrieves active broadcasts near a given location.
     * Expects query parameters for longitude (lng), latitude (lat), and optionally a radius.
     */
    async getActiveBroadcasts(req: Request, res: Response) {
        try {
            const { lng, lat, radius = '5000' } = req.query;
            if (!lng || !lat) {
                res.status(400).json({ error: 'Query parameters lng and lat are required' });
            }
        
            const longitude = parseFloat(lng as string);
            const latitude = parseFloat(lat as string);
            const maxDistance = parseInt(radius as string, 10);
        
            const broadcasts = await BroadcastService.getActiveBroadcasts(longitude, latitude, maxDistance);
        
                res.json(broadcasts);
        } catch (error) {
            console.error('Error fetching active broadcasts:', error);
                res.status(500).json({ error: 'Server error' });
        }
    };
    
    /**
     * Allows an authenticated user to join a broadcast.
     * Sends a notification via Kafka upon a successful join.
     */
    async joinBroadcast(req: Request, res: Response){
        try {
            const authReq = req as AuthenticatedRequest;
            const broadcast = await BroadcastService.joinBroadcast(req.params.id, authReq.user.id);
            if (!broadcast) {
                res.status(404).json({ error: 'Broadcast not found' });
            }
            res.json(broadcast);
        } catch (error) {
            console.error('Error joining broadcast:', error);
                res.status(500).json({ error: 'Server error' });
        }
    }
};

export default new BroadcastController();