// src/components/Registro.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Registro = () => {
  const [formData, setFormData] = useState({
    nombre: '', apellidos: '', email: '', password: '', telefono: ''
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate(); // Para redirigir al usuario después de registrarse
  const { login } = useAuth();    // Para guardar su sesión automáticamente

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    if (formData.telefono.length !== 10 || isNaN(formData.telefono)) {
      setError('El número de celular debe tener exactamente 10 dígitos numéricos.');
      setCargando(false);
      return;
    }

    try {
      const respuesta = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios/registro`, formData);
      
      // En su lugar, mostramos una alerta avisándole que revise su correo
      alert('¡Cuenta creada con éxito! 🌸\n\n' + respuesta.data.mensaje);
      
      // Lo mandamos a la página de login para que espere ahí
      navigate('/login');
      
    } catch (err) {
      setError(err.response?.data?.error || 'Hubo un error al crear la cuenta');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
        
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-800">Crea tu cuenta 🌸</h2>
          <p className="mt-2 text-sm text-gray-500">Únete a Mini Nosky y guarda tus cositas lindas</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-medium text-center border border-red-100">
            ⚠️ {error}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
              <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent focus:bg-white outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Apellidos</label>
              <input type="text" name="apellidos" required value={formData.apellidos} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent focus:bg-white outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent focus:bg-white outline-none transition-all" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Celular (10 dígitos)</label>
            <input type="tel" name="telefono" required value={formData.telefono} onChange={handleChange} placeholder="Ej. 7821234567" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent focus:bg-white outline-none transition-all" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" name="password" required minLength="6" value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mini-accent focus:bg-white outline-none transition-all" />
          </div>

          <button type="submit" disabled={cargando} className={`w-full py-3.5 rounded-full font-bold text-white shadow-md transition-all ${cargando ? 'bg-gray-400' : 'bg-mini-accent hover:bg-pink-400 hover:-translate-y-1'}`}>
            {cargando ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          ¿Ya tienes cuenta? <Link to="/login" className="font-bold text-mini-accent hover:underline">Inicia Sesión aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default Registro;