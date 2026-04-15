// src/components/PagoExitoso.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const PagoExitoso = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-white p-10 rounded-3xl shadow-lg border border-pink-100 max-w-md">
        <span className="text-6xl mb-4 block">🎉</span>
        <h1 className="text-3xl font-black text-gray-800 mb-2">¡Pago Realizado!</h1>
        <p className="text-gray-600 mb-8">
          Gracias por comprar en <strong>Mini Nosky</strong>. Tu pedido ya está siendo procesado.
        </p>
        <Link 
          to="/catalogo" 
          className="bg-mini-accent text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-pink-400 transition-all"
        >
          Seguir comprando ✨
        </Link>
      </div>
    </div>
  );
};

export default PagoExitoso;