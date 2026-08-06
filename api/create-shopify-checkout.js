const SHOPIFY_API_VERSION = "2026-07";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!storeDomain || !storefrontToken) {
    res.status(500).json({ error: "Missing Shopify checkout environment variables" });
    return;
  }

  const { items, cart } = req.body || {};
  const checkoutItems = Array.isArray(items) ? items : cart;

  if (!Array.isArray(checkoutItems) || !checkoutItems.length) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  if (checkoutItems.some((item) => !item.size)) {
    res.status(400).json({ error: "Select a size before checkout" });
    return;
  }

  const lines = checkoutItems.map((item) => ({
    merchandiseId: item.shopifyVariantId,
    quantity: Number(item.quantity) || 1,
    attributes: [{ key: "Size", value: item.size }],
  }));

  if (lines.some((line) => !line.merchandiseId)) {
    res.status(400).json({ error: "Missing Shopify variant ID" });
    return;
  }

  const response = await fetch(`https://${storeDomain}/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontToken,
    },
    body: JSON.stringify({
      query: `mutation CartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart { checkoutUrl }
          userErrors { field message }
        }
      }`,
      variables: { input: { lines } },
    }),
  });

  const payload = await response.json();
  const userErrors = payload.data?.cartCreate?.userErrors || [];
  const checkoutUrl = payload.data?.cartCreate?.cart?.checkoutUrl;

  if (!response.ok || userErrors.length || !checkoutUrl) {
    res.status(500).json({ error: userErrors[0]?.message || "Failed to create Shopify checkout" });
    return;
  }

  res.status(200).json({ url: checkoutUrl });
};
