// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const proteger = async (req, res, next) => {
  let token;

  // Revisamos si viene el token en el header "Authorization" y empieza con "Bearer"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extraemos el token (quitando la palabra 'Bearer ')
      token = req.headers.authorization.split(' ')[1];

      // Verificamos el token con nuestra llave secreta
      const descifrado = jwt.verify(token, process.env.JWT_SECRET);

      // Buscamos al usuario en la BD (sin la contraseña) y lo pegamos al objeto "req"
      req.user = await User.findById(descifrado.id).select('-password');

      next(); // Si todo está bien, pasamos a la siguiente función (el controlador)
    } catch (error) {
      console.error('Error de token:', error);
      res.status(401).json({ error: 'No autorizado, token fallido' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'No autorizado, no hay token' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.rol === 'admin') {
    next(); // Si es admin, lo dejamos pasar
  } else {
    res.status(403).json({ error: 'Acceso denegado. Se requiere perfil de administrador.' });
  }
};

export const protegerOpcional = async (req, res, next) => {
  let token;

  // Revisamos si trae un token en los headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.usuario = await Usuario.findById(decoded.id).select('-password');
    } catch (error) {
      console.error("Token inválido en protegerOpcional");
      // No lanzamos error, simplemente lo ignoramos
    }
  }

  // La magia ocurre aquí: NO hay un 'throw new Error' si no hay token.
  // Dejamos pasar la petición. Si es invitado, req.usuario será 'undefined'.
  next();
};