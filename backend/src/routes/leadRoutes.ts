import { Router } from 'express';
import leadController from '../controllers/leadController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/summary', leadController.summary);
router.get('/', leadController.findAll);
router.get('/:id', leadController.findById);
router.post('/', leadController.create);
router.put('/:id', leadController.update);
router.delete('/:id', leadController.delete);

export default router;