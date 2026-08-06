const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SHIPPING_RATE_ID = process.env.STRIPE_SHIPPING_RATE_ID;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { items, cart } = req.body || {};
    const checkoutItems = Array.isArray(items) ? items : cart;

    if (!Array.isArray(checkoutItems) || !checkoutItems.length) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    const lineItems = checkoutItems.map((item) => ({
      price: item.priceId,
      quantity: Number(item.quantity) || 1,
      adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
    }));

    if (checkoutItems.some((item) => !item.size)) {
      res.status(400).json({ error: "Select a size before checkout" });
      return;
    }

    if (lineItems.some((item) => !item.price)) {
      res.status(400).json({ error: "Missing Stripe price ID" });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ["US"] },
      shipping_options: SHIPPING_RATE_ID ? [{ shipping_rate: SHIPPING_RATE_ID }] : [],
      phone_number_collection: { enabled: true },
      success_url: `${req.headers.origin}/shop.html?checkout=success`,
      cancel_url: `${req.headers.origin}/shop.html?checkout=cancelled`,
      automatic_tax: { enabled: true },
      metadata: {
        sizes: checkoutItems.map((item) => `${item.name}: ${item.size} x${Number(item.quantity) || 1}`).join(" | "),
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};
