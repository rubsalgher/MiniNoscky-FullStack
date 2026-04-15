// src/components/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import FormularioPago from './FormularioPago';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const stripePromise = loadStripe('pk_test_51TKs3RB6r1DlICRdGX3GknzlATejBwYml0UAs5hzzJO4yCHxT2wgzaHqjJByn6VZZjpdMZTvgPC2gQdLsZqCVOrJ00RT6NlFPd');

const Checkout = () => {
  const { carrito } = useCart();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  
  const [clientSecret, setClientSecret] = useState("");
  const [guardarDireccion, setGuardarDireccion] = useState(false);
  const [config, setConfig] = useState({ envioHabilitado: false, costoEnvio: 0 });
  const [direccion, setDireccion] = useState({
    calle: '',
    colonia: '',
    ciudad: '',
    estado: '',
    cp: ''
  });

  // 1. Cargar Configuración de Envío (Admin)
  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/settings');
        setConfig(data);
      } catch (error) {
        console.error("Error cargando ajustes de envío");
      }
    };
    cargarConfig();
  }, []);

  // 2. Auto-rellenar dirección si el usuario ya tiene una
  useEffect(() => {
    if (usuario?.direccion && typeof usuario.direccion === 'object') {
      setDireccion({
        calle: usuario.direccion.calle || '',
        colonia: usuario.direccion.colonia || '',
        ciudad: usuario.direccion.ciudad || '',
        estado: usuario.direccion.estado || '',
        cp: usuario.direccion.cp || ''
      });
    }
  }, [usuario]);

  // 3. Lógica de Cálculos
  const subtotal = carrito.reduce((acc, item) => acc + (item.price * item.cantidad), 0);
  const costoEnvioActual = config.envioHabilitado ? config.costoEnvio : 0;
  const total = subtotal + costoEnvioActual;

  // 4. Obtener Intent de Stripe (se dispara cuando el total esté listo)
  useEffect(() => {
    const obtenerIntent = async () => {
      try {
        const res = await axios.post('http://localhost:5000/api/pagos/crear-intento', { monto: total });
        setClientSecret(res.data.clientSecret);
      } catch (error) {
        console.error("Error obteniendo el intent", error);
      }
    };
    if (carrito.length > 0 && total > 0) obtenerIntent();
  }, [carrito, total]);

  const handleChange = (e) => {
    setDireccion({ ...direccion, [e.target.name]: e.target.value });
  };

  const direccionCompleta = () => {
    return direccion.calle.trim() !== '' && 
           direccion.colonia.trim() !== '' &&
           direccion.ciudad.trim() !== '' && 
           direccion.estado.trim() !== '' && 
           direccion.cp.trim() !== '';
  };

  // 5. Opciones de Stripe (Pre-llenado de datos)
  const opcionesStripe = {
    clientSecret,
  };

  if (carrito.length === 0) return <div className="text-center py-20 font-bold text-gray-500 text-xl shadow-inner">Tu carrito está vacío 🌸</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
      
      {/* Columna Izquierda: Datos de Envío */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Datos de Entrega 🚚</h2>
        
        <div className="space-y-4 mb-8">
          <p className="text-gray-600 font-medium">Nombre: <span className="text-gray-800">{usuario?.nombre} {usuario?.apellidos}</span></p>
          <p className="text-gray-600 font-medium">Correo: <span className="text-gray-800">{usuario?.email}</span></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Calle y Número</label>
            <input type="text" name="calle" value={direccion.calle} onChange={handleChange} placeholder="Ej. Av. Reforma 123" onFocus={(e) => (e.target.placeholder = "")} onBlur={(e) => (e.target.placeholder = "Ej. Av. Reforma 123")} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Colonia</label>
            <input type="text" name="colonia" value={direccion.colonia} onChange={handleChange} placeholder="Ej. Cazones" onFocus={(e) => (e.target.placeholder = "")} onBlur={(e) => (e.target.placeholder = "Ej. Cazones")} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ciudad</label>
            <input type="text" name="ciudad" value={direccion.ciudad} onChange={handleChange} placeholder="Poza Rica" onFocus={(e) => (e.target.placeholder = "")} onBlur={(e) => (e.target.placeholder = "Poza Rica")} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">C.P.</label>
            <input type="text" name="cp" value={direccion.cp} onChange={handleChange} placeholder="93260" onFocus={(e) => (e.target.placeholder = "")} onBlur={(e) => (e.target.placeholder = "93260")} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Estado</label>
            <input type="text" name="estado" value={direccion.estado} onChange={handleChange} placeholder="Veracruz" onFocus={(e) => (e.target.placeholder = "")} onBlur={(e) => (e.target.placeholder = "Veracruz")} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent outline-none" />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <input 
            type="checkbox" 
            id="save-address"
            checked={guardarDireccion}
            onChange={(e) => setGuardarDireccion(e.target.checked)}
            className="h-5 w-5 text-mini-accent focus:ring-mini-accent border-gray-300 rounded-lg cursor-pointer"
          />
          <label htmlFor="save-address" className="text-sm text-gray-600 font-medium cursor-pointer">
            Guardar esta dirección para mis próximas compras 🏠
          </label>
        </div>
      </div>

      {/* Columna Derecha: Resumen Desglosado y Pago */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-fit sticky top-24">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Resumen de Orden</h2>
        
        <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2">
          {carrito.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.name} x{item.cantidad}</span>
              <span className="font-bold text-gray-800">${(item.price * item.cantidad).toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed pt-4 space-y-3 mb-8">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Envío</span>
            {config.envioHabilitado ? (
              <span className="font-bold text-gray-800">+ ${config.costoEnvio}</span>
            ) : (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">Gratis / Entrega Local</span>
            )}
          </div>
          <div className="flex justify-between text-2xl font-black text-mini-accent pt-2 border-t mt-2">
            <span>Total</span>
            <span>${total.toLocaleString()} MXN</span>
          </div>
        </div>

        {/* Módulo de Pago */}
        <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200">
          {!direccionCompleta() ? (
            <div className="text-center py-4">
              <p className="text-mini-accent font-bold text-sm italic">🌸 Falta tu dirección</p>
              <p className="text-gray-400 text-[10px] mt-1 uppercase tracking-widest">Completa los datos para habilitar Stripe</p>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={opcionesStripe}>
              <FormularioPago datosEnvio={direccion} guardarDatos={guardarDireccion} total={total}/>
            </Elements>
          ) : (
            <div className="flex flex-col items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mini-accent"></div>
              <p className="text-[10px] text-gray-400 mt-2 uppercase">Conectando con Mini Nosky Bank...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;