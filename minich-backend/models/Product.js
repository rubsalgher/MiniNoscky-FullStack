// models/Product.js
import mongoose from 'mongoose';

// 1. Esquema para las Variantes (Subdocumento)
const variantSchema = new mongoose.Schema({
  sku: { 
    type: String, 
    required: false, 
    unique: true,
    trim: true
  },
  attributes: {
    // Aquí definimos características dinámicas
    color: { type: String, trim: true },
    size: { type: String, trim: true },
    scent: { type: String, trim: true }
  },
  price: { 
    type: Number, 
    required: true 
  },
  stock: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  images: [{
    // Guardamos la URL y el ID de Cloudinary (el ID es vital para poder borrarlas después)
    url: { type: String, required: true },
    public_id: { type: String, required: true }
  }]
});

// 2. Esquema Principal del Producto
const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    required: false 
  },
  category: { 
    type: String, 
    required: true, 
    index: true 
  },
  brand: { 
    type: String, 
    default: 'Mini Ch' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  // Arreglo que contiene las variantes del producto
  variants: [variantSchema] 
}, {
  // Añade automáticamente createdAt y updatedAt
  timestamps: true 
});

export default mongoose.model('Product', productSchema);