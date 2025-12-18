import { Router } from 'express';
import * as userController from '../controllers/user';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All user routes require auth
router.use(authMiddleware);

router.get('/me', userController.getMe);
router.post('/profile', userController.updateProfile);

export default router;
