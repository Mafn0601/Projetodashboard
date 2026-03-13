import { Router } from 'express';
import statusController from '../controllers/statusController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', statusController.findAll);
router.get('/status/:status', statusController.findByStatus);
router.get('/:id', statusController.findById);
router.post('/', statusController.create);
router.put('/:id', statusController.update);
router.put('/:id/move', statusController.moveCard);
// exclusão: somente admin/gerente
router.delete('/:id', authorize('ADMIN', 'GERENTE'), statusController.delete);

export default router;
