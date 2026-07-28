const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SHIPPING_RATE_ID = process.env.STRIPE_SHIPPING_RATE_ID;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { items } = req.body || {};

    if (!Array.isArray(items) || !items.length) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    const lineItems = items.map((item) => ({
      price: item.priceId,
      quantity: Number(item.quantity) || 1,
    }));

    if (lineItems.some((item) => !item.price)) {
      res.status(400).json({ error: "Missing Stripe price ID" });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_options: SHIPPING_RATE_ID ? [{ shipping_rate: SHIPPING_RATE_ID }] : [],
      success_url: `${req.headers.origin}/shop.html?checkout=success`,
      cancel_url: `${req.headers.origin}/shop.html?checkout=cancelled`,
      automatic_tax: { enabled: true },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};
