// routes/userRoutes.js
import express from 'express';
import { proteger } from '../middleware/authMiddleware.js';

// Agrupamos todas las funciones que vienen de tu controlador en una sola importación limpia
import { 
  registrarUsuario, 
  loginUsuario, 
  verificarCuenta,
  obtenerCarrito, 
  guardarCarrito,
  actualizarPerfil 
} from '../controllers/userController.js';

const router = express.Router();

// Ruta para crear un usuario (POST http://localhost:5000/api/usuarios/registro)
router.post('/registro', registrarUsuario);

// Ruta para iniciar sesión (POST http://localhost:5000/api/usuarios/login)
router.post('/login', loginUsuario);

// Ruta para el link del correo
router.get('/verificar/:token', verificarCuenta);

// Rutas para el carrito
router.route('/carrito')
  .get(proteger, obtenerCarrito)
  .post(proteger, guardarCarrito);

// 👇 AQUÍ ESTÁ LA CORRECCIÓN: Una sola ruta limpia y directa
router.put('/perfil', proteger, actualizarPerfil);

export default router;