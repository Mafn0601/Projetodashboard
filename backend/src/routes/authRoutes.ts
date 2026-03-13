import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticate, authorize } from '../middlewares/auth';
import { authRateLimit } from '../middlewares/security';

const router = Router();

// Rotas públicas
router.post('/register', authController.register);
router.post('/login', authRateLimit, authController.login);

// Rotas protegidas
router.get('/me', authenticate, authController.me);
router.patch('/change-password', authenticate, authController.changePassword);
router.get('/users', authenticate, authorize('ADMIN'), authController.listUsers);

export default router;
