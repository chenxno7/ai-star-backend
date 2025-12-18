import { Router } from 'express';
import userRoutes from './user';
import classRoutes from './class';

const router = Router();

router.use('/user', userRoutes);
router.use('/class', classRoutes);

export default router;
