// controllers/orderController.js
import { enviarCorreoCompra } from '../utils/mailer.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

export const crearOrden = async (req, res) => {
  try {

    console.log("=== DEBUG BACKEND: CREAR ORDEN ===");
    console.log("1. req.body.usuarioId:", req.body.usuarioId);
    console.log("2. req.user (desde token):", req.user ? req.user._id : "No hay req.user");
    console.log("3. req.usuario (desde token):", req.usuario ? req.usuario._id : "No hay req.usuario");
    
    // Recibimos el objeto "cliente" que configuramos en el frontend
    const { productos, direccionEnvio, resultadoPago, cliente, metodoEntrega, usuarioId } = req.body;
    const montoFinal = req.body.precioTotal || req.body.total || 0;
    
    // Nuestro middleware opcional puede devolver req.usuario o req.user dependiendo de cómo lo escribiste
    const currentUser = req.usuario || req.user; 
    const idFinal = currentUser ? currentUser._id : usuarioId;

    console.log("4. ID FINAL QUE SE INTENTARÁ GUARDAR:", idFinalUsuario);
    
    // 1. Validar que vengan productos
    if (productos && productos.length === 0) {
      return res.status(400).json({ mensaje: 'No hay productos en la orden' });
    }

    // 2. Crear la nueva orden en memoria
    const orden = new Order({
      usuario: currentUser ? currentUser._id : undefined, // Si es invitado, no hay ID de cuenta
      cliente: cliente, // Guardamos los datos del contacto (vital para invitados)
      productos,
      direccionEnvio,
      metodoEntrega: metodoEntrega || 'envio',
      precioTotal: montoFinal,
      estado: 'Pendiente',
      resultadoPago,
      isPagado: true, 
      pagadoEn: Date.now(),
      metodoPago: 'Stripe'
    });

    // 3. ¡Guardar en MongoDB!
    const ordenGuardada = await orden.save();

    // 3.5. DESCONTAR EL STOCK DE LA BASE DE DATOS (Se queda igual)
    for (const item of orden.productos) {
      const productoDb = await Product.findById(item.productoId);
      
      if (productoDb && productoDb.variants && productoDb.variants.length > 0) {
        let varianteIndex = 0;
        if (productoDb.variants.length > 1) {
           const indexEncontrado = productoDb.variants.findIndex(v => 
             (v.attributes?.color === item.color || (!v.attributes?.color && !item.color)) &&
             (v.attributes?.size === item.size || (!v.attributes?.size && !item.size))
           );
           if (indexEncontrado !== -1) varianteIndex = indexEncontrado;
        }

        productoDb.variants[varianteIndex].stock -= item.cantidad;
        if (productoDb.variants[varianteIndex].stock < 0) {
          productoDb.variants[varianteIndex].stock = 0;
        }
        
        productoDb.markModified('variants');
        await productoDb.save();
      }
    }
    
    // 4. Vaciar el carrito de la base de datos SOLO si es un usuario registrado
    if (currentUser) {
      await User.findByIdAndUpdate(currentUser._id, { carrito: [] });
    }

    // 5. Enviar el correo inteligente (Usa los datos de la cuenta o los del formulario de invitado)
    const emailDestino = currentUser ? currentUser.email : cliente?.email;
    const nombreDestino = currentUser ? currentUser.nombre : cliente?.nombre;
    
    if (emailDestino) {
      await enviarCorreoCompra(emailDestino, nombreDestino, ordenGuardada);
    }

    // 6. Responder al frontend que todo fue un éxito
    res.status(201).json(ordenGuardada);

  } catch (error) {
    console.error("Error al crear la orden en la BD:", error);
    res.status(500).json({ mensaje: 'Error interno al crear la orden', error: error.message });
  }
};

export const getMisOrdenes = async (req, res) => {
  try {
    // 🛡️ BLINDAJE DEFINITIVO: Buscamos el ID en todas sus formas posibles
    const idBuscado = req.usuario?._id || req.usuario?.id || req.user?._id || req.user?.id;

    // Si por alguna razón extrema el token llega vacío, avisamos
    if (!idBuscado) {
      console.log("Advertencia: Se intentó buscar órdenes pero no se detectó ID de usuario en el Token.");
      return res.status(401).json({ error: 'No se pudo identificar al usuario' });
    }

    // Buscamos las órdenes usando el ID rescatado
    const ordenes = await Order.find({ usuario: idBuscado }).sort({ createdAt: -1 });
    
    // (Opcional) Un chismoso en la consola del backend para confirmar
    console.log(`Buscando órdenes para el ID: ${idBuscado}. Encontradas: ${ordenes.length}`);
    
    res.json(ordenes);
  } catch (error) {
    console.error('Error al obtener el historial:', error);
    res.status(500).json({ error: 'Hubo un error al obtener tu historial de compras' });
  }
};

// --- OBTENER TODAS LAS ÓRDENES (SOLO ADMIN) ---
export const getTodasLasOrdenes = async (req, res) => {
  try {
    // Buscamos todas las órdenes y usamos .populate() para traer también el nombre y correo del usuario que compró
    const ordenes = await Order.find({})
      .populate('usuario', 'nombre email')
      .sort({ createdAt: -1 }); // Las más nuevas primero
      
    res.json(ordenes);
  } catch (error) {
    console.error('Error al obtener todas las órdenes:', error);
    res.status(500).json({ error: 'Hubo un error al cargar las órdenes globales' });
  }
};

// --- ACTUALIZAR EL ESTADO DE UNA ORDEN (SOLO ADMIN) ---
export const actualizarEstadoOrden = async (req, res) => {
  try {
    // 🌟 NUEVO: Recibimos los datos de rastreo desde el frontend
    const { estado, guiaEnvio, linkRastreo, paqueteria } = req.body; 
    
    // Seguimos usando populate para traernos los datos si es un usuario registrado
    const orden = await Order.findById(req.params.id).populate('usuario', 'nombre email');

    if (orden) {
      // Guardamos el estado anterior para saber si realmente cambió
      const estadoAnterior = orden.estado;
      orden.estado = estado;
      
      if (estado === 'Completado') {
        orden.isEnviado = true;
        orden.enviadoEn = Date.now();
      }

      // 🌟 NUEVO: Si nos mandan datos de envío, los guardamos en la orden
      if (guiaEnvio) orden.guiaEnvio = guiaEnvio;
      if (linkRastreo) orden.linkRastreo = linkRastreo;
      if (paqueteria) orden.paqueteria = paqueteria;

      const ordenActualizada = await orden.save();

      // DISPARADOR DE CORREOS
      const { enviarCorreoActualizacion, enviarCorreoEnvio } = await import('../utils/mailer.js');
      
      // LÓGICA INTELIGENTE DE CONTACTO
      const emailDestino = orden.usuario ? orden.usuario.email : orden.cliente?.email;
      const nombreDestino = orden.usuario ? orden.usuario.nombre : orden.cliente?.nombre;

      if (emailDestino) {
        // CASO 1: Listo para Recoger
        if (estado === 'Listo para recoger' && estadoAnterior !== 'Listo para recoger') {
           await enviarCorreoActualizacion(emailDestino, nombreDestino, ordenActualizada);
        }
        
        // 🌟 NUEVO CASO 2: Enviado
        if (estado === 'Enviado' && estadoAnterior !== 'Enviado') {
           await enviarCorreoEnvio(emailDestino, nombreDestino, ordenActualizada);
        }
      } else {
         console.warn(`No se encontró un correo para notificar la orden ${orden._id}`);
      }

      res.json(ordenActualizada);
    } else {
      res.status(404).json({ error: 'Orden no encontrada' });
    }
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Hubo un error al actualizar la orden' });
  }
};