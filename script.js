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

    if (checkoutButton) {
      checkoutButton.disabled = true;
      checkoutButton.textContent = "Opening checkout...";
    }

    try {
      const response = await fetch("https://div1-backend.vercel.app/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, cart }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Checkout failed.");
      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      showToast("Checkout failed. Check backend shipping setup.");
      if (checkoutButton) {
        checkoutButton.disabled = false;
        checkoutButton.textContent = "Checkout Cart";
      }
    }
  }

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
