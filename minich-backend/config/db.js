// config/db.js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Intentamos conectar usando la URI de nuestro archivo .env
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`¡Éxito! MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error al conectar a MongoDB: ${error.message}`);
    process.exit(1); // Detiene la app si falla la conexión
  }
};

export default connectDB;