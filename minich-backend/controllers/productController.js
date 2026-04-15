// controllers/productController.js
import Product from '../models/Product.js';
import { v2 as cloudinary } from 'cloudinary';

// Función para crear un nuevo producto
export const createProduct = async (req, res) => {
  try {
    const { name, description, category, brand, variants } = req.body;

    // Convertimos el texto de variantes a un arreglo de objetos JSON
    let parsedVariants = variants ? JSON.parse(variants) : [];

    // --- LA MAGIA OCURRE AQUÍ ---
    // Recorremos los archivos subidos. El frontend nos enviará 'image_0', 'image_1', etc.
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Extraemos el número del nombre del campo (ej. de 'image_1' extraemos el '1')
        const match = file.fieldname.match(/image_(\d+)/);
        if (match) {
          const groupIndex = parseInt(match[1]);
          
          parsedVariants.forEach(variant => {
            if (variant.groupIndex === groupIndex) {
              if (!variant.images) {
                variant.images = [];
              }
              variant.images.push({
                url: file.path, 
                public_id: file.filename
              });
            }
          });
        }
      });
    }

    parsedVariants = parsedVariants.map(v => {
      const { groupIndex, ...rest } = v;
      return rest;
    });

    const newProduct = new Product({
      name,
      description,
      category,
      brand: brand || 'Mini Nosky',
      variants: parsedVariants
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      mensaje: 'Producto y variantes creados exitosamente',
      producto: savedProduct
    });

  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Hubo un problema al crear el producto' });
  }
};

// 2. Función para obtener todos los productos
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Hubo un problema al obtener los productos' });
  }
};

// 3. Función para obtener un solo producto por su ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.status(200).json(product);
  } catch (error) {
    console.error('Error al obtener el producto:', error);
    res.status(500).json({ error: 'Hubo un problema al buscar el producto' });
  }
};

// 4. Función para actualizar un producto (PUT)
export const updateProduct = async (req, res) => {
  try {
    // Buscamos por ID y actualizamos con los datos que vengan en req.body
    // La opción { new: true } hace que MongoDB nos devuelva el producto YA actualizado
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.status(200).json({
      mensaje: 'Producto actualizado exitosamente',
      producto: updatedProduct
    });
  } catch (error) {
    console.error('Error al actualizar el producto:', error);
    res.status(500).json({ error: 'Hubo un problema al actualizar el producto' });
  }
};


// 5. Función para eliminar un producto (DELETE)
export const deleteProduct = async (req, res) => {
  try {
    // Primero solo lo buscamos, no lo borramos de inmediato
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Paso Profesional: Borrar las imágenes de la nube de Cloudinary
    if (product.variants && product.variants.length > 0) {
      for (let variant of product.variants) {
        if (variant.images && variant.images.length > 0) {
          for (let image of variant.images) {
            // Usamos el public_id que guardamos para destruir la imagen
            await cloudinary.uploader.destroy(image.public_id);
          }
        }
      }
    }

    // Una vez limpiada la nube, borramos el documento de MongoDB
    await product.deleteOne();

    res.status(200).json({ mensaje: 'Producto y sus imágenes eliminados definitivamente' });
  } catch (error) {
    console.error('Error al eliminar el producto:', error);
    res.status(500).json({ error: 'Hubo un problema al eliminar el producto' });
  }
};