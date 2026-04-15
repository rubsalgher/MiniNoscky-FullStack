// src/components/FormularioPago.jsx
import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FormularioPago = ({ datosEnvio, guardarDatos, total }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  
  const { carrito, vaciarCarrito } = useCart();
  const { usuario, actualizarUsuario } = useAuth();

  const [mensaje, setMensaje] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcesando(true);
    setMensaje(null);

    // 1. Confirmar el pago con Stripe
    const { paymentIntent, error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required", // IMPORTANTE: Para que no recargue la página de golpe
    });

    if (error) {
      setMensaje(error.message);
      setProcesando(false);
      return;
    }

    // 2. Si el pago fue exitoso, procesamos lo demás
    if (paymentIntent && paymentIntent.status === "succeeded") {
      try {
        // A) GUARDAR DIRECCIÓN SI EL CHECK ESTÁ MARCADO
        if (guardarDatos) {
          const respuesta = await axios.put('http://localhost:5000/api/usuarios/perfil', datosEnvio, {
            headers: { Authorization: `Bearer ${usuario.token}` }
          });
          actualizarUsuario(respuesta.data);
        }

        // B) REGISTRAR LA ORDEN EN MONGODB
        // Mapeamos el carrito para que coincida con tu modelo Order.js
        const productosOrden = carrito.map(item => ({
          name: item.name,
          cantidad: item.cantidad,
          image: item.image || (item.variants && item.variants[0]?.images[0]?.url), // Ajuste según tu estructura
          price: item.price,
          productoId: item._id
        }));

        await axios.post('http://localhost:5000/api/ordenes', {
          productos: productosOrden,
          direccionEnvio: datosEnvio,
          precioTotal: total,
          resultadoPago: { 
            id: paymentIntent.id, 
            status: paymentIntent.status 
          }
        }, {
          headers: { Authorization: `Bearer ${usuario.token}` }
        });

        // C) LIMPIEZA FINAL
        vaciarCarrito();
        navigate(`/pago-exitoso`);
        
      } catch (err) {
        console.error("Error al procesar la orden post-pago:", err);
        // Aunque el pago pasó, avisamos si hubo error en la DB
        setMensaje("¡Pago exitoso! Pero hubo un detalle al guardar tu pedido. No te preocupes, contacta a soporte.");
      }
    }

    setProcesando(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
            defaultValues: {
              billingDetails: {
                name: `${usuario?.nombre || ''} ${usuario?.apellidos || ''}`.trim(),
                email: usuario?.email || '',
                phone: usuario?.telefono || '',
              }
            }
          }}
      />
      {mensaje && (
        <div className={`p-4 rounded-xl text-sm border ${mensaje.includes('exitoso') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
          {mensaje}
        </div>
      )}

      <button
        disabled={procesando || !stripe || !elements}
        className="w-full bg-mini-accent text-white font-bold py-4 rounded-full shadow-lg hover:bg-pink-400 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {procesando ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Procesando Pago...
          </>
        ) : (
          `Pagar $${total.toLocaleString()} MXN ✨`
        )}
      </button>
    </form>
  );
};

export default FormularioPago;