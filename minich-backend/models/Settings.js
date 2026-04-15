// models/Settings.js
import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  id: { type: String, default: 'global' }, // Usaremos un solo documento
  envioHabilitado: { type: Boolean, default: false },
  costoEnvio: { type: Number, default: 0 },

  carrusel: {
    limite: {
      type: Number,
      required: true,
      default: 5,
      min: 3,
      max: 5
    },
    productosElegidos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product' // Hace referencia a tu catálogo
      }
    ]
  }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;