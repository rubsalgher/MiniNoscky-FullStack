// routes/paymentRoutes.js
import express from 'express';
import { crearIntentoPago } from '../controllers/paymentController.js';
// Podrías importar tu middleware de proteger si quieres que solo logueados paguen
// import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/crear-intento', crearIntentoPago);

export default router;