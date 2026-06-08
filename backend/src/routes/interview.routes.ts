import { Router } from 'express';
import { interviewController } from '../controllers/interview.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', interviewController.list);
router.get('/room/:roomId', interviewController.getByRoom);
router.get('/:id', interviewController.get);
router.post('/', authorize('admin', 'interviewer'), interviewController.create);
router.patch('/:id', authorize('admin', 'interviewer'), interviewController.update);
router.delete('/:id', authorize('admin', 'interviewer'), interviewController.cancel);

export default router;
