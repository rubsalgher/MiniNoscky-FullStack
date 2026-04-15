// routes/orderRoutes.js
import express from 'express';
import { crearOrden, getMisOrdenes, getTodasLasOrdenes, actualizarEstadoOrden } from '../controllers/orderController.js';
import { proteger, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta: POST /api/ordenes
router.post('/', proteger, crearOrden);
router.get('/mis-ordenes', proteger, getMisOrdenes);

router.get('/', proteger, admin, getTodasLasOrdenes);
router.put('/:id/estado', proteger, admin, actualizarEstadoOrden);

export default router;