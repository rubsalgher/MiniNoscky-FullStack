// src/components/Perfil.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Perfil = () => {
  const { usuario } = useAuth();
  const [vistaActiva, setVistaActiva] = useState('datos'); // 'datos' o 'historial'
  
  // --- Estados para Datos del Usuario ---
  const [datos, setDatos] = useState({
    telefono: '',
    calle: '',
    colonia: '',
    ciudad: '',
    estado: '',
    cp: ''
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // --- Estados para Historial de Compras ---
  const [ordenes, setOrdenes] = useState([]);
  const [cargandoOrdenes, setCargandoOrdenes] = useState(false);

  // Cargar datos al iniciar
  useEffect(() => {
    if (usuario) {
      setDatos({
        telefono: usuario.telefono || '',
        calle: usuario.direccion?.calle || '',
        colonia: usuario.direccion?.colonia || '',
        ciudad: usuario.direccion?.ciudad || '',
        estado: usuario.direccion?.estado || '',
        cp: usuario.direccion?.cp || ''
      });
    }
  }, [usuario]);

  // Cargar órdenes cuando cambie a la pestaña de historial
  useEffect(() => {
    if (vistaActiva === 'historial' && usuario?.token) {
      const cargarHistorial = async () => {
        setCargandoOrdenes(true);
        try {
          // Asumimos que crearemos esta ruta en el backend en el siguiente paso
          const { data } = await axios.get('https://mininoscky-backend.onrender.com/api/ordenes/mis-ordenes', {
            headers: { Authorization: `Bearer ${usuario.token}` }
          });
          setOrdenes(data);
        } catch (error) {
          console.error("Error al cargar historial", error);
        } finally {
          setCargandoOrdenes(false);
        }
      };
      cargarHistorial();
    }
  }, [vistaActiva, usuario]);

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const handleGuardarDatos = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      // Asumimos que crearemos esta ruta en el backend en el siguiente paso
      await axios.put('https://mininoscky-backend.onrender.com/api/usuarios/perfil', datos, {
        headers: { Authorization: `Bearer ${usuario.token}` }
      });
      setMensaje({ texto: '¡Datos actualizados con éxito! 🌸', tipo: 'exito' });
      // Nota: Aquí idealmente actualizaríamos el AuthContext para reflejar los cambios en toda la app sin recargar
    } catch (error) {
      setMensaje({ texto: 'Hubo un error al guardar. Intenta de nuevo.', tipo: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  // Función auxiliar para el color de los estados de la orden
  const ColorEstado = (estado) => {
    switch (estado) {
      case 'Pendiente': return 'bg-yellow-100 text-yellow-700';
      case 'Listo para recoger': return 'bg-blue-100 text-blue-700';
      case 'Completado': return 'bg-green-100 text-green-700';
      case 'Cancelado': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-gray-800 mb-8 text-center">Mi Perfil ✨</h1>

      {/* Navegación de pestañas */}
      <div className="flex justify-center gap-4 mb-8">
        <button 
          onClick={() => setVistaActiva('datos')}
          className={`px-6 py-3 rounded-full font-bold transition-all ${vistaActiva === 'datos' ? 'bg-mini-accent text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:bg-pink-50'}`}
        >
          Mis Datos 📝
        </button>
        <button 
          onClick={() => setVistaActiva('historial')}
          className={`px-6 py-3 rounded-full font-bold transition-all ${vistaActiva === 'historial' ? 'bg-mini-accent text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:bg-pink-50'}`}
        >
          Mis Compras 🛍️
        </button>
      </div>

      <div className="bg-white p-6 md:p-10 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-pink-100/50">
        
        {/* VISTA 1: DATOS PERSONALES */}
        {vistaActiva === 'datos' && (
          <div className="animate-fade-in max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Información de Contacto y Envío</h2>
            
            {mensaje.texto && (
               <div className={`p-4 mb-6 text-center rounded-2xl font-bold border ${mensaje.tipo === 'exito' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                 {mensaje.texto}
               </div>
             )}

            <form onSubmit={handleGuardarDatos} className="space-y-6">
              {/* Campos Bloqueados (Gris claro) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre (No editable)</label>
                  <input type="text" disabled value={`${usuario?.nombre} ${usuario?.apellidos}`} className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Correo (No editable)</label>
                  <input type="text" disabled value={usuario?.email} className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" />
                </div>
              </div>

              {/* Campos Editables */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Teléfono (WhatsApp)</label>
                <input type="text" name="telefono" value={datos.telefono} onChange={handleChange} placeholder="Ej. 7821234567" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent outline-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Calle y Número</label>
                  <input type="text" name="calle" value={datos.calle} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Colonia</label>
                  <input type="text" name="colonia" value={datos.colonia} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Ciudad</label>
                  <input type="text" name="ciudad" value={datos.ciudad} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">C.P.</label>
                  <input type="text" name="cp" value={datos.cp} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Estado</label>
                  <input type="text" name="estado" value={datos.estado} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent outline-none" />
                </div>
              </div>

              <button type="submit" disabled={guardando} className="w-full py-4 bg-mini-accent text-white font-bold rounded-full shadow-lg hover:bg-pink-400 transition-all disabled:opacity-50 mt-4">
                {guardando ? "Guardando..." : "Actualizar mis datos 🌸"}
              </button>
            </form>
          </div>
        )}

        {/* VISTA 2: HISTORIAL DE COMPRAS */}
        {vistaActiva === 'historial' && (
          <div className="animate-fade-in">
             <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Mis Compras</h2>
             
             {cargandoOrdenes ? (
               <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mini-accent"></div></div>
             ) : ordenes.length === 0 ? (
               <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                 <p className="text-gray-400 text-lg">Aún no tienes compras registradas.</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {ordenes.map(orden => (
                   <div key={orden._id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow bg-gray-50/50">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-gray-100 pb-4">
                       <div>
                         <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Orden #{orden._id.slice(-6)}</p>
                         <p className="text-sm font-medium text-gray-800">{new Date(orden.createdAt).toLocaleDateString()}</p>
                       </div>
                       <div className={`px-3 py-1 rounded-full text-xs font-bold ${ColorEstado(orden.estado)}`}>
                         {orden.estado}
                       </div>
                     </div>
                     
                     <div className="space-y-2">
                       {orden.productos.map((prod, i) => (
                         <div key={i} className="flex justify-between text-sm">
                           <span className="text-gray-600">{prod.name} x{prod.cantidad}</span>
                           <span className="font-bold text-gray-700">${prod.price}</span>
                         </div>
                       ))}
                     </div>
                     
                     <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                       <span className="text-sm font-bold text-gray-500">Total Pagado:</span>
                       <span className="text-lg font-black text-mini-accent">${orden.precioTotal} MXN</span>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Perfil;