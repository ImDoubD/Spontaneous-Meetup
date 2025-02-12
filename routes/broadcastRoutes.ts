import { Router } from 'express';
import BroadcastController from '../controller/broadcastController';
import authMiddleware from '../middlewares/authMiddleware';
import { rateLimit } from '../middlewares/rateLimit';

const router = Router();

router.post('/', authMiddleware, rateLimit.createBroadcast, BroadcastController.createBroadcast);
router.get('/', authMiddleware, BroadcastController.getActiveBroadcasts );
router.post('/join/:id', authMiddleware, rateLimit.joinBroadcast, BroadcastController.joinBroadcast);

export default router;