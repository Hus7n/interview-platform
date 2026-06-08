import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/candidates', authorize('admin', 'interviewer'), userController.listCandidates);
router.get('/', authorize('admin'), userController.list);
router.patch('/:id/role', authorize('admin'), userController.updateRole);

export default router;
