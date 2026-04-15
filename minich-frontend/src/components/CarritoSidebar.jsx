// src/components/CarritoSidebar.jsx
import React from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const CarritoSidebar = () => {
  const { carrito, isCartOpen, cerrarCarrito, eliminarDelCarrito } = useCart();

  // Calculamos el total en dinero
  const totalPrecio = carrito.reduce((total, item) => total + (item.price * item.cantidad), 0);

  const navigate = useNavigate();
  
  // Si no está abierto, no renderizamos el contenido
  if (!isCartOpen) return null;

  return (
    // Contenedor principal con fondo oscuro semi-transparente
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Fondo oscuro que al hacerle clic cierra el carrito */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={cerrarCarrito}
      ></div>

      {/* Panel blanco del carrito */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        
        {/* Cabecera del Carrito */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800">Tu Carrito 🛍️</h2>
          <button 
            onClick={cerrarCarrito} // 👈 Solo cerrar, sin navegar
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Lista de Productos (Con scroll si son muchos) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {carrito.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <p className="text-4xl mb-4">🛒</p>
              <p>Tu carrito está muy solito...</p>
            </div>
          ) : (
            carrito.map((item, index) => (
              <div key={index} className="flex gap-4 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                {/* Imagen en miniatura */}
                <div className="w-20 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-50">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-xs text-gray-400 h-full flex items-center justify-center">Sin foto</span>
                  )}
                </div>

                {/* Detalles del producto */}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 line-clamp-1">{item.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.color && <span>{item.color} </span>}
                    {item.color && item.size && <span> | </span>}
                    {item.size && <span>{item.size}</span>}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium text-mini-accent">${item.price} <span className="text-xs text-gray-400">x {item.cantidad}</span></span>
                    
                    <button 
                      onClick={() => eliminarDelCarrito(index)}
                      className="text-xs font-bold text-red-400 hover:text-red-600"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pie del Carrito (Subtotal y Botón de Pagar) */}
        {carrito.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-600">Subtotal:</span>
              <span className="text-2xl font-black text-gray-800">${totalPrecio}</span>
            </div>
            
            <button 
              onClick={() => {
                cerrarCarrito(); // 1. Cerramos el panel
                navigate('/checkout'); // 2. Navegamos a la nueva página
              }}
              className="w-full bg-mini-accent hover:bg-pink-400 text-white font-bold py-4 rounded-full shadow-lg transition-transform hover:-translate-y-1"
            >
              Ir a Pagar ✨
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CarritoSidebar;