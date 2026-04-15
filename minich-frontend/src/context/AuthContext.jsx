// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);

  // Cuando la página carga, revisamos si el usuario ya se había logueado antes
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuarioMiniNosky');
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, []);

  // Función para iniciar sesión (guarda en React y en la memoria del navegador)
  const login = (datosUsuario) => {
    setUsuario(datosUsuario);
    localStorage.setItem('usuarioMiniNosky', JSON.stringify(datosUsuario));
  };

  // --- NUEVA FUNCIÓN: ACTUALIZAR DATOS SIN CERRAR SESIÓN ---
  const actualizarUsuario = (nuevosDatos) => {
    setUsuario((prev) => {
      // Combinamos los datos que ya teníamos con los nuevos (como la dirección)
      const usuarioActualizado = { ...prev, ...nuevosDatos };
      
      // Actualizamos el localStorage para que al refrescar (F5) sigan ahí
      localStorage.setItem('usuarioMiniNosky', JSON.stringify(usuarioActualizado));
      
      return usuarioActualizado;
    });
  };

  // Función para cerrar sesión (borra todo)
  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('usuarioMiniNosky');
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
};