// src/components/EscaneoOrden.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const EscaneoOrden = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  
  const [orden, setOrden] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    // 1. EL SECRETO: Si el usuario es nulo al principio, simplemente retornamos y ESPERAMOS.
    // Esto evita que se asuste y lance el error antes de tiempo.
    if (!usuario) return;

    // 2. Una vez que ya cargó de verdad, validamos si es el jefe
    if (usuario.rol !== 'admin') {
      setError('Acceso denegado. Debes ser administrador para entregar pedidos.');
      setCargando(false);
      return;
    }

    // 3. Si todo está en orden, buscamos los datos
    const obtenerDetallesOrden = async () => {
      try {
        // Asegúrate de que esta IP sea la tuya correcta
        const { data } = await axios.get(`https://mininoscky-backend.onrender.com/api/ordenes`, {
            headers: { Authorization: `Bearer ${usuario.token}` }
        });
        
        const ordenEncontrada = data.find(o => o._id === id);
        
        if (!ordenEncontrada) {
          setError('No se encontró la información de esta orden.');
        } else {
          setOrden(ordenEncontrada);
        }
      } catch (err) {
        setError('Error al conectar con el servidor.');
      } finally {
        setCargando(false);
      }
    };

    obtenerDetallesOrden();
  }, [id, usuario]);

  const confirmarEntrega = async () => {
    setProcesando(true);
    try {
      await axios.put(`https://mininoscky-backend.onrender.com/api/ordenes/${id}/estado`, 
        { estado: 'Completado' },
        { headers: { Authorization: `Bearer ${usuario.token}` } }
      );
      alert('¡Pedido entregado con éxito! 🌸');
      navigate('/admin'); // Regresamos al panel principal
    } catch (err) {
      alert('Error al actualizar el estado.');
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) return <div className="text-center py-20 font-bold text-mini-accent animate-pulse">Cargando datos del pedido...</div>;
  
  if (error) return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-red-50 rounded-3xl border border-red-200 text-center">
      <p className="text-red-600 font-bold mb-4">{error}</p>
      <button onClick={() => navigate('/')} className="bg-white border border-red-200 px-6 py-2 rounded-full text-sm">Volver al inicio</button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto px-4 py-8 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-xl border border-pink-100 overflow-hidden">
        <div className="bg-mini-accent p-6 text-center text-white">
          <h2 className="text-xl font-black">Confirmar Entrega 📦</h2>
          <p className="text-sm opacity-90">Orden #{orden._id.slice(-6).toUpperCase()}</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="border-b pb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Cliente</p>
            <p className="font-bold text-gray-800 text-lg">{orden.usuario?.nombre} {orden.usuario?.apellidos}</p>
            <p className="text-sm text-gray-500">{orden.usuario?.email}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Productos a entregar</p>
            <div className="space-y-3">
              {orden.productos.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-sm font-medium text-gray-700">{item.name} <strong className="text-mini-accent">x{item.cantidad}</strong></span>
                  <span className="text-xs font-bold bg-white px-2 py-1 rounded-lg border border-gray-200">${item.price}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-gray-500">Total pagado:</span>
              <span className="text-2xl font-black text-mini-accent">${orden.precioTotal} MXN</span>
            </div>

            {orden.estado === 'Completado' ? (
              <div className="bg-green-100 text-green-700 p-4 rounded-2xl text-center font-bold">
                ✅ Esta orden ya fue entregada
              </div>
            ) : (
              <button 
                onClick={confirmarEntrega}
                disabled={procesando}
                className="w-full py-4 bg-gray-800 text-white font-bold rounded-2xl shadow-lg hover:bg-black transition-all active:scale-95 disabled:opacity-50"
              >
                {procesando ? 'Procesando...' : '¡Entregar Pedido Ahora! ✨'}
              </button>
            )}
            
            <button 
              onClick={() => navigate('/admin')}
              className="w-full mt-3 py-3 text-gray-400 text-sm font-medium"
            >
              Cancelar y volver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscaneoOrden;