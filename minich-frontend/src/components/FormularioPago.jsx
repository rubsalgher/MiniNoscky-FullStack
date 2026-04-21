// src/components/FormularioPago.jsx
import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FormularioPago = ({ datosEnvio, metodoEntrega, guardarDatos, total }) => {
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

    // Escudo protector global para que el botón nunca se trabe
    try {
      // 1. Confirmar el pago con Stripe
      const { paymentIntent, error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // STRIPE REQUIERE ESTO: La URL de tu página de éxito
          return_url: window.location.origin + "/pago-exitoso",
          payment_method_data: {
            billing_details: {
              name: datosEnvio.nombre,
              email: datosEnvio.email,
            }
          }
        },
        redirect: "if_required", // Evita recargas a menos que el banco lo exija
      });

      if (error) {
        setMensaje(error.message);
        setProcesando(false);
        return;
      }

      // 2. Si el pago fue exitoso, procesamos lo demás
      if (paymentIntent && paymentIntent.status === "succeeded") {
        
        // Lógica Inteligente: Si hay usuario mandamos su llave, si no, va vacío (Invitado)
        const configHeaders = usuario ? { 
          headers: { Authorization: `Bearer ${usuario.token}` } 
        } : {};

        // A) GUARDAR DIRECCIÓN (Solo si es usuario registrado)
        if (guardarDatos && usuario) {
          const respuesta = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios/perfil`, datosEnvio, configHeaders);
          actualizarUsuario(respuesta.data);
        }

        // B) REGISTRAR LA ORDEN EN MONGODB
        const productosOrden = carrito.map(item => ({
          name: item.name,
          cantidad: item.cantidad,
          image: item.image || (item.variants && item.variants[0]?.images[0]?.url),
          price: item.price,
          productoId: item._id,
          color: item.color,
          size: item.size
        }));

        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/ordenes`, {
          productos: productosOrden,
          direccionEnvio: datosEnvio,
          metodoEntrega: metodoEntrega,
          cliente: { nombre: datosEnvio.nombre, email: datosEnvio.email }, // Clave para los correos
          precioTotal: total,
          resultadoPago: { 
            id: paymentIntent.id, 
            status: paymentIntent.status 
          }
        }, configHeaders);

        // C) LIMPIEZA FINAL
        vaciarCarrito();
        navigate(`/pago-exitoso`);
      }
    } catch (err) {
      console.error("Error global en el pago:", err);
      // Si Stripe o el servidor fallan críticamente, mostramos esto y destrabamos el botón
      setMensaje("Ocurrió un error inesperado. Por favor, revisa tus datos o intenta nuevamente.");
    }

    setProcesando(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
            defaultValues: {
              billingDetails: {
                name: datosEnvio.nombre,
                email: datosEnvio.email,
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
        type="submit"
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