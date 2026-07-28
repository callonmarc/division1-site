(function setupBackgroundVideo() {
  const VIDEO_SRC = "videos/bg-vid.mp4";
  const STORAGE_KEY = "division1-background-video-time";

  if (!document.body) {
    return;
  }

  const background = document.createElement("div");
  background.className = "background-video-layer";
  background.setAttribute("aria-hidden", "true");

  const video = document.createElement("video");
  video.className = "background-video";
  video.src = VIDEO_SRC;
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("preload", "auto");

  const overlay = document.createElement("div");
  overlay.className = "background-video-overlay";

  background.append(video, overlay);
  document.body.prepend(background);

  function getSavedTime() {
    const rawTime = window.sessionStorage.getItem(STORAGE_KEY);
    const savedTime = Number(rawTime);
    return Number.isFinite(savedTime) && savedTime > 0 ? savedTime : 0;
  }

  function restoreTime() {
    const savedTime = getSavedTime();
    if (!savedTime || !Number.isFinite(video.duration)) {
      return;
    }

    video.currentTime = savedTime % video.duration;
  }

  function saveTime() {
    if (!Number.isFinite(video.currentTime)) {
      return;
    }

    window.sessionStorage.setItem(STORAGE_KEY, String(video.currentTime));
  }

  video.addEventListener("loadedmetadata", restoreTime, { once: true });
  video.addEventListener("timeupdate", saveTime);
  window.addEventListener("pagehide", saveTime);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      saveTime();
    }
  });

  video.play().catch(() => {
    // Browsers may defer autoplay until enough data is available; the video remains non-blocking.
  });
})();

// Background scene is handled with CSS layers in style.css.

(function setupShopCart() {
  const page = document.body?.dataset?.page;
  if (page !== "shop") {
    return;
  }

  const STORAGE_KEY = "division1-cart-v1";
  const SHIPPING_COST = 5;
  const SHIRT_PRICE = 35;
  const addButtons = document.querySelectorAll("[data-add-to-cart]");
  const cartCount = document.querySelector("[data-cart-count]");
  const cartItems = document.querySelector("[data-cart-items]");
  const cartSubtotal = document.querySelector("[data-cart-subtotal]");
  const cartShipping = document.querySelector("[data-cart-shipping]");
  const cartTotal = document.querySelector("[data-cart-total]");
  const emptyState = document.querySelector("[data-cart-empty]");
  const cartToast = document.querySelector("[data-cart-toast]");
  const checkoutButton = document.querySelector("[data-checkout-button]");

  if (!addButtons.length || !cartCount || !cartItems || !cartSubtotal || !cartShipping || !cartTotal || !emptyState) {
    return;
  }

  let cart = readCart();

  function readCart() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => ({
          name: String(item.name || "Shirt"),
          price: SHIRT_PRICE,
          quantity: Math.max(1, Number.parseInt(item.quantity, 10) || 1),
          priceId: item.priceId ? String(item.priceId) : null,
          size: item.size ? String(item.size) : "",
        }))
        .filter((item) => item.price > 0);
    } catch {
      return [];
    }
  }

  function writeCart(nextCart) {
    cart = nextCart;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    render();
  }

  let toastTimeout;

  function showToast(message) {
    if (!cartToast) return;
    cartToast.textContent = message;
    cartToast.classList.add("is-visible");

    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
      cartToast.classList.remove("is-visible");
    }, 1800);
  }

  function getCartItemLabel(item) {
    return item.size ? `${item.name} (${item.size})` : item.name;
  }

  function addToCart(name, price, priceId, size) {
    const itemPrice = Number(price) || SHIRT_PRICE;
    const existing = cart.find((item) => item.name === name && item.size === size);
    if (existing) {
      existing.quantity += 1;
      if (priceId) existing.priceId = priceId;
    } else {
      cart.push({ name, price: itemPrice, quantity: 1, priceId: priceId || null, size });
    }
    writeCart([...cart]);
    showToast(`${name} (${size}) added to cart`);
  }

  function updateCartQuantity(index, change) {
    const existing = cart[index];
    if (!existing) return;

    const nextQuantity = existing.quantity + change;
    if (nextQuantity <= 0) {
      writeCart(cart.filter((_, itemIndex) => itemIndex !== index));
      return;
    }

    existing.quantity = nextQuantity;
    writeCart([...cart]);
  }

  function removeFromCart(index) {
    writeCart(cart.filter((_, itemIndex) => itemIndex !== index));
  }

  function render() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const shipping = count > 0 ? SHIPPING_COST : 0;
    const total = subtotal + shipping;

    cartCount.textContent = String(count);
    cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    cartShipping.textContent = count > 0 ? `$${shipping.toFixed(2)}` : "$0.00";
    cartTotal.textContent = `$${total.toFixed(2)}`;
    emptyState.hidden = count > 0;
    if (checkoutButton) {
      checkoutButton.disabled = count === 0;
    }
    cartItems.replaceChildren();

    cart.forEach((item, index) => {
      const line = document.createElement("li");
      line.className = "cart-item";

      const itemDetails = document.createElement("div");
      itemDetails.className = "cart-item-details";

      const itemName = document.createElement("span");
      itemName.className = "cart-item-name";
      itemName.textContent = getCartItemLabel(item);

      const itemMeta = document.createElement("span");
      itemMeta.className = "cart-item-meta";
      itemMeta.textContent = `$${item.price.toFixed(2)} each`;

      itemDetails.append(itemName, itemMeta);

      const controls = document.createElement("div");
      controls.className = "cart-item-controls";

      const lineTotal = document.createElement("strong");
      lineTotal.className = "cart-line-total";
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

      const quantity = document.createElement("span");
      quantity.className = "cart-quantity";
      quantity.textContent = String(item.quantity);

      const removeButton = document.createElement("button");
      removeButton.className = "cart-remove-button cart-remove-button-wide";
      removeButton.type = "button";
      removeButton.textContent = "Remove";
      removeButton.setAttribute("aria-label", `Remove ${getCartItemLabel(item)} from cart`);
      removeButton.addEventListener("click", () => removeFromCart(index));

      controls.append(lineTotal, decreaseButton, quantity, increaseButton, removeButton);
      line.append(itemDetails, controls);
      cartItems.appendChild(line);
    });
  }


async function startCheckout() {
  if (!cart.length) {
    showToast("Your cart is empty");
    return;
  }

  if (checkoutButton) {
    checkoutButton.disabled = true;
    checkoutButton.textContent = "Redirecting...";
  }

  try {
    const response = await fetch(
      "https://div1-backend.vercel.app/api/create-checkout-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: cart }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Checkout failed.");
    }

    window.location.href = data.url;
  } catch (error) {
    console.error(error);
    showToast("Checkout failed. Please try again.");

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
        showToast("Select a size before adding to cart");
        sizeSelector?.focus();
        return;
      }

      const name = button.dataset.name || "Shirt";
      const price = Number(button.dataset.price || 0);
      const priceId = button.dataset.priceId || "";
      addToCart(name, price, priceId, size);
      button.textContent = "Added";
      window.setTimeout(() => {
        button.textContent = "Add to cart";
      }, 800);
    });
  });

  if (checkoutButton) {
    checkoutButton.addEventListener("click", startCheckout);
  }

  render();
})();
