// index.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { proteger, admin } from './middleware/authMiddleware.js';
import { getSettings, updateSettings } from './controllers/settingsController.js';
import paymentRoutes from './routes/paymentRoutes.js';
import orderRoutes from './routes/orderRoutes.js';


// 1. Cargar las variables de entorno (el archivo .env)
dotenv.config();

// 2. Conectar a la base de datos
connectDB();

// 3. Inicializar Express
const app = express();

// 4. Middlewares (configuraciones extra)
app.use(cors({
  origin: '*', // Esto permite que cualquier IP (incluida tu celular) se conecte
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Permite que tu servidor entienda datos en formato JSON

// Rutas de la API
app.use('/api/productos', productRoutes);
app.use('/api/usuarios', userRoutes);
app.get('/api/settings', getSettings);
app.put('/api/settings', proteger, admin, updateSettings);
app.use('/api/pagos', paymentRoutes);
app.use('/api/ordenes', orderRoutes);


// 5. Ruta de prueba básica
app.get('/', (req, res) => {
  res.send('API de Mini Ch Regalos y Accesorios funcionando al 100%...');
});

// 6. Encender el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});