// src/context/CartContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react'; // 1. Agregamos useEffect
import axios from 'axios'; // 2. Agregamos axios
import { useAuth } from './AuthContext'; // 3. Importamos useAuth

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [carrito, setCarrito] = useState([]);
  const { usuario } = useAuth(); // 4. Obtenemos al usuario logueado
  const [isCartOpen, setIsCartOpen] = useState(false);

  // --- EFECTO A: Cargar el carrito de la BD al iniciar sesión ---
  useEffect(() => {
    const cargarCarritoBD = async () => {
      // Si hay usuario pero el carrito está vacío (apenas inicia sesión)
      if (usuario && usuario.token) {
        try {
          const { data } = await axios.get('http://localhost:5000/api/usuarios/carrito', {
            headers: { Authorization: `Bearer ${usuario.token}` }
          });
          if (data) setCarrito(data);
        } catch (error) {
          console.error("Error cargando carrito de la BD", error);
        }
      }
    };
    cargarCarritoBD();
  }, [usuario]); // Se dispara cuando el usuario inicia o cierra sesión

  // --- EFECTO B: Guardar el carrito en la BD cada vez que cambie ---
  useEffect(() => {
    const persistirCarrito = async () => {
      if (!usuario || !usuario.token) return;

        try {
          await axios.post(
            'http://localhost:5000/api/usuarios/carrito',
            { carrito },
            { headers: { Authorization: `Bearer ${usuario.token}` } }
          );
        } catch (error) {
          console.error("Error guardando carrito en la BD", error);
        }
    };
    
    persistirCarrito();
    
  }, [JSON.stringify(carrito), usuario?.token]); // Se dispara si el carrito cambia o el usuario cambia

  useEffect(() => {
    if (!usuario) {
      vaciarCarrito();
    }
  }, [usuario]);
  
  const abrirCarrito = () => setIsCartOpen(true);
  const cerrarCarrito = () => setIsCartOpen(false);

  const agregarAlCarrito = (producto, varianteSeleccionada, cantidad = 1) => {
    const itemIndex = carrito.findIndex(item => 
      item._id === producto._id &&
      item.color === varianteSeleccionada.attributes?.color &&
      item.size === varianteSeleccionada.attributes?.size
    );

    if (itemIndex !== -1) {
      const stockDisponible = varianteSeleccionada.stock;
      if (carrito[itemIndex].cantidad + cantidad <= stockDisponible) {
        const nuevoCarrito = [...carrito];
        nuevoCarrito[itemIndex].cantidad += cantidad;
        setCarrito(nuevoCarrito);
        alert(`¡Agregaste otro más! Tienes ${nuevoCarrito[itemIndex].cantidad} en el carrito.`);
      } else {
        alert('¡Ups! Ya no hay más piezas disponibles.');
      }
    } else {
      const nuevoItem = {
        _id: producto._id,
        name: producto.name,
        price: varianteSeleccionada.price,
        color: varianteSeleccionada.attributes?.color,
        size: varianteSeleccionada.attributes?.size,
        image: varianteSeleccionada.images?.[0]?.url || '',
        stock: varianteSeleccionada.stock,
        cantidad: cantidad
      };
      setCarrito([...carrito, nuevoItem]);
      alert('¡Producto agregado al carrito de Mini Nosky! 🛍️'); 
    }
  };

  const eliminarDelCarrito = (index) => {
    setCarrito(carritoActual => carritoActual.filter((_, i) => i !== index));
  };

  const vaciarCarrito = () => {
    setCarrito([]);
  };

  return (
    <CartContext.Provider value={{ 
      carrito, agregarAlCarrito, eliminarDelCarrito, vaciarCarrito,
      isCartOpen, abrirCarrito, cerrarCarrito 
    }}>
      {children}
    </CartContext.Provider>
  );
};