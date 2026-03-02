import { Router } from 'express';
import veiculoController from '../controllers/veiculoController';

const router = Router();

// GET all veículos com filtros
router.get('/', (req, res, next) => veiculoController.findAll(req, res, next));

// GET veículo por ID
router.get('/:id', (req, res, next) => veiculoController.findById(req, res, next));

// POST novo veículo
router.post('/', (req, res, next) => veiculoController.create(req, res, next));

// PUT atualizar veículo
router.put('/:id', (req, res, next) => veiculoController.update(req, res, next));

// DELETE veículo
router.delete('/:id', (req, res, next) => veiculoController.delete(req, res, next));

export default router;
