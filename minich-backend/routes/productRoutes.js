// routes/productRoutes.js
import express from 'express';
import { upload } from '../config/cloudinary.js';
import { 
  createProduct, 
  getProducts, 
  getProductById,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { proteger, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta para obtener todos los productos (GET)
router.get('/', getProducts);

// Ruta para obtener un producto específico (GET)
router.get('/:id', getProductById);

// 👇 AQUÍ ESTÁ LA MAGIA: Agregamos upload.any() para que lea el FormData y las imágenes
router.post('/', proteger, admin, upload.any(), createProduct);

router.route('/:id')
  .put(proteger, admin, upload.any(), updateProduct) // Agregado también al PUT por si luego editas productos
  .delete(proteger, admin, deleteProduct);

export default router;