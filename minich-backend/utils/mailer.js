// utils/mailer.js
import nodemailer from 'nodemailer';

export const enviarCorreoVerificacion = async (emailDestino, nombre, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true, 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const urlFrontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    const urlVerificacion = `${urlFrontend}/verificar/${token}`;

    const mailOptions = {
      from: `"Mini Noscky 🌸" <${process.env.EMAIL_USER}>`,
      to: emailDestino,
      subject: '¡Bienvenido a Mini Noscky! Confirma tu cuenta ✨',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fce7f3; border-radius: 15px;">
          <h2 style="color: #db2777; text-align: center;">¡Hola, ${nombre}! 👋</h2>
          <p style="color: #4b5563; font-size: 16px;">Estamos muy felices de que te unas a la familia Mini Noscky.</p>
          <p style="color: #4b5563; font-size: 16px;">Para poder acceder a tu cuenta y hacer compras, por favor confirma tu correo electrónico haciendo clic en el siguiente botón:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${urlVerificacion}" style="background-color: #db2777; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">Confirmar mi cuenta</a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">Si tú no creaste esta cuenta, puedes ignorar este correo de forma segura.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo de verificación enviado a: ${emailDestino}`);

  } catch (error) {
    console.error("Error al enviar el correo:", error);
    throw new Error("No se pudo enviar el correo de verificación");
  }
};

export const enviarCorreoCompra = async (emailDestino, nombre, orden) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 1. Armamos la lista de productos
    const listaProductosHTML = orden.productos.map(prod => `
      <tr style="border-bottom: 1px solid #fce7f3;">
        <td style="padding: 12px 0; color: #4b5563; font-size: 14px;">${prod.name} <strong>x${prod.cantidad}</strong></td>
        <td style="padding: 12px 0; color: #db2777; text-align: right; font-weight: bold; font-size: 14px;">$${(prod.price * prod.cantidad).toLocaleString()}</td>
      </tr>
    `).join('');

    // 2. Información de Entrega
    const direccionEnvioHTML = (orden.metodoEntrega === 'envio' && orden.direccionEnvio)
      ? `<p style="color: #4b5563; font-size: 14px; margin: 5px 0;">${orden.direccionEnvio.calle}, ${orden.direccionEnvio.colonia}</p>
         <p style="color: #4b5563; font-size: 14px; margin: 5px 0;">${orden.direccionEnvio.ciudad}, ${orden.direccionEnvio.estado}. CP: ${orden.direccionEnvio.cp}</p>`
      : `<p style="color: #db2777; font-size: 14px; margin: 5px 0; font-weight: bold;">📍 Recolección en Tienda / Local</p>`;

    // 3. Lógica Condicional: ¿QR o Aviso de Paquetería?
    const idString = orden._id.toString();
    const urlFrontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    const urlEscanerAdmin = `${urlFrontend}/admin/escanear/${idString}`;
    const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(urlEscanerAdmin)}&format=png`;

    const bloqueEntregaHTML = orden.metodoEntrega === 'recoleccion' 
      ? `
        <div style="background-color: #fff0f5; border-left: 4px solid #ff9eb5; padding: 12px 16px; margin: 20px auto; max-width: 500px; border-radius: 0 8px 8px 0; text-align: left;">
          <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.5;">
            <strong style="color: #d84b72;">🌸 Nota importante sobre tu código QR:</strong><br> 
            Si estás viendo este mensaje en tu carpeta de <strong>Spam</strong>, es posible que la imagen de tu Código de Entrega esté oculta. Por favor, haz clic en <em>"Mostrar imágenes"</em> para poder visualizarlo y presentarlo en tu recolección.
          </p>
        </div>
        <div style="text-align: center; margin: 25px 0; padding: 20px; border: 2px dashed #fbcfe8; border-radius: 15px; background-color: #fdf2f8;">
          <p style="color: #db2777; font-weight: bold; margin-top: 0; margin-bottom: 10px;">Tu Código de Entrega</p>
          <img src="${qrImageSrc}" alt="Código QR de la Orden" style="border-radius: 10px; width: 150px; height: 150px;" />
          <p style="color: #9ca3af; font-size: 12px; margin-top: 10px; margin-bottom: 0;">Muestra este código en el local al recoger tu pedido.</p>
        </div>
      `
      : `
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 15px; text-align: center; margin: 25px 0; border: 1px solid #bbf7d0;">
          <p style="color: #166534; font-size: 16px; font-weight: bold; margin: 0;">🚚 Envío a Domicilio Confirmado</p>
          <p style="color: #15803d; font-size: 14px; margin-top: 8px; margin-bottom: 0;">Tu pedido será preparado pronto. Te avisaremos por este medio cuando vaya en camino junto con tu número de guía.</p>
        </div>
      `;

    // 4. Diseñamos el correo final
    const mailOptions = {
      from: `"Mini Noscky 🌸" <${process.env.EMAIL_USER}>`,
      to: emailDestino,
      subject: `¡Gracias por tu compra! Confirmación de Orden #${orden._id.toString().slice(-6).toUpperCase()} 🛍️`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fce7f3; border-radius: 15px; background-color: #ffffff;">
          
          <div style="text-align: center; border-bottom: 2px dashed #fce7f3; padding-bottom: 20px; margin-bottom: 20px;">
            <h1 style="color: #db2777; margin: 0; font-size: 28px;">Mini Noscky</h1>
            <p style="color: #9ca3af; font-size: 14px; margin-top: 5px;">Joyería y Regalos Inolvidables</p>
          </div>

          <h2 style="color: #374151; text-align: center; margin-top: 20px;">¡Gracias por tu compra, ${nombre}! 🎉</h2>
          <p style="color: #4b5563; font-size: 15px; text-align: center; line-height: 1.5;">Hemos recibido tu pago correctamente y tu orden ya está en proceso.</p>

          ${bloqueEntregaHTML}

          <div style="background-color: #fdf2f8; padding: 15px 20px; border-radius: 10px; margin: 25px 0;">
            <h3 style="color: #db2777; margin-top: 0; font-size: 16px;">Detalles de la Orden</h3>
            <p style="color: #4b5563; margin: 5px 0; font-size: 14px;"><strong>Número de Orden:</strong> #${orden._id.toString().slice(-6).toUpperCase()}</p>
            <p style="color: #4b5563; margin: 5px 0; font-size: 14px;"><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
            <p style="color: #4b5563; margin: 5px 0; font-size: 14px;"><strong>Estado:</strong> Pendiente</p>
          </div>

          <h3 style="color: #374151; border-bottom: 2px solid #fce7f3; padding-bottom: 5px; font-size: 16px;">Resumen de Productos</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            ${listaProductosHTML}
            <tr>
              <td style="padding: 15px 0; color: #374151; font-weight: bold; font-size: 18px; text-align: right;" colspan="2">
                Total Pagado: <span style="color: #db2777;">$${orden.precioTotal.toLocaleString()} MXN</span>
              </td>
            </tr>
          </table>

          <div style="background-color: #f9fafb; padding: 15px 20px; border-radius: 10px; border: 1px solid #e5e7eb; margin: 25px 0;">
            <h3 style="color: #374151; margin-top: 0; font-size: 16px;">Información de Entrega 🚚</h3>
            ${direccionEnvioHTML}
          </div>

          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px; line-height: 1.5;">
            Si tienes alguna duda con tu pedido, puedes responder directamente a este correo.<br>
            © ${new Date().getFullYear()} Mini Noscky. Todos los derechos reservados.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Recibo enviado con éxito a: ${emailDestino}`);

  } catch (error) {
    console.error("Error al enviar el recibo de compra:", error);
  }
};


// --- FUNCIÓN: AVISO DE "LISTO PARA RECOGER" ---
export const enviarCorreoActualizacion = async (emailDestino, nombre, orden) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const mailOptions = {
      from: `"Mini Noscky 🌸" <${process.env.EMAIL_USER}>`,
      to: emailDestino,
      subject: `¡Tu orden #${orden._id.toString().slice(-6).toUpperCase()} está lista! 📦✨`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fce7f3; border-radius: 15px;">
          <h2 style="color: #db2777; text-align: center;">¡Excelentes noticias, ${nombre}!</h2>
          
          <div style="background-color: #fdf2f8; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
            <p style="color: #374151; font-size: 18px; font-weight: bold; margin: 0;">Tu pedido está LISTO PARA RECOGER 🛍️</p>
          </div>
          
          <p style="color: #4b5563; font-size: 16px; text-align: center;">
            Ya hemos separado y preparado tus productos. Puedes pasar al local en nuestro horario de atención para recogerlos.
          </p>
          <p style="color: #4b5563; font-size: 16px; text-align: center; font-weight: bold;">
            No olvides llevar el Código QR que te enviamos en tu recibo de compra para agilizar la entrega.
          </p>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
            Mini Noscky - Joyería y Regalos Inolvidables
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo de actualización (Recoger) enviado a: ${emailDestino}`);
  } catch (error) {
    console.error("Error al enviar correo de actualización:", error);
  }
};


// --- NUEVA FUNCIÓN: AVISO DE "ENVIADO" CON GUÍA DE RASTREO ---
export const enviarCorreoEnvio = async (emailDestino, nombre, orden) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const mailOptions = {
      from: `"Mini Noscky 🌸" <${process.env.EMAIL_USER}>`,
      to: emailDestino,
      subject: `¡Tu pedido #${orden._id.toString().slice(-6).toUpperCase()} va en camino! 🚚✨`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fce7f3; border-radius: 15px;">
          <h2 style="color: #db2777; text-align: center;">¡Excelentes noticias, ${nombre}!</h2>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; border: 1px solid #bbf7d0;">
            <p style="color: #166534; font-size: 18px; font-weight: bold; margin: 0;">Tu paquete ya va en camino 📦🚀</p>
          </div>
          
          <p style="color: #4b5563; font-size: 16px; text-align: center;">
            Hemos entregado tu pedido a la paquetería. Aquí tienes los datos para que puedas seguir su trayecto hasta tu domicilio:
          </p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb; margin: 25px 0;">
            <p style="color: #374151; font-size: 15px; margin: 5px 0;"><strong>Paquetería:</strong> ${orden.paqueteria || 'Asignada'}</p>
            <p style="color: #374151; font-size: 15px; margin: 5px 0;"><strong>Número de Guía:</strong> <span style="color: #db2777; font-weight: bold; font-size: 18px;">${orden.guiaEnvio || 'Pendiente'}</span></p>
            
            ${orden.linkRastreo ? `
            <div style="text-align: center; margin-top: 25px; margin-bottom: 10px;">
              <a href="${orden.linkRastreo}" target="_blank" style="background-color: #db2777; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 15px;">
                Rastrear mi Paquete 📍
              </a>
            </div>
            ` : ''}
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
            Si tienes alguna duda con tu envío, responde directamente a este correo.<br>
            Mini Noscky - Joyería y Regalos Inolvidables
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo de envío con guía mandado a: ${emailDestino}`);
  } catch (error) {
    console.error("Error al enviar correo de envío:", error);
  }
};