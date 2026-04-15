// src/components/VerificarCuenta.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const VerificarCuenta = () => {
  const { token } = useParams(); // Extraemos el código de la URL
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  const yaVerificado = useRef(false);

  useEffect(() => {
    if (yaVerificado.current) return;

    const confirmarCuenta = async () => {
      try {
        const respuesta = await axios.get(`http://localhost:5000/api/usuarios/verificar/${token}`);
        
        // Marcamos como verificado exitosamente
        yaVerificado.current = true;
        setMensaje(respuesta.data.mensaje);
        setError(''); // Limpiamos errores
      } catch (err) {
        // SOLO mostramos error si la referencia sigue en falso
        // Si yaVerificado es true, ignoramos cualquier error posterior (como el 400 del segundo intento)
        if (!yaVerificado.current) {
          setError(err.response?.data?.error || 'Error al verificar');
        }
      } finally {
        setCargando(false);
      }
    };

    confirmarCuenta();
  }, [token]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 text-center">
        
        {cargando ? (
          <div className="animate-pulse space-y-4">
            <div className="text-4xl">⏳</div>
            <h2 className="text-xl font-bold text-gray-700">Verificando tu cuenta...</h2>
            <p className="text-sm text-gray-500">Solo tomará un segundo.</p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="text-5xl">😢</div>
            <h2 className="text-2xl font-bold text-red-500">¡Ups! Algo salió mal</h2>
            <p className="text-sm text-gray-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>
            <Link to="/registro" className="inline-block mt-4 text-mini-accent font-bold hover:underline">
              Volver a intentar registrarme
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-6xl animate-bounce">🌸</div>
            <h2 className="text-2xl font-bold text-gray-800">¡Todo listo!</h2>
            <p className="text-gray-600 bg-green-50 p-3 rounded-xl border border-green-100 text-sm">
              {mensaje}
            </p>
            <Link 
              to="/login" 
              className="inline-block w-full py-4 rounded-full font-bold text-white shadow-md bg-mini-accent hover:bg-pink-400 hover:-translate-y-1 transition-all"
            >
              Iniciar Sesión Ahora ✨
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerificarCuenta;