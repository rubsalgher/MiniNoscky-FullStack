// config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Conexión usando tus datos del .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de la carpeta destino
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'miniCh', // <--- ¡Aquí le indicamos que use tu nueva carpeta!
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  }
});

const upload = multer({ storage: storage });

export { cloudinary, upload };