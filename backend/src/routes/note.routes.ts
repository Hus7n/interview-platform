import { Router } from 'express';
import { noteController } from '../controllers/note.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/:interviewId', noteController.list);
router.put('/:interviewId', noteController.save);

export default router;
