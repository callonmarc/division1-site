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

  function addToCart(name, price) {
    const existing = cart.find((item) => item.name === name);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ name, price, quantity: 1 });
    }
    writeCart([...cart]);
  }

  function removeFromCart(name) {
    const existing = cart.find((item) => item.name === name);
    if (!existing) return;

    if (existing.quantity > 1) {
      existing.quantity -= 1;
      writeCart([...cart]);
      return;
    }

    writeCart(cart.filter((item) => item.name !== name));
  }

  function render() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

    cartCount.textContent = String(count);
    cartTotal.textContent = `$${total.toFixed(2)}`;
    emptyState.hidden = count > 0;
    cartItems.innerHTML = "";

    cart.forEach((item) => {
      const line = document.createElement("li");
      line.className = "cart-item";
      line.innerHTML = `
        <span class="cart-item-name">${item.name} × ${item.quantity}</span>
        <div class="cart-item-controls">
          <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
          <button class="cart-remove-button" type="button" data-remove-from-cart="${item.name}" aria-label="Remove one ${item.name} from cart">Remove</button>
        </div>
      `;
      cartItems.appendChild(line);
    });

    const removeButtons = cartItems.querySelectorAll("[data-remove-from-cart]");
    removeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const name = button.getAttribute("data-remove-from-cart");
        if (!name) return;
        removeFromCart(name);
      });
    });
  }

  addButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.dataset.name || "Shirt";
      const price = Number(button.dataset.price || 0);
      addToCart(name, price);
      button.textContent = "Added";
      window.setTimeout(() => {
        button.textContent = "Add to cart";
      }, 800);
    });
  });

  render();
})();
