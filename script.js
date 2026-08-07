(function setupShopCart() {
  const page = document.body?.dataset?.page;
  if (page !== "shop") {
    return;
  }

  const STORAGE_KEY = "division1-cart-v2";
  const addButtons = document.querySelectorAll("[data-add-to-cart]");
  const cartCount = document.querySelector("[data-cart-count]");
  const cartItems = document.querySelector("[data-cart-items]");
  const cartTotal = document.querySelector("[data-cart-total]");
  const emptyState = document.querySelector("[data-cart-empty]");
  const cartToast = document.querySelector("[data-cart-toast]");
  const checkoutButton = document.querySelector("[data-checkout-button]");
  const STRIPE_PUBLISHABLE_KEY = "pk_live_51TO7K6CPoNR7hDKvW3UTZYabvAgOZBFedd6Ys2CeK8PNJPOmevIpFqAZmxM4OPK7GpElDqbZB3Icw0OH63dFVGye00vrfYCIfn"; 
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
let elements;

const checkoutModal = document.querySelector("[data-checkout-modal]");
const shippingForm = document.querySelector("[data-shipping-form]");
const paymentSection = document.querySelector("[data-payment-section]");
const payButton = document.querySelector("[data-pay-button]");
const paymentMessage = document.querySelector("[data-payment-message]");
 const checkoutCancel = document.querySelector("[data-checkout-cancel]");

  const stripeAppearance = {
    theme: "flat",
    variables: {
      colorPrimary: "#050505",
      colorBackground: "#f8f8f8",
      colorText: "#050505",
      colorDanger: "#b00000",
      fontFamily: '"IBM Plex Mono", "Courier New", monospace',
      borderRadius: "0px",
      spacingUnit: "4px",
    },
    rules: {
      ".Input": { border: "2px solid #050505", boxShadow: "none" },
      ".Label": { fontWeight: "700", textTransform: "uppercase", fontSize: "12px" },
    },
  };



  if (!addButtons.length || !cartCount || !cartItems || !cartTotal || !emptyState) {
    return;
  }

  let cart = readCart();
  let toastTimeout;

  function readCart() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => ({
        name: String(item.name || "Shirt"),
        price: Number(item.price) || 0,
        quantity: Math.max(1, Number.parseInt(item.quantity, 10) || 1),
        priceId: item.priceId ? String(item.priceId) : null,
        shopifyVariantId: item.shopifyVariantId ? String(item.shopifyVariantId) : null,
        size: item.size ? String(item.size) : "",
      })).filter((item) => item.price > 0 && item.size);
    } catch {
      return [];
    }
  }

  function writeCart(nextCart) {
    cart = nextCart;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    render();
  }

  function showToast(message) {
    if (!cartToast) return;
    cartToast.textContent = message;
    cartToast.classList.add("is-visible");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => cartToast.classList.remove("is-visible"), 1800);
  }

  function getCartItemLabel(item) {
    return `${item.name} / ${item.size}`;
  }

  function addToCart(product) {
    const existing = cart.find((item) => item.name === product.name && item.size === product.size);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    writeCart([...cart]);
    showToast(`${getCartItemLabel(product)} added`);
  }

  function updateCartQuantity(index, change) {
    const existing = cart[index];
    if (!existing) return;
    const nextQuantity = existing.quantity + change;
    writeCart(nextQuantity <= 0 ? cart.filter((_, itemIndex) => itemIndex !== index) : cart.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: nextQuantity } : item));
  }

  function render() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

    cartCount.textContent = String(count);
    cartTotal.textContent = `$${total.toFixed(2)}`;
    emptyState.hidden = count > 0;
    if (checkoutButton) checkoutButton.disabled = count === 0;
    cartItems.replaceChildren();

    cart.forEach((item, index) => {
      const line = document.createElement("li");
      line.className = "cart-item";

      const itemName = document.createElement("span");
      itemName.className = "cart-item-name";
      itemName.textContent = `${getCartItemLabel(item)} × ${item.quantity}`;

      const controls = document.createElement("div");
      controls.className = "cart-item-controls";

      const lineTotal = document.createElement("strong");
      lineTotal.textContent = `$${(item.price * item.quantity).toFixed(2)}`;

      const decreaseButton = document.createElement("button");
      decreaseButton.className = "cart-remove-button";
      decreaseButton.type = "button";
      decreaseButton.textContent = "−";
      decreaseButton.setAttribute("aria-label", `Decrease ${getCartItemLabel(item)} quantity`);
      decreaseButton.addEventListener("click", () => updateCartQuantity(index, -1));

      const increaseButton = document.createElement("button");
      increaseButton.className = "cart-remove-button";
      increaseButton.type = "button";
      increaseButton.textContent = "+";
      increaseButton.setAttribute("aria-label", `Increase ${getCartItemLabel(item)} quantity`);
      increaseButton.addEventListener("click", () => updateCartQuantity(index, 1));

      controls.append(lineTotal, decreaseButton, increaseButton);
      line.append(itemName, controls);
      cartItems.appendChild(line);
    });
  }

 async function startCheckout() {
  if (!cart.length) {
    showToast("Add a shirt and size first");
    return;
  }
  if (cart.some((item) => !item.size)) {
    showToast("Every item needs a size before checkout");
    return;
  }
  checkoutModal.hidden = false;
}

shippingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const shippingAddress = {
    name: document.querySelector("[data-ship-name]").value,
    line1: document.querySelector("[data-ship-line1]").value,
    city: document.querySelector("[data-ship-city]").value,
    state: document.querySelector("[data-ship-state]").value,
    postal_code: document.querySelector("[data-ship-zip]").value,
    country: "US",
  };

  try {
    const response = await fetch("https://div1-backend.vercel.app/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart, shippingAddress }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not start payment.");

    elements = stripe.elements({ clientSecret: data.clientSecret, appearance: stripeAppearance });
    const paymentElement = elements.create("payment");
    paymentElement.mount("#payment-element");

    shippingForm.hidden = true;
    paymentSection.hidden = false;
  } catch (error) {
    console.error(error);
    showToast("Could not start checkout.");
  }
});

payButton?.addEventListener("click", async () => {
  payButton.disabled = true;
  payButton.textContent = "Processing...";

  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: "https://www.div1.online/success.html",
    },
  });

  checkoutCancel?.addEventListener("click", () => {
  checkoutModal.hidden = true;
  shippingForm.hidden = false;
  paymentSection.hidden = true;
  shippingForm.reset();
  paymentMessage.textContent = "";
  if (payButton) {
    payButton.disabled = false;
    payButton.textContent = "Pay now";
  }
});


  if (error) {
    paymentMessage.textContent = error.message;
    payButton.disabled = false;
    payButton.textContent = "Pay now";
  }
  // on success, Stripe redirects to return_url automatically
});


  addButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const productCard = button.closest("[data-product-card]");
      const sizeSelector = productCard?.querySelector("[data-size-selector]");
      const size = sizeSelector?.value || "";

      if (!size) {
        showToast("Select a size first");
        sizeSelector?.focus();
        return;
      }

      addToCart({
        name: button.dataset.name || "Shirt",
        price: Number(button.dataset.price || 0),
        priceId: button.dataset.priceId || "",
        shopifyVariantId: sizeSelector.selectedOptions[0]?.dataset.shopifyVariantId || button.dataset.shopifyVariantId || "",
        size,
      });

      button.textContent = "Added";
      window.setTimeout(() => { button.textContent = "Add to cart"; }, 800);
    });
  });

  checkoutButton?.addEventListener("click", startCheckout);
  render();
})();
