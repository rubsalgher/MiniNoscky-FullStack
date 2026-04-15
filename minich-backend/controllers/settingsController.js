// controllers/settingsController.js
import Settings from '../models/Settings.js';

export const getSettings = async (req, res) => {
  let settings = await Settings.findOne({ id: 'global' }).populate('carrusel.productosElegidos');
  if (!settings) {
    settings = await Settings.create({ id: 'global' });
  }
  res.json(settings);
};

export const updateSettings = async (req, res) => {
  const { envioHabilitado, costoEnvio, carrusel } = req.body;
  const settings = await Settings.findOneAndUpdate(
    { id: 'global' },
    { envioHabilitado, costoEnvio, carrusel },
    { returnDocument: 'after', upsert: true }
  );
  res.json(settings);
};