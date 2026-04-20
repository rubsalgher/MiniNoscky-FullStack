// src/components/Admin.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const navigate = useNavigate();
  const [vistaActiva, setVistaActiva] = useState('crear');

  const [ordenesGlobales, setOrdenesGlobales] = useState([]);
  const [cargandoOrdenes, setCargandoOrdenes] = useState(false);
  const [imagenExpandida, setImagenExpandida] = useState(null);
  
  // ESTADOS PARA EL MODAL DE RESURTIR
  const [modalResurtir, setModalResurtir] = useState({ activo: false, producto: null });
  const [stockTemporal, setStockTemporal] = useState([]);

  const [modalEnvio, setModalEnvio] = useState({ activo: false, ordenId: null });
  const [datosRastreo, setDatosRastreo] = useState({ paqueteria: '', guiaEnvio: '', linkRastreo: '' });

  const [ajustesTienda, setAjustesTienda] = useState({ 
    envioHabilitado: false, 
    costoEnvio: 0,
    carrusel: { limite: 5, productosElegidos: [] }
  });
  const [cargandoAjustes, setCargandoAjustes] = useState(false);

  const [listaProductos, setListaProductos] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  const [producto, setProducto] = useState({ name: '', description: '', category: 'Regalos' });
  const [estilos, setEstilos] = useState([
    { color: '', imageFiles: [], tallas: [{ size: '', sku: '', price: '', stock: '' }] }
  ]);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [cargando, setCargando] = useState(false);

  const { usuario } = useAuth();

  const cargarAjustes = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/settings`);
      setAjustesTienda({
        ...res.data,
        carrusel: res.data.carrusel || { limite: 5, productosElegidos: [] }
      });
    } catch (error) {
      console.error("Error al cargar ajustes:", error);
    }
  };

  const cargarProductos = async () => {
    setCargandoLista(true);
    try {
      const respuesta = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/productos`);
      setListaProductos(respuesta.data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setCargandoLista(false);
    }
  };  

  const cargarOrdenesGlobales = async () => {
    setCargandoOrdenes(true);
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/ordenes`, {
        headers: { Authorization: `Bearer ${usuario.token}` }
      });
      setOrdenesGlobales(data);
    } catch (error) {
      console.error("Error al cargar órdenes:", error);
    } finally {
      setCargandoOrdenes(false);
    }
  };

  useEffect(() => {
    if (!usuario || usuario.rol !== 'admin') {
      navigate('/');
    } else {
      if (vistaActiva === 'lista' || vistaActiva === 'carrusel') cargarProductos();
      if (vistaActiva === 'ajustes' || vistaActiva === 'carrusel') cargarAjustes();
      if (vistaActiva === 'ordenes') cargarOrdenesGlobales();
    }
  }, [vistaActiva, usuario, navigate]);

  const guardarAjustes = async () => {
    setCargandoAjustes(true);
    try {
      const configHeaders = { headers: { Authorization: `Bearer ${usuario.token}` } };
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/settings`, ajustesTienda, configHeaders);
      alert("¡Configuración guardada con éxito! ✨");
    } catch (error) {
      alert("Error al guardar los ajustes.");
    } finally {
      setCargandoAjustes(false);
    }
  };

  const toggleProductoCarrusel = (idProducto) => {
    const elegidosActuales = ajustesTienda.carrusel.productosElegidos.map(p => typeof p === 'string' ? p : p._id);
    if (elegidosActuales.includes(idProducto)) {
      const nuevosElegidos = elegidosActuales.filter(id => id !== idProducto);
      setAjustesTienda({ ...ajustesTienda, carrusel: { ...ajustesTienda.carrusel, productosElegidos: nuevosElegidos } });
    } else {
      if (elegidosActuales.length < ajustesTienda.carrusel.limite) {
        setAjustesTienda({ ...ajustesTienda, carrusel: { ...ajustesTienda.carrusel, productosElegidos: [...elegidosActuales, idProducto] } });
      } else {
        alert(`¡Límite alcanzado! Solo puedes seleccionar hasta ${ajustesTienda.carrusel.limite} productos.`);
      }
    }
  };

  const handleCambiarEstadoOrden = async (ordenId, nuevoEstado) => {
    
    if (nuevoEstado === 'Enviado') {
      setModalEnvio({ activo: true, ordenId });
      setDatosRastreo({ paqueteria: '', guiaEnvio: '', linkRastreo: '' });
      return;
    }

    setOrdenesGlobales(ordenesActuales => 
      ordenesActuales.map(orden => 
        orden._id === ordenId ? { ...orden, estado: nuevoEstado } : orden
      )
    );
    try {
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/ordenes/${ordenId}/estado`, 
        { estado: nuevoEstado },
        { headers: { Authorization: `Bearer ${usuario.token}` } }
      );
      setMensaje({ texto: 'Estado de orden actualizado 📦', tipo: 'exito' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    } catch (error) {
      setMensaje({ texto: 'Error al actualizar orden', tipo: 'error' });
      cargarOrdenesGlobales(); 
    }
  };

  const confirmarEnvioOrden = async () => {
    const { ordenId } = modalEnvio;
    const nuevoEstado = 'Enviado';

    // Validación básica
    if (!datosRastreo.paqueteria || !datosRastreo.guiaEnvio) {
      alert("Por favor, ingresa al menos la paquetería y el número de guía.");
      return;
    }

    // 1. Actualizamos UI temporalmente
    setOrdenesGlobales(ordenesActuales => 
      ordenesActuales.map(orden => 
        orden._id === ordenId ? { 
          ...orden, 
          estado: nuevoEstado, 
          ...datosRastreo // Agregamos visualmente los datos
        } : orden
      )
    );

    try {
      // 2. Mandamos el estado "Enviado" MÁS los datos de rastreo al backend
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/ordenes/${ordenId}/estado`, 
        { 
          estado: nuevoEstado,
          paqueteria: datosRastreo.paqueteria,
          guiaEnvio: datosRastreo.guiaEnvio,
          linkRastreo: datosRastreo.linkRastreo
        },
        { headers: { Authorization: `Bearer ${usuario.token}` } }
      );
      
      setMensaje({ texto: 'Orden enviada y cliente notificado 🚀', tipo: 'exito' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
      setModalEnvio({ activo: false, ordenId: null }); // Cerramos modal
      
    } catch (error) {
      setMensaje({ texto: 'Error al procesar el envío', tipo: 'error' });
      cargarOrdenesGlobales(); 
      setModalEnvio({ activo: false, ordenId: null });
    }
  };

  const eliminarProducto = async (id, nombre) => {
    const confirmacion = window.confirm(`¿Estás seguro de que deseas eliminar "${nombre}"?`);
    if (confirmacion) {
      try {
        const configHeaders = { headers: { Authorization: `Bearer ${usuario.token}` } };
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/productos/${id}`, configHeaders);
        setListaProductos(listaProductos.filter(p => p._id !== id));
        alert('Producto eliminado. 🌸');
      } catch (error) {
        alert('Hubo un problema al eliminar.');
      }
    }
  };

  // FUNCIÓN PARA GUARDAR EL RESURTIDO
  const handleGuardarResurtido = async () => {
    try {
      const configHeaders = { headers: { Authorization: `Bearer ${usuario.token}` } };
      const productoActualizado = {
        ...modalResurtir.producto,
        variants: stockTemporal
      };
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/productos/${modalResurtir.producto._id}`, 
        productoActualizado, 
        configHeaders
      );
      setModalResurtir({ activo: false, producto: null });
      cargarProductos(); // Refresca la tabla automáticamente
      alert("¡Stock actualizado correctamente! 📦");
    } catch (error) {
      console.error("Error al actualizar stock:", error);
      alert("Hubo un error al guardar el inventario.");
    }
  };

  const agregarEstilo = () => setEstilos([...estilos, { color: '', imageFiles: [], tallas: [{ size: '', sku: '', price: '', stock: '' }] }]);
  const eliminarEstilo = (index) => { if (estilos.length > 1) setEstilos(estilos.filter((_, i) => i !== index)); };
  const actualizarEstilo = (index, campo, valor) => { const nuevos = [...estilos]; nuevos[index][campo] = valor; setEstilos(nuevos); };
  const agregarTalla = (estiloIndex) => { const nuevos = [...estilos]; nuevos[estiloIndex].tallas.push({ size: '', sku: '', price: '', stock: '' }); setEstilos(nuevos); };
  const eliminarTalla = (estiloIndex, tallaIndex) => { const nuevos = [...estilos]; if (nuevos[estiloIndex].tallas.length > 1) { nuevos[estiloIndex].tallas = nuevos[estiloIndex].tallas.filter((_, i) => i !== tallaIndex); setEstilos(nuevos); } };
  const actualizarTalla = (estiloIndex, tallaIndex, campo, valor) => { const nuevos = [...estilos]; nuevos[estiloIndex].tallas[tallaIndex][campo] = valor; setEstilos(nuevos); };
  const handleProductoChange = (e) => setProducto({ ...producto, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    const formData = new FormData();
    formData.append('name', producto.name);
    formData.append('description', producto.description);
    formData.append('category', producto.category);
    formData.append('brand', 'Mini Noscky');
    const variantesFormateadas = [];
    estilos.forEach((estilo, indexEstilo) => {
      estilo.tallas.forEach(talla => {
        variantesFormateadas.push({
          sku: talla.sku, price: Number(talla.price), stock: Number(talla.stock),
          attributes: { color: estilo.color || undefined, size: talla.size || undefined },
          groupIndex: indexEstilo
        });
      });
    });
    formData.append('variants', JSON.stringify(variantesFormateadas));
    estilos.forEach((estilo, index) => {
      if (estilo.imageFiles && estilo.imageFiles.length > 0) {
        Array.from(estilo.imageFiles).forEach(file => formData.append(`image_${index}`, file));
      }
    });
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/productos`, formData, { headers: { Authorization: `Bearer ${usuario.token}` } });
      setMensaje({ texto: '¡Producto subido con éxito! 🌸', tipo: 'exito' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
      setProducto({ name: '', description: '', category: 'Regalos' });
      setEstilos([{ color: '', imageFiles: [], tallas: [{ size: '', sku: '', price: '', stock: '' }] }]);
      e.target.reset();
    } catch (error) {
      setMensaje({ texto: 'Hubo un error 😢', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 relative">
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <button onClick={() => setVistaActiva('crear')} className={`px-6 py-3 rounded-full font-bold transition-all ${vistaActiva === 'crear' ? 'bg-mini-accent text-white shadow-md' : 'bg-white text-gray-500 border border-mini-pink/20 hover:bg-mini-pink/10'}`}>Subir Producto ✨</button>
        <button onClick={() => setVistaActiva('lista')} className={`px-6 py-3 rounded-full font-bold transition-all ${vistaActiva === 'lista' ? 'bg-mini-accent text-white shadow-md' : 'bg-white text-gray-500 border border-mini-pink/20 hover:bg-mini-pink/10'}`}>Inventario 📦</button>
        <button onClick={() => setVistaActiva('ajustes')} className={`px-6 py-3 rounded-full font-bold transition-all ${vistaActiva === 'ajustes' ? 'bg-mini-accent text-white shadow-md' : 'bg-white text-gray-500 border border-mini-pink/20 hover:bg-mini-pink/10'}`}>Ajustes de Envío 🚚</button>
        <button onClick={() => setVistaActiva('carrusel')} className={`px-6 py-3 rounded-full font-bold transition-all ${vistaActiva === 'carrusel' ? 'bg-mini-accent text-white shadow-md' : 'bg-white text-gray-500 border border-mini-pink/20 hover:bg-mini-pink/10'}`}>Carrusel Inicio 🖼️</button>
        <button onClick={() => setVistaActiva('ordenes')} className={`px-6 py-3 rounded-full font-bold transition-all ${vistaActiva === 'ordenes' ? 'bg-mini-accent text-white shadow-md' : 'bg-white text-gray-500 border border-mini-pink/20 hover:bg-mini-pink/10'}`}>Órdenes y Ventas 🧾</button>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-mini-pink/30">
        
        {/* VISTA 1: CREAR */}
        {vistaActiva === 'crear' && (
          <div className="animate-fade-in">
             <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Subir Nuevo Producto</h2>
              {mensaje.texto && (
                <div className={`p-4 mb-6 text-center rounded-2xl font-bold border ${mensaje.tipo === 'exito' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                  {mensaje.texto}
                </div>
              )}
             <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Datos Generales */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-700 mb-4">1. Datos Generales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Producto</label>
                      <input type="text" name="name" required value={producto.name} onChange={handleProductoChange} className="w-full px-4 py-2 rounded-xl border border-gray-200" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                      <select name="category" value={producto.category} onChange={handleProductoChange} className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white">
                        <option value="Regalos">Regalos</option>
                        <option value="Accesorios">Accesorios</option>
                        <option value="Importados">Importados</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                    <textarea name="description" value={producto.description} onChange={handleProductoChange} rows="2" className="w-full px-4 py-2 rounded-xl border border-gray-200"></textarea>
                  </div>
                </div>
                {/* 2. Matriz de Estilos y Tallas */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-700">2. Variantes (Colores y Tallas)</h3>
                    <button type="button" onClick={agregarEstilo} className="text-sm font-bold text-mini-accent hover:text-pink-500 bg-pink-50 px-4 py-2 rounded-lg transition-colors">
                      + Agregar nuevo color/estilo
                    </button>
                  </div>

                  <div className="space-y-6">
                    {estilos.map((estilo, estiloIndex) => (
                      <div key={estiloIndex} className="bg-white p-6 rounded-2xl border-2 border-mini-pink/40 relative shadow-sm">
                        {estilos.length > 1 && (
                          <button type="button" onClick={() => eliminarEstilo(estiloIndex)} className="absolute -top-3 -right-3 bg-red-100 text-red-500 hover:bg-red-500 hover:text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">×</button>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Color / Estilo General</label>
                            <input type="text" value={estilo.color} onChange={(e) => actualizarEstilo(estiloIndex, 'color', e.target.value)} placeholder="Ej. Blanco" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Fotos de este estilo</label>
                            <input type="file" multiple accept="image/*" onChange={(e) => actualizarEstilo(estiloIndex, 'imageFiles', e.target.files)} required={estiloIndex === 0}
                              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-mini-pink file:text-pink-700 cursor-pointer w-full" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-bold text-gray-600 border-b pb-2">Tallas / Inventario para este color</h4>
                          {estilo.tallas.map((talla, tallaIndex) => (
                            <div key={tallaIndex} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <div className="md:col-span-3">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Talla (Opcional)</label>
                                <input type="text" value={talla.size} onChange={(e) => actualizarTalla(estiloIndex, tallaIndex, 'size', e.target.value)} placeholder="Ej. M" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                              </div>
                              <div className="md:col-span-3">
                                <label className="block text-xs font-medium text-gray-500 mb-1">SKU</label>
                                <input type="text" value={talla.sku} onChange={(e) => actualizarTalla(estiloIndex, tallaIndex, 'sku', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm uppercase bg-white" />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Precio *</label>
                                <input type="number" required min="0" value={talla.price} onChange={(e) => actualizarTalla(estiloIndex, tallaIndex, 'price', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white" />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Stock *</label>
                                <input type="number" required min="0" value={talla.stock} onChange={(e) => actualizarTalla(estiloIndex, tallaIndex, 'stock', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white" />
                              </div>
                              <div className="md:col-span-2 flex justify-end">
                                {estilo.tallas.length > 1 && (
                                  <button type="button" onClick={() => eliminarTalla(estiloIndex, tallaIndex)} className="text-red-400 hover:text-red-600 text-sm font-bold py-2 px-3">Eliminar</button>
                                )}
                              </div>
                            </div>
                          ))}
                          <button type="button" onClick={() => agregarTalla(estiloIndex)} className="text-xs font-bold text-gray-500 hover:text-mini-accent mt-2">+ Agregar otra talla/opción</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={cargando} className={`w-full py-4 rounded-full font-bold text-white shadow-md text-lg ${cargando ? 'bg-gray-400' : 'bg-mini-accent hover:bg-pink-400'}`}>
                  {cargando ? 'Guardando... ☁️' : 'Guardar Producto 🌸'}
                </button>
             </form>
          </div>
        )}

        {/* VISTA 2: INVENTARIO */}
        {vistaActiva === 'lista' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Gestionar Inventario 📦</h2>
            
            {cargandoLista ? (
               <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mini-accent"></div></div>
            ) : listaProductos.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-lg">No tienes productos en tu catálogo aún.</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4 text-center">Stock Total</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {listaProductos.map(prod => {
                      const stockTotal = prod.variants?.reduce((suma, variante) => suma + (Number(variante.stock) || 0), 0) || 0;
                      const imagenUrl = prod.variants?.[0]?.images?.[0]?.url || 'https://via.placeholder.com/50';

                      return (
                        <tr key={prod._id} className="hover:bg-pink-50/30 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-4">
                            <img src={imagenUrl} alt={prod.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                            <div>
                              <span className="block font-bold text-gray-800">{prod.name}</span>
                              <span className="text-xs text-gray-400">{prod.category}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${stockTotal === 0 ? 'bg-red-100 text-red-600' : stockTotal < 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                              {stockTotal} pzas
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2 items-center">
                              <button 
                                onClick={() => {
                                  setModalResurtir({ activo: true, producto: prod });
                                  setStockTemporal(prod.variants ? prod.variants.map(v => ({ ...v })) : []);
                                }}
                                className="text-blue-500 hover:text-blue-700 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                              >
                                Resurtir <span className="text-[10px]">📦</span>
                              </button>
                              <button onClick={() => eliminarProducto(prod._id, prod.name)} className="text-red-400 hover:text-red-600 font-bold bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors">
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* VISTA 3: AJUSTES DE ENVÍO */}
        {vistaActiva === 'ajustes' && (
          <div className="animate-fade-in max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Ajustes de la Tienda</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-pink-50/50 rounded-2xl border border-pink-100">
                <div>
                  <p className="font-bold text-gray-800">¿Cobrar envío a domicilio?</p>
                  <p className="text-xs text-gray-500">Si se desactiva, aparecerá como "Entrega en Local".</p>
                </div>
                <input type="checkbox" className="w-6 h-6 accent-mini-accent cursor-pointer" checked={ajustesTienda.envioHabilitado} onChange={(e) => setAjustesTienda({...ajustesTienda, envioHabilitado: e.target.checked})} />
              </div>

              {ajustesTienda.envioHabilitado && (
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Costo de Envío Fijo (MXN)</label>
                  <input type="number" className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-mini-accent" value={ajustesTienda.costoEnvio === 0 ? "" : ajustesTienda.costoEnvio} placeholder="0" onChange={(e) => { const valor = e.target.value; setAjustesTienda({ ...ajustesTienda, costoEnvio: valor === "" ? 0 : Number(valor) }); }} />
                </div>
              )}

              <button onClick={guardarAjustes} disabled={cargandoAjustes} className="w-full py-4 bg-mini-accent text-white font-bold rounded-full shadow-lg hover:bg-pink-400 transition-all disabled:opacity-50">
                {cargandoAjustes ? "Guardando cambios..." : "Guardar Configuración ✨"}
              </button>
            </div>
          </div>
        )}

        {/* VISTA 4: CARRUSEL INICIO */}
        {vistaActiva === 'carrusel' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Configurar Carrusel de Inicio</h2>
            <p className="text-center text-gray-500 mb-8">Selecciona los productos estrella que verán tus clientes al entrar.</p>
            
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Cantidad a mostrar</label>
                <select value={ajustesTienda.carrusel.limite} onChange={(e) => setAjustesTienda({...ajustesTienda, carrusel: {...ajustesTienda.carrusel, limite: Number(e.target.value)}})} className="px-4 py-2 rounded-xl border border-gray-200 bg-white">
                  <option value={3}>3 Productos</option>
                  <option value={4}>4 Productos</option>
                  <option value={5}>5 Productos</option>
                </select>
              </div>
              <button onClick={() => setMostrarModal(true)} className="bg-gray-800 text-white px-6 py-3 rounded-full font-bold hover:bg-black transition-colors">
                🔍 Seleccionar Productos
              </button>
            </div>

            <h3 className="font-bold text-gray-700 mb-4">Productos seleccionados ({ajustesTienda.carrusel.productosElegidos.length} de {ajustesTienda.carrusel.limite}):</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {ajustesTienda.carrusel.productosElegidos.length === 0 ? (
                <p className="col-span-full text-gray-400 italic">Aún no has seleccionado productos.</p>
              ) : (
                ajustesTienda.carrusel.productosElegidos.map(id => {
                  const prod = listaProductos.find(p => p._id === (typeof id === 'string' ? id : id._id));
                  if (!prod) return null;
                  const imagenUrl = prod.variants?.[0]?.images?.[0]?.url || 'https://via.placeholder.com/150';
                  return (
                    <div key={prod._id} className="bg-white border border-gray-200 rounded-xl p-3 text-center relative">
                      <button onClick={() => toggleProductoCarrusel(prod._id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold shadow-md hover:bg-red-600">×</button>
                      <img src={imagenUrl} alt={prod.name} className="w-full h-24 object-cover rounded-lg mb-2" />
                      <p className="text-xs font-bold text-gray-700 truncate">{prod.name}</p>
                    </div>
                  );
                })
              )}
            </div>

            <button onClick={guardarAjustes} disabled={cargandoAjustes} className="w-full py-4 bg-mini-accent text-white font-bold rounded-full shadow-lg hover:bg-pink-400 transition-all disabled:opacity-50">
              {cargandoAjustes ? "Guardando..." : "Guardar Carrusel ✨"}
            </button>
          </div>
        )}

        {/* VISTA 5: GESTIÓN DE ÓRDENES */}
        {vistaActiva === 'ordenes' && (
          <div className="animate-fade-in">
             <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Gestión de Órdenes 📦</h2>
             
             {mensaje.texto && (
               <div className={`p-4 mb-6 text-center rounded-2xl font-bold border ${mensaje.tipo === 'exito' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                 {mensaje.texto}
               </div>
             )}

             {cargandoOrdenes ? (
               <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mini-accent"></div></div>
             ) : ordenesGlobales.length === 0 ? (
               <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                 <p className="text-gray-400 text-lg">No hay órdenes registradas aún.</p>
               </div>
             ) : (
               <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
                 <table className="w-full text-left text-sm text-gray-600">
                   <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                     <tr>
                       <th className="px-6 py-4">Orden / Fecha</th>
                       <th className="px-6 py-4">Cliente</th>
                       <th className="px-6 py-4">Productos</th>
                       <th className="px-6 py-4">Total</th>
                       <th className="px-6 py-4 text-center">Estado</th>
                       <th className="px-6 py-4 text-right">Acción</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {ordenesGlobales.map((orden) => (
                       <tr key={orden._id} className="hover:bg-pink-50/30 transition-colors">
                         <td className="px-6 py-4 font-medium text-gray-800">
                           <span className="block text-mini-accent font-bold">#{orden._id.slice(-6).toUpperCase()}</span>
                           <span className="text-xs text-gray-400">{new Date(orden.createdAt).toLocaleDateString()}</span>
                         </td>
                         <td className="px-6 py-4">
                          {orden.usuario ? (
                            <>
                              <span className="block font-bold text-gray-800">{orden.usuario.nombre} {orden.usuario.apellidos || ''}</span>
                              <span className="text-xs text-gray-400">{orden.usuario.email}</span>
                            </>
                          ) : orden.cliente ? (
                            <>
                              <span className="block font-bold text-gray-600 italic">{orden.cliente.nombre}</span>
                              <span className="text-xs text-gray-400 block">{orden.cliente.email}</span>
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block border border-gray-200">Invitado</span>
                            </>
                          ) : (
                            <span className="text-gray-400 italic">Usuario Eliminado</span>
                          )}
                        </td>
                        <td className="px-6 py-4 min-w-[250px]">
                          <div className="space-y-3">
                            {orden.productos.map((item, index) => (
                              <div key={index} className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-12 h-12 bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-contain cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setImagenExpandida(item.image)} />
                                  ) : (
                                    <span className="text-[8px] text-gray-400 uppercase tracking-wider text-center">Sin<br/>Foto</span>
                                  )}
                                </div>
                                <div className="flex-1 text-xs">
                                  <p className="font-bold text-gray-800 line-clamp-2">{item.name}</p>
                                  <p className="text-gray-500 mt-0.5">Cant: <span className="font-medium text-gray-700">{item.cantidad}</span></p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                         <td className="px-6 py-4 font-bold text-gray-800">${orden.precioTotal ? orden.precioTotal.toLocaleString() : '0'}</td>
                         <td className="px-6 py-4 text-center">
                           <span className={`px-3 py-1 rounded-full text-xs font-bold ${orden.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' : orden.estado === 'Listo para recoger' ? 'bg-blue-100 text-blue-700' : orden.estado === 'Completado' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                             {orden.estado || 'Pendiente'}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <select 
                             value={orden.estado || 'Pendiente'}
                             onChange={(e) => handleCambiarEstadoOrden(orden._id, e.target.value)}
                             className="text-xs border border-gray-300 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-mini-accent bg-white cursor-pointer"
                           >
                             <option value="Pendiente">Pendiente</option>
                             {orden.metodoEntrega === 'envio' ? (
                                <option value="Enviado">Enviado 🚚</option>
                              ) : (
                                <option value="Listo para recoger">Listo para recoger</option>
                              )}
                             <option value="Completado">Completado</option>
                           </select>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </div>
        )}
      </div>

      {/* --- MODAL PARA SELECCIONAR PRODUCTOS CARRUSEL --- */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">Selecciona para el Carrusel</h3>
              <button onClick={() => setMostrarModal(false)} className="text-gray-400 hover:text-gray-800 font-bold text-xl">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-grow bg-white">
              <p className="text-sm text-gray-500 mb-4">Puedes elegir hasta <span className="font-bold text-mini-accent">{ajustesTienda.carrusel.limite}</span> productos.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listaProductos.map(prod => {
                  const elegidosIds = ajustesTienda.carrusel.productosElegidos.map(p => typeof p === 'string' ? p : p._id);
                  const estaSeleccionado = elegidosIds.includes(prod._id);
                  const limiteAlcanzado = elegidosIds.length >= ajustesTienda.carrusel.limite;
                  const imagenUrl = prod.variants?.[0]?.images?.[0]?.url || 'https://via.placeholder.com/150';
                  return (
                    <div 
                      key={prod._id} 
                      onClick={() => { if (estaSeleccionado || !limiteAlcanzado) toggleProductoCarrusel(prod._id) }}
                      className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${estaSeleccionado ? 'border-mini-accent bg-pink-50' : 'border-gray-100 hover:border-gray-300'} ${(limiteAlcanzado && !estaSeleccionado) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <img src={imagenUrl} alt={prod.name} className="w-16 h-16 object-cover rounded-lg mr-4" />
                      <div className="flex-grow">
                        <p className="font-bold text-gray-800 text-sm line-clamp-1">{prod.name}</p>
                        <p className="text-xs text-gray-500">{prod.category}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${estaSeleccionado ? 'border-mini-accent bg-mini-accent' : 'border-gray-300'}`}>
                        {estaSeleccionado && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setMostrarModal(false)} className="bg-mini-accent text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-pink-400">Aceptar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL PARA VER IMAGEN DE ORDEN AMPLIADA --- */}
      {imagenExpandida && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setImagenExpandida(null)} 
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <button 
              className="absolute -top-4 -right-4 bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg hover:bg-gray-200 z-10"
              onClick={() => setImagenExpandida(null)}
            >
              ✕
            </button>
            <img 
              src={imagenExpandida} 
              alt="Producto ampliado" 
              className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}

      {/* 👇 AQUÍ ESTÁ: MODAL PARA RESURTIR STOCK 👇 */}
      {modalResurtir.activo && modalResurtir.producto && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Resurtir Inventario</h3>
            <p className="text-sm text-gray-500 mb-6 border-b pb-4">
              Producto: <strong className="text-mini-accent">{modalResurtir.producto.name}</strong>
            </p>

            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
              {stockTemporal.map((variante, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-gray-700">
                      {variante.color || variante.size ? `${variante.color || ''} ${variante.size || ''}` : 'Pieza Única'}
                    </span>
                    <span className="text-xs text-gray-400">SKU: {variante.sku || 'Sin SKU'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-500">Stock:</label>
                    <input 
                      type="number" 
                      min="0"
                      value={variante.stock} 
                      onChange={(e) => {
                        const nuevoArreglo = [...stockTemporal];
                        nuevoArreglo[index].stock = parseInt(e.target.value) || 0;
                        setStockTemporal(nuevoArreglo);
                      }}
                      className="w-20 p-2 border border-gray-300 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-mini-accent"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <button 
                onClick={() => setModalResurtir({ activo: false, producto: null })}
                className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleGuardarResurtido}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-mini-accent text-white hover:bg-pink-400 transition-colors shadow-lg"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 👇 MODAL DE RASTREO DE ENVÍO 👇 */}
      {modalEnvio.activo && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border-t-4 border-mini-accent">
            <div className="text-center mb-6">
              <span className="text-4xl mb-2 block">🚚</span>
              <h3 className="text-xl font-black text-gray-800">Confirmar Envío</h3>
              <p className="text-sm text-gray-500 mt-1">Ingresa los datos para notificar al cliente.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Paquetería *</label>
                <input 
                  type="text" 
                  placeholder="Ej. FedEx, DHL, Estafeta"
                  value={datosRastreo.paqueteria}
                  onChange={(e) => setDatosRastreo({...datosRastreo, paqueteria: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-mini-accent outline-none bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Número de Guía *</label>
                <input 
                  type="text" 
                  placeholder="Ej. 1234567890"
                  value={datosRastreo.guiaEnvio}
                  onChange={(e) => setDatosRastreo({...datosRastreo, guiaEnvio: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-mini-accent outline-none bg-gray-50 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Link de Rastreo (Opcional)</label>
                <input 
                  type="url" 
                  placeholder="https://www.dhl.com/rastreo..."
                  value={datosRastreo.linkRastreo}
                  onChange={(e) => setDatosRastreo({...datosRastreo, linkRastreo: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-mini-accent outline-none bg-gray-50 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-gray-100">
              <button 
                onClick={() => setModalEnvio({ activo: false, ordenId: null })}
                className="px-6 py-2.5 rounded-full text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarEnvioOrden}
                className="px-6 py-2.5 rounded-full text-sm font-bold bg-mini-accent text-white hover:bg-pink-400 transition-colors shadow-lg flex items-center gap-2"
              >
                Guardar y Avisar 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;