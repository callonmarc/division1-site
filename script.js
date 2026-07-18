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

  function readCart() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
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
    const existing = cart.find((item) => item.name === name && item.size === size);
    if (existing) {
      existing.quantity += 1;
      if (priceId) existing.priceId = priceId;
    } else {
      cart.push({ name, price, quantity: 1, priceId: priceId || null, size });
    }
    writeCart([...cart]);
    showToast(`${name} (${size}) added to cart`);
  }

  function removeFromCart(index) {
    const existing = cart[index];
    if (!existing) return;

    if (existing.quantity > 1) {
      existing.quantity -= 1;
      writeCart([...cart]);
      return;
    }

    writeCart(cart.filter((_, itemIndex) => itemIndex !== index));
  }

  function render() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

    cartCount.textContent = String(count);
    cartTotal.textContent = `$${total.toFixed(2)}`;
    emptyState.hidden = count > 0;
    cartItems.innerHTML = "";

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

      const removeButton = document.createElement("button");
      removeButton.className = "cart-remove-button";
      removeButton.type = "button";
      removeButton.textContent = "Remove";
      removeButton.setAttribute("aria-label", `Remove one ${getCartItemLabel(item)} from cart`);
      removeButton.addEventListener("click", () => removeFromCart(index));

      controls.append(lineTotal, removeButton);
      line.append(itemName, controls);
      cartItems.appendChild(line);
    });
  }


  function startCheckout() {
    if (!cart.length) {
      showToast("Your cart is empty");
      return;
    }

    if (checkoutButton) {
      checkoutButton.disabled = true;
      checkoutButton.textContent = "Redirecting...";
    }

    window.location.href = "https://buy.stripe.com/fZu6oGdN17QwgXd3pK6Ri01";
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
