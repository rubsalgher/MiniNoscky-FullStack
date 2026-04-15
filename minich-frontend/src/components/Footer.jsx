// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo_mini.png'; 

const Footer = () => {
  return (
    <footer className="bg-white border-t border-pink-100 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          
          {/* COLUMNA 1: Marca y Filosofía */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-mini-accent mb-4">
              <img src={logo} alt="Logo Mini Noscky" className="h-10 w-auto" />
              Mini Noscky
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Joyería de uso diario, ocasiones especiales y regalos inolvidables. Diseño, calidad y precios accesibles en un solo lugar.
            </p>
          </div>

          {/* COLUMNA 2: Contacto Directo */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-gray-800 font-bold mb-4 uppercase text-sm tracking-wider">Contacto</h3>
            <div className="space-y-4">
              <a href="https://wa.me/527821233526" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center md:justify-start gap-3 text-gray-600 hover:text-green-500 transition-colors">
                <span className="text-xl">📱</span>
                <span className="text-sm">782 123 3526</span>
              </a>
              <a href="mailto:chantal@klinik-ia.com" className="flex items-center justify-center md:justify-start gap-3 text-gray-600 hover:text-mini-accent transition-colors">
                <span className="text-xl">✉️</span>
                <span className="text-sm">chantal@klinik-ia.com</span>
              </a>
              {/* 👇 AQUÍ ESTÁ EL NUEVO ENLACE A GOOGLE MAPS 👇 */}
              <a 
                href="https://www.google.com/maps/search/?api=1&query=Calle+Zapote+17,+Chapultepec,+93240+Poza+Rica+de+Hidalgo,+Veracruz,+Mexico" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-start justify-center md:justify-start gap-3 text-gray-600 hover:text-blue-500 transition-colors text-left group"
              >
                <span className="text-xl mt-1 group-hover:scale-110 transition-transform">📍</span>
                <span className="text-sm max-w-[200px]">
                  Calle Zapote No. 17, Col. Chapultepec, C.P. 93240<br/>
                  Poza Rica, Ver., México.
                </span>
              </a>
            </div>
          </div>

          {/* COLUMNA 3: Redes Sociales */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-gray-800 font-bold mb-4 uppercase text-sm tracking-wider">Síguenos</h3>
            <p className="text-gray-500 text-sm mb-4">
              ¡Entérate de nuestras promociones y nuevos ingresos!
            </p>
            <a 
              href="https://www.facebook.com/profile.php?id=61567758826780" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-blue-700 hover:scale-105 transition-all shadow-md"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </a>
          </div>

        </div>

        {/* Derechos Reservados */}
        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Mini Noscky. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;