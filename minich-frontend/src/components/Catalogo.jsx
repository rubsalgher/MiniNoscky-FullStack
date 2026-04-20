// src/components/Catalogo.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext'; // 👈 1. Importamos el contexto del carrito

const Catalogo = () => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // 👈 2. Extraemos las funciones del carrito
  const { agregarAlCarrito, abrirCarrito } = useCart();
  
  // Estados para Filtros y Buscador
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('relevancia');

  const categorias = ['Todos', 'Regalos', 'Accesorios', 'Importados'];

  useEffect(() => {
    const obtenerProductos = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/productos`);
        setProductos(data);
      } catch (error) {
        console.error("Error al cargar productos", error);
      } finally {
        setCargando(false);
      }
    };
    obtenerProductos();
  }, []);

  // --- LÓGICA DE FILTRADO Y BÚSQUEDA ---
  const productosFiltrados = productos
    .filter(p => {
      const coincideCategoria = categoriaActiva === 'Todos' || p.category === categoriaActiva;
      const coincideBusqueda = p.name.toLowerCase().includes(busqueda.toLowerCase());
      return coincideCategoria && coincideBusqueda;
    })
    .sort((a, b) => {
      const precioA = a.variants?.[0]?.price || 0;
      const precioB = b.variants?.[0]?.price || 0;
      if (orden === 'precio-min') return precioA - precioB;
      if (orden === 'precio-max') return precioB - precioA;
      if (orden === 'az') return a.name.localeCompare(b.name);
      return 0;
    });

  // 👈 3. Función para añadir rápido al carrito
  const handleAñadirRapido = (e, prod) => {
    e.preventDefault(); 
    
    // Tomamos la primera variante disponible como "default"
    const varianteDefault = prod.variants?.[0];
    
    if (varianteDefault && varianteDefault.stock > 0) {
      // Usamos EXACTAMENTE la misma función que ProductoDetalle:
      // (producto completo, variante elegida, cantidad)
      agregarAlCarrito(prod, varianteDefault, 1);
      
      // Abrimos el carrito para confirmar
      abrirCarrito(); 
    } else {
      alert("Este producto está agotado por el momento. 🌸");
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mini-accent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Título y Buscador */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-gray-800 mb-4">Nuestro Catálogo 🎁</h1>
        <div className="max-w-md mx-auto relative">
          <input 
            type="text" 
            placeholder="¿Qué estás buscando?..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full px-6 py-3 rounded-full border border-pink-100 shadow-sm focus:ring-2 focus:ring-mini-accent outline-none text-gray-600"
          />
          <span className="absolute right-5 top-3 text-xl">🔍</span>
        </div>
      </div>

      {/* Barra de Filtros y Orden */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 border-b border-gray-100 pb-6">
        
        {/* Categorías */}
        <div className="flex flex-wrap justify-center gap-2">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                categoriaActiva === cat 
                ? 'bg-mini-accent text-white shadow-md scale-105' 
                : 'bg-white text-gray-500 hover:bg-pink-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Info y Ordenamiento */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 font-medium">
            {productosFiltrados.length} productos
          </span>
          <select 
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 outline-none focus:ring-1 focus:ring-mini-accent cursor-pointer"
          >
            <option value="relevancia">Ordenar por: Relevancia</option>
            <option value="az">Nombre: A-Z</option>
            <option value="precio-min">Precio: Menor a Mayor</option>
            <option value="precio-max">Precio: Mayor a Menor</option>
          </select>
        </div>
      </div>

      {/* GRID DE PRODUCTOS */}
      {productosFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {productosFiltrados.map((prod) => {
            const imagenUrl = prod.variants?.[0]?.images?.[0]?.url || 'https://via.placeholder.com/300';
            const precioMin = prod.variants?.[0]?.price || 0;
            const tieneStock = prod.variants?.[0]?.stock > 0;
            
            // 👇 NUEVA LÓGICA: ¿Tiene opciones para elegir? (Más de 1 variante)
            const tieneMultiplesOpciones = prod.variants?.length > 1;

            return (
              <Link 
                to={`/producto/${prod._id}`} 
                key={prod._id}
                className="group flex flex-col bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-50 relative"
              >
                {/* Imagen */}
                <div className="relative aspect-square overflow-hidden bg-gray-50">
                  <img 
                    src={imagenUrl} 
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {!tieneStock && (
                    <div className="absolute top-4 left-4 bg-gray-800/80 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                      AGOTADO
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 text-mini-accent text-[10px] font-black px-3 py-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    VER DETALLE
                  </div>
                </div>

                {/* Info */}
                <div className="p-6 pb-20">
                  <span className="text-[10px] font-bold text-mini-accent uppercase tracking-widest mb-1 block">
                    {prod.category}
                  </span>
                  <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-mini-accent transition-colors line-clamp-1">
                    {prod.name}
                  </h3>
                  <div className="flex items-end mt-auto">
                    <p className="text-gray-900 font-black text-xl">
                      {/* Si tiene varias opciones, ponemos "Desde" */}
                      {tieneMultiplesOpciones && <span className="text-sm font-normal text-gray-400 mr-1">Desde</span>}
                      ${precioMin}
                    </p>
                  </div>
                </div>

                {/* 👈 BOTÓN DE AÑADIR RÁPIDO (Se oculta si hay que elegir talla/color) */}
                {!tieneMultiplesOpciones && (
                  <button 
                    onClick={(e) => handleAñadirRapido(e, prod)}
                    disabled={!tieneStock}
                    className={`absolute bottom-4 right-4 w-12 h-12 flex items-center justify-center rounded-full shadow-lg transition-all transform hover:scale-110 ${
                      tieneStock 
                      ? 'bg-mini-accent text-white hover:bg-pink-400' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    title={tieneStock ? "Añadir al carrito" : "Agotado"}
                  >
                    <span className="text-2xl leading-none -mt-1">+</span>
                  </button>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
          <span className="text-6xl mb-4 block">🔍</span>
          <h3 className="text-xl font-bold text-gray-800">No encontramos lo que buscas</h3>
          <p className="text-gray-500">Intenta con otra palabra o categoría.</p>
          <button 
            onClick={() => {setBusqueda(''); setCategoriaActiva('Todos');}}
            className="mt-6 text-mini-accent font-bold underline hover:text-pink-400"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
};

export default Catalogo;