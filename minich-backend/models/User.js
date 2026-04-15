// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: true 
  },
  apellidos: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true // Evita que dos personas se registren con el mismo correo
  },
  password: { 
    type: String, 
    required: true 
  },
  telefono: { 
    type: String, 
    required: true 
  },
  direccion: {
    calle: String,
    colonia: String,
    ciudad: String,
    estado: String,
    cp: String
  },
  rol: { 
    type: String, 
    default: 'cliente' // Por defecto todos son clientes. Luego te enseñaré a hacerte 'admin'
  },
  isVerified: {
    type: Boolean,
    default: false // Todos inician como "falso" hasta que den clic en el correo
  },
  verificationToken: {
    type: String, // Aquí guardaremos el código único que le enviaremos
    required: false
  },
  carrito: [
    {
      productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      price: Number,
      color: String,
      size: String,
      image: String,
      cantidad: Number,
      stock: Number
    }
  ],
}, {
  timestamps: true // Guarda la fecha de creación automáticamente
});

// --- MAGIA DE SEGURIDAD ---
// Justo antes de guardar el usuario en MongoDB, ejecutamos esto:
userSchema.pre('save', async function () {
  // Si la contraseña no se cambió, simplemente salimos de la función
  if (!this.isModified('password')) {
    return; 
  }

  // Si es nueva o cambió, la encriptamos
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Agregamos un método útil para comparar contraseñas cuando intenten iniciar sesión
userSchema.methods.matchPassword = async function (passwordIngresada) {
  return await bcrypt.compare(passwordIngresada, this.password);
};


const User = mongoose.model('User', userSchema);
export default User;