const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SHIRT_PRICE_CENTS = 3500;
const SHIPPING_PRICE_CENTS = 500;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { items, cart } = req.body || {};
    const cartItems = Array.isArray(items) ? items : cart;

    if (!Array.isArray(cartItems) || !cartItems.length) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    const lineItems = cartItems.map((item) => {
      const name = String(item.name || "Division 1 Shirt");
      const size = item.size ? ` - ${String(item.size)}` : "";

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${name}${size}`,
          },
          unit_amount: SHIRT_PRICE_CENTS,
        },
        quantity: Math.max(1, Number.parseInt(item.quantity, 10) || 1),
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: SHIPPING_PRICE_CENTS, currency: "usd" },
            display_name: "Standard shipping",
          },
        },
      ],
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
