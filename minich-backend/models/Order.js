// models/Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'User'
  },
  cliente: {
    nombre: { type: String },
    email: { type: String }
  },
  productos: [
    {
      name: { type: String, required: true },
      cantidad: { type: Number, required: true },
      image: { type: String },
      price: { type: Number, required: true },
      color: String,
      size: String,
      productoId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
      }
    }
  ],
  direccionEnvio: {
    calle: { type: String, required: true },
    colonia: { type: String, required: true },
    ciudad: { type: String, required: true },
    estado: { type: String, required: true },
    cp: { type: String, required: true }
  },
  metodoPago: {
    type: String,
    required: true,
    default: 'Stripe'
  },
  resultadoPago: {
    id: String, // ID de Stripe (payment_intent)
    status: String,
    email_address: String
  },
  precioEnvio: {
    type: Number,
    required: false,
    default: 0.0
  },
  precioTotal: {
    type: Number,
    required: true,
    default: 0.0
  },
  estado: {
    type: String,
    default: 'Pendiente'
  },
  isPagado: {
    type: Boolean,
    required: true,
    default: false
  },
  pagadoEn: {
    type: Date
  },
  isEnviado: {
    type: Boolean,
    required: true,
    default: false
  },
  enviadoEn: {
    type: Date
  },
  metodoEntrega: { 
  type: String, 
  enum: ['recoleccion', 'envio'], 
  required: true 
},
  guiaEnvio: { type: String, default: '' },
  linkRastreo: { type: String, default: '' },
  paqueteria: { type: String, default: '' }
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
export default Order;