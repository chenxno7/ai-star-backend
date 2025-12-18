import { Router } from 'express';
import * as classController from '../controllers/class';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All class routes require auth
router.use(authMiddleware);

router.get('/', classController.getMyClasses);
router.post('/', classController.createClass);
router.get('/:id', classController.getClass);
router.post('/:id/student', classController.addStudent);
router.post('/:id/log', classController.addLog);

export default router;
