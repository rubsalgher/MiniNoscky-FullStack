// routes/orderRoutes.js
import express from 'express';
import { crearOrden, getMisOrdenes, getTodasLasOrdenes, actualizarEstadoOrden } from '../controllers/orderController.js';
import { proteger, protegerOpcional, admin } from '../middleware/authMiddleware.js'; // <-- Importamos el opcional

const router = express.Router();

// Ruta: POST /api/ordenes (Ahora usamos el flexible)
router.post('/', protegerOpcional, crearOrden);

// Las demás se quedan estrictas, porque un invitado no tiene historial ni es administrador
router.get('/mis-ordenes', proteger, getMisOrdenes);
router.get('/', proteger, admin, getTodasLasOrdenes);
router.put('/:id/estado', proteger, admin, actualizarEstadoOrden);

export default router;