// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo_mini.png';

const Navbar = () => {
  const { carrito, abrirCarrito } = useCart();
  const { usuario, logout } = useAuth(); 
  const navigate = useNavigate();
  
  // Estado para controlar el menú de hamburguesa en celulares
  const [menuMobileAbierto, setMenuMobileAbierto] = useState(false);

  const totalPiezas = carrito.reduce((total, item) => total + item.cantidad, 0);

  const handleLogout = () => {
    logout();
    setMenuMobileAbierto(false); // Cerramos el menú al salir
    navigate('/'); 
  };

  const cerrarMenu = () => {
    setMenuMobileAbierto(false);
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* 1. SECCIÓN IZQUIERDA: Menú Hamburguesa (SOLO MÓVIL) */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setMenuMobileAbierto(!menuMobileAbierto)}
              className="p-2 text-gray-600 hover:text-mini-accent focus:outline-none"
            >
              {/* Ícono de Hamburguesa en SVG */}
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuMobileAbierto ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> // Ícono de "X" al abrir
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /> // Ícono de 3 rayitas
                )}
              </svg>
            </button>
          </div>

          {/* 2. SECCIÓN CENTRAL: Logo (Centrado en móvil, a la izquierda en PC) */}
          <div className="flex-1 flex justify-center md:justify-start items-center">
            <Link to="/" className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl font-bold text-mini-accent tracking-wide hover:opacity-80 transition-opacity" onClick={cerrarMenu}>
              <img src={logo} alt="Logo Mini Noscky" className="h-8 md:h-10 w-auto object-contain" />
              Mini Noscky
            </Link>
          </div>

          {/* 3. SECCIÓN DERECHA: Menú Escritorio (SOLO PC) */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-600 hover:text-mini-accent font-medium transition-colors">Inicio</Link>
            <Link to="/catalogo" className="text-gray-600 hover:text-mini-accent font-medium transition-colors">Catálogo</Link>
            
            {usuario && usuario.rol === 'admin' && (
              <Link to="/admin" className="text-gray-600 hover:text-mini-accent font-medium transition-colors">Administrador</Link>
            )}
            
            {/* Lógica de Usuario en Escritorio */}
            {usuario ? (
              <div className="flex items-center space-x-4 border-l pl-4 border-gray-200">
                <Link to="/mi-perfil" className="text-gray-600 font-bold hover:text-mini-accent">Hola, {usuario.nombre}</Link>
                <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-600 font-bold transition-colors">Salir</button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 border-l pl-4 border-gray-200">
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-mini-accent transition-colors">Entrar</Link>
                <Link to="/registro" className="text-sm font-bold bg-mini-accent text-white px-4 py-2 rounded-full hover:bg-pink-400 transition-colors shadow-sm">Registrarse</Link>
              </div>
            )}
          </div>

          {/* 4. SECCIÓN EXTREMA DERECHA: Carrito (SIEMPRE VISIBLE) */}
          <div className="flex items-center justify-end">
            <button onClick={abrirCarrito} className="relative p-2 text-gray-600 hover:text-mini-accent transition-colors">
              <span className="text-2xl">🛒</span>
              {totalPiezas > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full shadow-sm">
                  {totalPiezas}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* --- MENÚ DESPLEGABLE MÓVIL --- */}
      {/* Esto solo se muestra si menuMobileAbierto es true y estamos en una pantalla pequeña */}
      {menuMobileAbierto && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full left-0 z-40">
          <div className="px-4 pt-2 pb-6 space-y-1 flex flex-col">
            <Link to="/" onClick={cerrarMenu} className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-mini-accent hover:bg-pink-50 rounded-lg">
              Inicio
            </Link>
            <Link to="/catalogo" onClick={cerrarMenu} className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-mini-accent hover:bg-pink-50 rounded-lg">
              Catálogo
            </Link>
            
            {usuario && usuario.rol === 'admin' && (
              <Link to="/admin" onClick={cerrarMenu} className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-mini-accent hover:bg-pink-50 rounded-lg">
                Administrador
              </Link>
            )}

            {/* Separador visual para la sección de usuario */}
            <div className="border-t border-gray-100 my-2 pt-2"></div>

            {usuario ? (
              <>
                <div className="px-3 py-2">
                  <p className="text-sm text-gray-500">Conectado como:</p>
                  <p className="text-base font-bold text-gray-800">{usuario.nombre} {usuario.apellidos}</p>
                </div>
                <button onClick={handleLogout} className="w-full text-left px-3 py-3 text-base font-bold text-red-500 hover:bg-red-50 rounded-lg">
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2 px-3 pt-2">
                <Link to="/login" onClick={cerrarMenu} className="text-center py-3 text-mini-accent font-bold border border-mini-accent rounded-xl hover:bg-pink-50">
                  Entrar
                </Link>
                <Link to="/registro" onClick={cerrarMenu} className="text-center py-3 bg-mini-accent text-white font-bold rounded-xl hover:bg-pink-400 shadow-md">
                  Crear Cuenta
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;