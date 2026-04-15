// controllers/userController.js
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { enviarCorreoVerificacion } from '../utils/mailer.js';

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// --- 1. REGISTRAR UN NUEVO USUARIO ---
export const registrarUsuario = async (req, res) => {
  try {
    const { nombre, apellidos, email, password, telefono } = req.body;

    const usuarioExiste = await User.findOne({ email });
    if (usuarioExiste) {
      return res.status(400).json({ error: 'Este correo ya está registrado' });
    }

    // Generamos un código de verificación de 40 caracteres
    const tokenVerificacion = crypto.randomBytes(20).toString('hex');

    const user = await User.create({
      nombre,
      apellidos,
      email,
      password,
      telefono,
      verificationToken: tokenVerificacion // Guardamos el código en la base de datos
    });

    if (user) {
      // ¡Enviamos el correo real!
      await enviarCorreoVerificacion(user.email, user.nombre, tokenVerificacion);

      // Respondemos con un mensaje de éxito, pero SIN darle el JWT Token todavía
      res.status(201).json({
        mensaje: 'Cuenta creada con éxito. Por favor, revisa tu correo electrónico para activarla.'
      });
    } else {
      res.status(400).json({ error: 'Datos de usuario inválidos' });
    }
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Hubo un error al registrar al usuario' });
  }
};

// --- 2. INICIAR SESIÓN (LOGIN) ---
export const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      
      // --- NUEVO CANDADO: ¿Verificó su correo? ---
      if (!user.isVerified) {
        return res.status(401).json({ 
          error: 'Tu cuenta aún no está activada. Por favor, revisa tu bandeja de entrada o spam y haz clic en el enlace de verificación.' 
        });
      }

      res.json({
        _id: user._id,
        nombre: user.nombre,
        apellidos: user.apellidos, // <-- Faltaba esto
        email: user.email,
        telefono: user.telefono,
        rol: user.rol,
        direccion: user.direccion, // <-- ¡Faltaba la dirección!
        token: generarToken(user._id)
      });
    } else {
      res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Hubo un error al iniciar sesión' });
  }
};

// --- 3. NUEVA FUNCIÓN: ACTIVAR LA CUENTA ---
export const verificarCuenta = async (req, res) => {
  try {
    const { token } = req.params;
    const tokenLimpio = token.trim(); // Eliminamos cualquier espacio invisible
    
    console.log("-----------------------------------------");
    console.log("1. Buscando token recibido:", tokenLimpio);

    // Buscamos al usuario por el token
    const user = await User.findOne({ verificationToken: tokenLimpio });

    if (!user) {
      // SI NO LO ENCUENTRA: Vamos a imprimir el primer usuario que halle 
      // para ver cómo se llama el campo realmente en Atlas
      const pruebaUser = await User.findOne({});
      console.log("2. Token NO encontrado.");
      console.log("3. Datos del usuario en la BD actualmente:", JSON.stringify(pruebaUser, null, 2));
      console.log("-----------------------------------------");
      
      return res.status(400).json({ error: 'Enlace inválido o cuenta ya verificada.' });
    }

    // Si lo encuentra, procedemos
    user.isVerified = true;
    user.verificationToken = undefined; 
    await user.save();

    console.log("4. ¡Usuario verificado con éxito!");
    res.json({ mensaje: '¡Cuenta verificada con éxito! Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('Error al verificar:', error);
    res.status(500).json({ error: 'Hubo un error al verificar la cuenta' });
  }
};

// Actualizar el carrito en la BD
export const guardarCarrito = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.carrito = req.body.carrito;
      await user.save();
      res.json({ mensaje: 'Carrito guardado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar carrito' });
  }
};

// Obtener el carrito de la BD
export const obtenerCarrito = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.carrito || []);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener carrito' });
  }
};

export const actualizarPerfil = async (req, res) => {
  try {
    // Usamos req.user._id que es como lo tienes en tu middleware
    const user = await User.findById(req.user._id);

    if (user) {
      // 1. Actualizamos el teléfono (NUEVO)
      user.telefono = req.body.telefono || user.telefono;
      
      // 2. Si la dirección no existe, la inicializamos vacía para que no de error
      if (!user.direccion) user.direccion = {};
      
      // 3. Actualizamos la dirección (SIN EL IF, para que siempre guarde los cambios)
      user.direccion.calle = req.body.calle || user.direccion.calle;
      user.direccion.colonia = req.body.colonia || user.direccion.colonia;
      user.direccion.ciudad = req.body.ciudad || user.direccion.ciudad;
      user.direccion.estado = req.body.estado || user.direccion.estado;
      user.direccion.cp = req.body.cp || user.direccion.cp;

      const usuarioActualizado = await user.save();
      
      // 4. Devolvemos el paquete COMPLETO (NUEVO: Incluye teléfono y token)
      res.json({
        _id: usuarioActualizado._id,
        nombre: usuarioActualizado.nombre,
        apellidos: usuarioActualizado.apellidos,
        email: usuarioActualizado.email,
        telefono: usuarioActualizado.telefono,
        direccion: usuarioActualizado.direccion,
        rol: usuarioActualizado.rol,
        token: req.headers.authorization.split(' ')[1] // Mantenemos la sesión viva
      });
    } else {
      res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el perfil' });
  }
};