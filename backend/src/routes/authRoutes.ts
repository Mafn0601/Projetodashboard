import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Rotas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rotas protegidas
router.get('/me', authenticate, authController.me);

export default router;
