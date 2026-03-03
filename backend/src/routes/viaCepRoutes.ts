import { Router } from 'express';
import { viaCepController } from '../controllers/viaCepController';

const router = Router();

// GET /api/cep/:cep - Buscar endereço por CEP
router.get('/:cep', viaCepController.search);

export default router;
