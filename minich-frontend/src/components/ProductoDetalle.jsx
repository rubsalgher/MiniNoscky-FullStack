// src/components/ProductoDetalle.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';

const ProductoDetalle = () => {
  const { id } = useParams();
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Estados para controlar las imágenes y selecciones
  const [indiceImagenActual, setIndiceImagenActual] = useState(0);
  
  // --- NUEVOS ESTADOS: Separamos Color y Talla ---
  const [colorActivo, setColorActivo] = useState('');
  const [tallaActiva, setTallaActiva] = useState('');
  const [errorSeleccion, setErrorSeleccion] = useState('');

  const { agregarAlCarrito } = useCart();

  useEffect(() => {
    const obtenerDetalles = async () => {
      try {
        const respuesta = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/productos/${id}`);
        setProducto(respuesta.data);
        
        // Si el producto tiene colores, autoseleccionamos el primero para que se vea la foto
        const colores = [...new Set(respuesta.data.variants.map(v => v.attributes?.color).filter(Boolean))];
        if (colores.length > 0) {
          setColorActivo(colores[0]);
        }
      } catch (error) {
        console.error("Error al cargar:", error);
      } finally {
        setCargando(false);
      }
    };
    obtenerDetalles();
  }, [id]);

  // Si cambia el color seleccionado, reiniciamos la foto a la primera y borramos la talla seleccionada
  useEffect(() => {
    setIndiceImagenActual(0);
    setTallaActiva(''); 
    setErrorSeleccion(''); // Limpiamos errores si cambia de opinión
  }, [colorActivo]);

  if (cargando) return <div className="text-center py-20 animate-pulse text-gray-500 text-xl font-medium">Cargando detalles... 🌸</div>;
  if (!producto) return <div className="text-center py-20 text-gray-500 font-medium">Producto no encontrado 😢</div>;

  // --- LÓGICA DE SEPARACIÓN DE VARIANTES ---
  const tieneColores = producto.variants.some(v => v.attributes?.color);
  const tieneTallas = producto.variants.some(v => v.attributes?.size);

  const coloresUnicos = tieneColores ? [...new Set(producto.variants.map(v => v.attributes?.color).filter(Boolean))] : [];
  
  // Filtramos las variantes que pertenecen al color seleccionado actualmente
  const variantesDelColor = tieneColores ? producto.variants.filter(v => v.attributes?.color === colorActivo) : producto.variants;
  const tallasDelColor = [...new Set(variantesDelColor.map(v => v.attributes?.size).filter(Boolean))];

  // Buscamos la variante EXACTA que el usuario ha seleccionado
  let varianteSeleccionada = null;
  if (!tieneColores && !tieneTallas) {
    varianteSeleccionada = producto.variants[0];
  } else if (tieneColores && !tieneTallas) {
    varianteSeleccionada = producto.variants.find(v => v.attributes?.color === colorActivo);
  } else if (!tieneColores && tieneTallas) {
    varianteSeleccionada = producto.variants.find(v => v.attributes?.size === tallaActiva);
  } else {
    // Tiene ambos
    varianteSeleccionada = producto.variants.find(v => v.attributes?.color === colorActivo && v.attributes?.size === tallaActiva);
  }

  // --- DATOS A MOSTRAR ---
  // Las imágenes siempre dependen del color activo (o la primera si no hay color)
  const varianteParaImagenes = variantesDelColor[0] || producto.variants[0];
  const imagenesArr = varianteParaImagenes?.images || [];
  
  // El precio y stock dependen de la variante EXACTA (si ya eligió todo), si no, mostramos un precio base
  const precio = varianteSeleccionada ? varianteSeleccionada.price : (varianteParaImagenes?.price || 0);
  const stock = varianteSeleccionada ? varianteSeleccionada.stock : null;

  const imagenSiguiente = () => setIndiceImagenActual((prev) => (prev + 1) % imagenesArr.length);
  const imagenAnterior = () => setIndiceImagenActual((prev) => (prev === 0 ? imagenesArr.length - 1 : prev - 1));
  
  // --- FUNCIÓN DEL CANDADO PARA EL CARRITO ---
  const handleAgregarCarrito = () => {
    // Validaciones
    if (tieneColores && !colorActivo) {
      setErrorSeleccion('Por favor, selecciona un color.');
      return;
    }
    if (tieneTallas && !tallaActiva) {
      setErrorSeleccion('Por favor, selecciona una talla antes de comprar.');
      return;
    }
    if (stock === 0) {
      setErrorSeleccion('Lo sentimos, esta combinación está agotada.');
      return;
    }

    // Si pasa las validaciones, se limpia el error y se "agrega"
    setErrorSeleccion('');
    agregarAlCarrito(producto, varianteSeleccionada, 1);
  };


  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/catalogo" className="inline-flex items-center text-gray-500 hover:text-mini-accent mb-10 transition-colors font-medium">
        <span className="mr-2 text-xl">←</span> Volver al catálogo
      </Link>

      <div className="bg-white rounded-3xl p-6 md:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100/50 grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        
        {/* Columna Izquierda: Visor de Imágenes */}
        <div className="space-y-6">
          {/* ¡Notarás que aquí mantuve el object-contain que hicimos en el paso anterior! */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-50 aspect-square flex items-center justify-center shadow-inner border border-gray-100 p-2">
            {imagenesArr.length > 0 ? (
              <>
                <img src={imagenesArr[indiceImagenActual]?.url} alt={producto.name} className="w-full h-full object-contain transition-opacity duration-300" />
                {imagenesArr.length > 1 && (
                  <>
                    <button onClick={imagenAnterior} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-700 p-2.5 rounded-full shadow-lg transition-all">←</button>
                    <button onClick={imagenSiguiente} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-700 p-2.5 rounded-full shadow-lg transition-all">→</button>
                  </>
                )}
              </>
            ) : (
              <span className="text-gray-400 font-medium">Sin imagen</span>
            )}
          </div>

          {imagenesArr.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
              {imagenesArr.map((imagen, indice) => (
                <button key={imagen.public_id || indice} onClick={() => setIndiceImagenActual(indice)}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${indice === indiceImagenActual ? 'border-mini-accent ring-2 ring-mini-pink shadow-md scale-105' : 'border-gray-100 hover:border-mini-pink/70'}`}>
                  <img src={imagen.url} alt={`Thumbnail ${indice + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Detalles */}
        <div className="flex flex-col gap-6 md:pt-4">
          <div>
            <span className="text-xs font-bold text-mini-accent tracking-widest uppercase bg-mini-pink/30 px-3 py-1 rounded-full shadow-inner border border-mini-pink/10">
              {producto.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mt-5 leading-tight tracking-tight">
              {producto.name}
            </h1>
          </div>

          <div className="text-4xl font-black text-gray-700 flex items-baseline gap-2 mt-2">
            ${precio} <span className="text-base font-medium text-gray-400">MXN</span>
          </div>

          <p className="text-gray-600 leading-relaxed text-lg border-l-4 border-mini-pink pl-6 py-1 my-2">
            {producto.description}
          </p>

          <hr className="border-gray-100" />

          {/* --- BLOQUE DE COLOR INDEPENDIENTE --- */}
          {tieneColores && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3 tracking-wide">COLOR / ESTILO</h3>
              <div className="flex flex-wrap gap-3">
                {coloresUnicos.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => setColorActivo(color)}
                    className={`px-5 py-2.5 rounded-xl font-bold border-2 transition-all
                      ${colorActivo === color 
                        ? 'border-mini-accent bg-pink-50 text-mini-accent shadow-inner' 
                        : 'border-gray-200 bg-white text-gray-500 hover:border-mini-pink hover:text-gray-700'
                      }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* --- BLOQUE DE TALLA INDEPENDIENTE --- */}
          {tieneTallas && (
            <div className="mt-2">
              <div className="flex justify-between items-end mb-3">
                <h3 className="text-sm font-semibold text-gray-600 tracking-wide">TALLA</h3>
                {/* Mensaje de stock dinámico */}
                <span className={`text-sm font-medium ${stock !== null ? (stock > 0 ? 'text-green-500' : 'text-red-500') : 'text-gray-400'}`}>
                  {stock !== null ? (stock > 0 ? `${stock} disponibles` : 'Agotado') : 'Selecciona una talla'}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {tallasDelColor.map((talla, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setTallaActiva(talla);
                      setErrorSeleccion(''); // Limpia el error al seleccionar
                    }}
                    className={`px-5 py-2.5 rounded-xl font-bold border-2 transition-all min-w-[3rem]
                      ${tallaActiva === talla 
                        ? 'border-gray-800 bg-gray-800 text-white shadow-inner' 
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                      }`}
                  >
                    {talla}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!tieneTallas && stock !== null && (
            <div className="mt-2 mb-4 flex justify-end">
              <span className={`text-sm font-medium ${stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stock > 0 ? `${stock} disponibles` : 'Agotado'}
              </span>
            </div>
          )}
          
          {/* Mensaje de Error (El Candado) */}
          {errorSeleccion && (
            <div className="text-red-500 font-medium text-sm mt-2 bg-red-50 p-3 rounded-lg border border-red-100">
              ⚠️ {errorSeleccion}
            </div>
          )}

          {/* Botón de Acción */}
          <button 
            onClick={handleAgregarCarrito}
            disabled={stock === 0}
            className={`mt-4 w-full text-white text-lg font-extrabold py-4.5 rounded-full shadow-md transition-all transform hover:-translate-y-1
              ${stock === 0 ? 'bg-gray-400 cursor-not-allowed hover:translate-y-0' : 'bg-mini-accent hover:bg-pink-400 hover:shadow-lg'}`
            }>
            {stock === 0 ? 'Agotado temporalmente' : 'Añadir al Carrito 🛍️'}
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default ProductoDetalle;