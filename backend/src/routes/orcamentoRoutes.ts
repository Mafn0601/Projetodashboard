import { Router } from 'express';
import orcamentoController from '../controllers/orcamentoController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', orcamentoController.findAll);
router.get('/:id', orcamentoController.findById);
router.post('/', orcamentoController.create);

export default router;
