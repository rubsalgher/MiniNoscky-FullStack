// controllers/paymentController.js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const crearIntentoPago = async (req, res) => {
  const { monto, items } = req.body;

  try {
    // Creamos un "PaymentIntent" con el monto y la moneda
    const paymentIntent = await stripe.paymentIntents.create({
      amount: monto * 100, // Stripe usa centavos (ej: $100.00 = 10000)
      currency: 'mxn',
      automatic_payment_methods: { enabled: true },
      // Opcional: puedes guardar info extra como los IDs de los productos
      metadata: { integration_check: 'accept_a_payment' },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error en Stripe:', error);
    res.status(500).json({ error: 'No se pudo crear el intento de pago' });
  }
};