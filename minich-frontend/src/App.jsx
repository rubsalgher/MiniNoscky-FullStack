// src/App.jsx
import React, { useState, useEffect, useRef } from 'react'; // <-- Agregamos useRef
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import Footer from './components/Footer';

import Navbar from './components/Navbar';
import Catalogo from './components/Catalogo';
import Admin from './components/Admin';
import ProductoDetalle from './components/ProductoDetalle';
import CarritoSidebar from './components/CarritoSidebar';
import Registro from './components/Registro';
import Login from './components/Login';
import VerificarCuenta from './components/VerificarCuenta';
import Checkout from './components/Checkout';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PagoExitoso from './components/PagoExitoso';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

import Perfil from './components/Perfil';

import EscaneoOrden from './components/EscaneoOrden';

const stripePromise = loadStripe('pk_test_51TKs3RB6r1DlICRdGX3GknzlATejBwYml0UAs5hzzJO4yCHxT2wgzaHqjJByn6VZZjpdMZTvgPC2gQdLsZqCVOrJ00RT6NlFPd');

// --- COMPONENTE INICIO CON CARRUSEL MEJORADO ---
const Inicio = () => {
  const [productosCarrusel, setProductosCarrusel] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Referencia para controlar el carrusel con botones
  const carruselRef = useRef(null);

  useEffect(() => {
    const cargarCarrusel = async () => {
      try {
        const res = await axios.get('https://mininoscky-backend.onrender.com/api/settings');
        if (res.data && res.data.carrusel && res.data.carrusel.productosElegidos) {
          setProductosCarrusel(res.data.carrusel.productosElegidos);
        }
      } catch (error) {
        console.error("Error al cargar el carrusel:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarCarrusel();
  }, []);

  // Funciones para deslizar el carrusel
  const scrollIzq = () => {
    if (carruselRef.current) {
      carruselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollDer = () => {
    if (carruselRef.current) {
      carruselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col items-center w-full bg-white">
      
      {/* SECCIÓN 1: Hero */}
      <section className="w-full bg-gradient-to-b from-pink-50 to-white px-6 py-16 md:py-24 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 mb-6 leading-tight">
          Accesorios con estilo.<br />
          <span className="text-mini-accent">Regalos con propósito.</span>
        </h1>
        <p className="text-gray-600 text-lg md:text-xl max-w-2xl mb-10">
          Descubre nuestra exclusiva selección de joyería en oro laminado, rodio y acero. Calidad, diseño y detalles inolvidables a precios que te encantarán.
        </p>
        <Link 
          to="/catalogo" 
          className="bg-mini-accent text-white font-bold text-lg px-8 py-4 rounded-full shadow-xl hover:bg-pink-400 hover:scale-105 transition-all duration-300"
        >
          Explorar Catálogo ✨
        </Link>
      </section>

      {/* SECCIÓN 2: CARRUSEL DE PRODUCTOS ESTRELLA */}
      {!cargando && productosCarrusel.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 py-12">
          <div className="flex justify-between items-end mb-8 px-2 md:px-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              Nuestros Favoritos 🌸
            </h2>
            <Link to="/catalogo" className="text-mini-accent font-bold hover:text-pink-400 text-sm md:text-base transition-colors">
              Ver todos →
            </Link>
          </div>

          {/* Envoltorio Relativo para las flechas */}
          <div className="relative group px-2 md:px-6">
            
            {/* Botón Izquierda (Oculto en móvil, aparece al pasar el mouse en PC) */}
            <button 
              onClick={scrollIzq} 
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white w-12 h-12 flex items-center justify-center rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.15)] text-mini-accent font-bold text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex hover:bg-pink-50 hover:scale-110"
            >
              &#8249;
            </button>

            {/* Contenedor del Carrusel (Sin barra de scroll) */}
            <div 
              ref={carruselRef}
              className="flex overflow-x-auto gap-6 pb-4 pt-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {productosCarrusel.map(prod => {
                if (!prod) return null;
                const imagenUrl = prod.variants?.[0]?.images?.[0]?.url || 'https://via.placeholder.com/300';
                const precio = prod.variants?.[0]?.price || 0;

                return (
                  <Link 
                    to={`/producto/${prod._id}`} 
                    key={prod._id}
                    className="flex-none w-64 md:w-72 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-xl border border-gray-100 transition-all duration-300 snap-center group/card"
                  >
                    <div className="overflow-hidden rounded-t-3xl h-64 bg-gray-50">
                      <img 
                        src={imagenUrl} 
                        alt={prod.name} 
                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-800 text-lg mb-2 truncate group-hover/card:text-mini-accent transition-colors">
                        {prod.name}
                      </h3>
                      <p className="text-gray-900 font-black text-xl">${precio} <span className="text-sm font-normal text-gray-500">MXN</span></p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Botón Derecha (Oculto en móvil, aparece al pasar el mouse en PC) */}
            <button 
              onClick={scrollDer} 
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white w-12 h-12 flex items-center justify-center rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.15)] text-mini-accent font-bold text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex hover:bg-pink-50 hover:scale-110"
            >
              &#8250;
            </button>
          </div>
        </section>
      )}

      {/* SECCIÓN 3: Nuestra Esencia */}
      <section className="w-full max-w-5xl px-6 py-20 text-center flex flex-col items-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
          La Esencia de Mini Noscky
        </h2>
        <p className="text-gray-600 leading-relaxed text-base md:text-lg max-w-3xl">
          Creemos que la elegancia se lleva todos los días. Hemos creado este espacio para ti, donde encontrarás desde joyería de uso diario de alta durabilidad, hasta ese regalo ideal para sorprender a quien más quieres. Diseño, calidad y precios accesibles en un solo lugar.
        </p>
      </section>
      
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-mini-gray font-sans flex flex-col">
            <Navbar />
            <CarritoSidebar />
            
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Inicio />} />
                <Route path="/catalogo" element={<Catalogo />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/producto/:id" element={<ProductoDetalle />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/login" element={<Login />} />
                <Route path="/verificar/:token" element={<VerificarCuenta />} />
                <Route 
                  path="/checkout" 
                  element={
                    <Elements stripe={stripePromise}>
                      <Checkout />
                    </Elements>
                  } 
                />
                <Route path="/mi-perfil" element={<Perfil />} />
                <Route path="/pago-exitoso" element={<PagoExitoso />} />
                <Route path="/admin/escanear/:id" element={<EscaneoOrden />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;