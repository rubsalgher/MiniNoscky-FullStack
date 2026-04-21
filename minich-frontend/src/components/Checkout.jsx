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
  
  // 1. Estado para obligar a elegir
  const [metodoEntrega, setMetodoEntrega] = useState('');

  const [datosContacto, setDatosContacto] = useState({
    nombre: '',
    email: '',
    calle: '',
    colonia: '',
    ciudad: '',
    estado: '',
    cp: ''
  });

  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/settings`);
        setConfig(data);
      } catch (error) {
        console.error("Error cargando ajustes de envío");
      }
    };
    cargarConfig();
  }, []);

  useEffect(() => {
    if (usuario) {
      setDatosContacto({
        nombre: `${usuario.nombre || ''} ${usuario.apellidos || ''}`.trim(),
        email: usuario.email || '',
        calle: usuario.direccion?.calle || '',
        colonia: usuario.direccion?.colonia || '',
        ciudad: usuario.direccion?.ciudad || '',
        estado: usuario.direccion?.estado || '',
        cp: usuario.direccion?.cp || ''
      });
    }
  }, [usuario]);

  // 👇 2. CÁLCULO DINÁMICO: Solo cobra envío si elige "envio"
  const subtotal = carrito.reduce((acc, item) => acc + (item.price * item.cantidad), 0);
  const costoEnvioActual = (config.envioHabilitado && metodoEntrega === 'envio') ? config.costoEnvio : 0;
  const total = subtotal + costoEnvioActual;

  useEffect(() => {
    const obtenerIntent = async () => {
      try {
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/pagos/crear-intento`, { monto: total });
        setClientSecret(res.data.clientSecret);
      } catch (error) {
        console.error("Error obteniendo el intent", error);
      }
    };
    if (carrito.length > 0 && total > 0) obtenerIntent();
  }, [carrito, total]); // <- Al cambiar el total, Stripe genera un nuevo ticket de cobro

  const handleChange = (e) => {
    setDatosContacto({ ...datosContacto, [e.target.name]: e.target.value });
  };

  // 👇 3. VALIDACIÓN INTELIGENTE: Depende de lo que elijan
  const datosCompletos = () => {
    // Si no han elegido método, bloqueamos el pago
    if (!metodoEntrega) return false;

    // Nombre y correo siempre son obligatorios
    const basicoValido = datosContacto.nombre.trim() !== '' && 
                         datosContacto.email.trim() !== '' && 
                         datosContacto.email.includes('@');
    
    if (!basicoValido) return false;

    // Si es envío, exigimos la dirección completa
    if (metodoEntrega === 'envio') {
      return datosContacto.calle.trim() !== '' &&
             datosContacto.colonia.trim() !== '' &&
             datosContacto.ciudad.trim() !== '' && 
             datosContacto.estado.trim() !== '' && 
             datosContacto.cp.trim() !== '';
    }

    // Si es recolección, con el nombre y correo basta
    return true;
  };

  const opcionesStripe = { clientSecret };

  if (carrito.length === 0) return <div className="text-center py-20 font-bold text-gray-500 text-xl shadow-inner">Tu carrito está vacío 🌸</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
      
      {/* Columna Izquierda: Datos de Envío */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Datos de Entrega 🚚</h2>
        
        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-700 mb-3">¿Cómo deseas recibir tu pedido? *</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <button
              type="button"
              onClick={() => setMetodoEntrega('recoleccion')}
              className={`p-4 border-2 rounded-xl text-left transition-all duration-200 flex flex-col ${
                metodoEntrega === 'recoleccion' 
                  ? 'border-mini-accent bg-pink-50 ring-2 ring-pink-200' 
                  : 'border-gray-200 hover:border-pink-300'
              }`}
            >
              <span className="font-black text-gray-800 text-lg flex items-center gap-2">
                🏬 Recoger en Local
              </span>
              <span className="text-sm text-gray-500 mt-1">Gratis - Poza Rica, Centro</span>
            </button>

            <button
              type="button"
              disabled={!config.envioHabilitado}
              onClick={() => setMetodoEntrega('envio')}
              className={`p-4 border-2 rounded-xl text-left transition-all duration-200 flex flex-col ${
                metodoEntrega === 'envio' 
                  ? 'border-mini-accent bg-pink-50 ring-2 ring-pink-200' 
                  : !config.envioHabilitado 
                    ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed' 
                    : 'border-gray-200 hover:border-pink-300'
              }`}
            >
              <span className="font-black text-gray-800 text-lg flex items-center gap-2">
                🚚 Envío a Domicilio
              </span>
              <span className="text-sm text-gray-500 mt-1">
                {config.envioHabilitado ? `Costo: $${config.costoEnvio} MXN` : 'No disponible temporalmente'}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Campos Inteligentes: Nombre y Correo SIEMPRE VISIBLES */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre Completo *</label>
            <input type="text" name="nombre" value={datosContacto.nombre} onChange={handleChange} readOnly={!!usuario} placeholder="Ej. María Pérez" className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent outline-none ${!!usuario ? 'opacity-60 cursor-not-allowed' : ''}`} />
          </div>
          
          <div className="md:col-span-2 mb-2">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Correo Electrónico (Para tu recibo y QR) *</label>
            <input type="email" name="email" value={datosContacto.email} onChange={handleChange} readOnly={!!usuario} placeholder="ejemplo@correo.com" className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent outline-none ${!!usuario ? 'opacity-60 cursor-not-allowed' : ''}`} />
          </div>

          {/* 👇 4. UI CONDICIONAL: Mensaje de Recolección */}
          {metodoEntrega === 'recoleccion' && (
            <div className="md:col-span-2 animate-fade-in mt-2 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-blue-800 text-sm">
                <strong>📍 Nota importante:</strong> Al finalizar tu compra, enviaremos un Código QR a tu correo. 
                Deberás presentarlo en nuestro local para entregarte tu pedido.
              </p>
            </div>
          )}

          {/* 👇 5. UI CONDICIONAL: Campos de Dirección */}
          {metodoEntrega === 'envio' && (
            <>
              <div className="md:col-span-2 border-t pt-4 mt-2 animate-fade-in">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Calle y Número *</label>
                <input type="text" name="calle" value={datosContacto.calle} onChange={handleChange} placeholder="Ej. Av. Reforma 123" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent outline-none" />
              </div>
              <div className="md:col-span-2 animate-fade-in">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Colonia *</label>
                <input type="text" name="colonia" value={datosContacto.colonia} onChange={handleChange} placeholder="Ej. Cazones" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent outline-none" />
              </div>
              <div className="animate-fade-in">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ciudad *</label>
                <input type="text" name="ciudad" value={datosContacto.ciudad} onChange={handleChange} placeholder="Poza Rica" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent outline-none" />
              </div>
              <div className="animate-fade-in">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">C.P. *</label>
                <input type="text" name="cp" value={datosContacto.cp} onChange={handleChange} placeholder="93260" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent outline-none" />
              </div>
              <div className="md:col-span-2 animate-fade-in">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Estado *</label>
                <input type="text" name="estado" value={datosContacto.estado} onChange={handleChange} placeholder="Veracruz" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent outline-none" />
              </div>
            </>
          )}
        </div>

        {/* Checkbox para guardar dirección (Solo si hay sesión Y eligió envío) */}
        {usuario && metodoEntrega === 'envio' && (
          <div className="mt-6 flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 animate-fade-in">
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
        )}
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
          
          {/* 👇 6. RESUMEN DINÁMICO: Cambia según la elección */}
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Envío</span>
            {metodoEntrega === 'envio' ? (
              <span className="font-bold text-gray-800">+ ${config.costoEnvio}</span>
            ) : metodoEntrega === 'recoleccion' ? (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">Gratis / Entrega Local</span>
            ) : (
              <span className="text-xs text-gray-400 italic">Por calcular</span>
            )}
          </div>
          
          <div className="flex justify-between text-2xl font-black text-mini-accent pt-2 border-t mt-2 transition-all">
            <span>Total</span>
            <span>${total.toLocaleString()} MXN</span>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 transition-all">
          {!datosCompletos() ? (
            <div className="text-center py-4">
              <p className="text-mini-accent font-bold text-sm italic">
                {metodoEntrega === '' ? '🌸 Selecciona un método de entrega' : '🌸 Faltan datos de contacto'}
              </p>
              <p className="text-gray-400 text-[10px] mt-1 uppercase tracking-widest">
                Completa la información para habilitar el pago
              </p>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={opcionesStripe}>
              <FormularioPago datosEnvio={datosContacto} metodoEntrega={metodoEntrega} guardarDatos={guardarDireccion} total={total}/>
            </Elements>
          ) : (
            <div className="flex flex-col items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mini-accent"></div>
              <p className="text-[10px] text-gray-400 mt-2 uppercase">Conectando con Stripe...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;