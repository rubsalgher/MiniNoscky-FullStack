// src/components/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      // Hacemos la petición a la ruta de login del backend
      const respuesta = await axios.post('https://mininoscky-backend.onrender.com/api/usuarios/login', formData);
      
      // Guardamos la sesión en el contexto
      login(respuesta.data);
      
      // Redirigimos al inicio
      navigate('/');
      
    } catch (err) {
      setError(err.response?.data?.error || 'Correo o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
        
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-800">¡Hola de nuevo! 👋</h2>
          <p className="mt-2 text-sm text-gray-500">Ingresa a tu cuenta de Mini Noscky</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-medium text-center border border-red-100">
            ⚠️ {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent focus:bg-white outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent focus:bg-white outline-none transition-all" />
          </div>

          <button type="submit" disabled={cargando} className={`w-full py-4 rounded-full font-bold text-white shadow-md transition-all ${cargando ? 'bg-gray-400' : 'bg-mini-accent hover:bg-pink-400 hover:-translate-y-1'}`}>
            {cargando ? 'Entrando...' : 'Iniciar Sesión 🌸'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          ¿Aún no tienes cuenta? <Link to="/registro" className="font-bold text-mini-accent hover:underline">Regístrate gratis</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;