// controllers/orderController.js
import { enviarCorreoCompra } from '../utils/mailer.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

export const crearOrden = async (req, res) => {
  try {
    // Cambiamos "precioTotal" a "total" para que coincida con tu frontend
    const { productos, direccionEnvio, resultadoPago } = req.body;

    const montoFinal = req.body.precioTotal || req.body.total || 0;

    // 1. Validar que vengan productos
    if (productos && productos.length === 0) {
      return res.status(400).json({ mensaje: 'No hay productos en la orden' });
    }

    // 2. Crear la nueva orden en memoria
    const orden = new Order({
      usuario: req.user._id, 
      productos,
      direccionEnvio,
      precioTotal: montoFinal,
      estado: 'Pendiente',
      resultadoPago,
      isPagado: true, 
      pagadoEn: Date.now(),
      metodoPago: 'Stripe'
    });

    // 3. ¡Guardar en MongoDB!
    const ordenGuardada = await orden.save();

    // 3.5. ¡NUEVO! DESCONTAR EL STOCK DE LA BASE DE DATOS
    for (const item of orden.productos) {
      const productoDb = await Product.findById(item.productoId);
      
      if (productoDb && productoDb.variants && productoDb.variants.length > 0) {
        
        // Asumimos por defecto que es la primera variante (índice 0)
        let varianteIndex = 0;

        // Si el producto tiene múltiples opciones de color/talla, intentamos buscar la exacta
        if (productoDb.variants.length > 1) {
           const indexEncontrado = productoDb.variants.findIndex(v => 
             (v.attributes?.color === item.color || (!v.attributes?.color && !item.color)) &&
             (v.attributes?.size === item.size || (!v.attributes?.size && !item.size))
           );
           // Si la encuentra, actualizamos el índice. Si no, se queda en 0 por seguridad.
           if (indexEncontrado !== -1) varianteIndex = indexEncontrado;
        }

        // Le restamos la cantidad comprada
        productoDb.variants[varianteIndex].stock -= item.cantidad;
        
        // Evitamos que el stock sea negativo
        if (productoDb.variants[varianteIndex].stock < 0) {
          productoDb.variants[varianteIndex].stock = 0;
        }
        
        // 👇 ¡EL SECRETO DE MONGOOSE! 👇 
        // Le avisamos explícitamente que cambiamos algo dentro del arreglo
        productoDb.markModified('variants');
        
        // Guardamos el producto con su nuevo stock
        await productoDb.save();
      }
    }
    
    // 4. Vaciar el carrito del usuario en la base de datos
    await User.findByIdAndUpdate(req.user._id, { carrito: [] });

    // 5. Aquí enviamos el correo de confirmación
    await enviarCorreoCompra(req.user.email, req.user.nombre, ordenGuardada);

    // 6. Responder al frontend que todo fue un éxito
    res.status(201).json(ordenGuardada);

  } catch (error) {
    console.error("Error al crear la orden en la BD:", error);
    res.status(500).json({ mensaje: 'Error interno al crear la orden', error: error.message });
  }
};

export const getMisOrdenes = async (req, res) => {
  try {
    // Buscamos las órdenes que pertenezcan al ID del usuario y las ordenamos de más nueva a más vieja
    const ordenes = await Order.find({ usuario: req.user._id }).sort({ createdAt: -1 });
    
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
    const { estado } = req.body; 
    
    // Usamos .populate() para traernos el email y nombre del cliente, porque los necesitamos para enviarle el correo
    const orden = await Order.findById(req.params.id).populate('usuario', 'nombre email');

    if (orden) {
      // Guardamos el estado anterior para saber si realmente cambió
      const estadoAnterior = orden.estado;
      orden.estado = estado;
      
      if (estado === 'Completado') {
        orden.isEnviado = true;
        orden.enviadoEn = Date.now();
      }

      const ordenActualizada = await orden.save();

      // DISPARADOR DE CORREO: Si lo marcaste como "Listo para recoger" (y antes no lo estaba)
      if (estado === 'Listo para recoger' && estadoAnterior !== 'Listo para recoger') {
        const { enviarCorreoActualizacion } = await import('../utils/mailer.js');
        // Usamos los datos populados del cliente
        if(orden.usuario) {
           await enviarCorreoActualizacion(orden.usuario.email, orden.usuario.nombre, ordenActualizada);
        }
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