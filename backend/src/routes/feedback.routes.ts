import { Router } from 'express';
import { feedbackController } from '../controllers/feedback.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/:interviewId', feedbackController.list);
router.post('/:interviewId', feedbackController.submit);

export default router;
