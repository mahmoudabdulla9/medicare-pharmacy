// Storefront: products and orders live in Firestore, the cart stays in this browser.
import { PLACEHOLDER_IMAGE, deliveryFee, money, escapeHtml, safeImage } from "./data.js";
import { SHOW_DEMO_NOTICE } from "./firebase-config.js";
import { isConfigured, db, auth, fs, au } from "./firebase.js";

const $ = (selector) => document.querySelector(selector);

let products = [];
let productsLoaded = false;
let cart = readCart();
let activeCategory = "All";
let toastTimer;
let lastFocus = null;

// Data from the earlier browser-only version is no longer used.
["medicare_products", "medicare_orders", "medicare_messages", "medicare_catalogue_version"].forEach((key) => {
  try { localStorage.removeItem(key); } catch { /* storage blocked */ }
});

/* ---------- Cart (saved in this browser) ---------- */

function readCart() {
  try {
    const value = JSON.parse(localStorage.getItem("medicare_cart"));
    return Array.isArray(value) ? value.filter((i) => i && typeof i.id === "string" && i.quantity > 0) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  try { localStorage.setItem("medicare_cart", JSON.stringify(cart)); } catch { /* storage blocked */ }
  renderCart();
}

// Keeps the cart valid when products were hidden or their stock changed.
function reconcileCart() {
  if (!productsLoaded) return false;
  let changed = false;
  cart = cart.filter((item) => {
    const p = products.find((x) => x.id === item.id);
    if (!p || p.stock < 1) { changed = true; return false; }
    if (item.quantity > p.stock) { item.quantity = p.stock; changed = true; }
    return true;
  });
  if (changed) saveCart();
  return changed;
}

function cartDetails() {
  return cart
    .map((item) => {
      const p = products.find((x) => x.id === item.id);
      return p ? { ...p, quantity: item.quantity } : null;
    })
    .filter(Boolean);
}

function addToCart(id, qty) {
  const p = products.find((x) => x.id === id);
  if (!p || p.stock < 1) { toast("This product is not available.", true); return false; }
  const item = cart.find((x) => x.id === id);
  const have = item ? item.quantity : 0;
  if (have >= p.stock) { toast(`You already have all ${p.stock} in your cart.`, true); return false; }
  const next = Math.min(p.stock, have + qty);
  if (item) item.quantity = next;
  else cart.push({ id, quantity: next });
  saveCart();
  toast(`${p.name} added to cart`);
  return true;
}

/* ---------- Rendering ---------- */

function toast(message, isError) {
  const t = $("#toast");
  t.textContent = message;
  t.className = "toast show" + (isError ? " error" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

const stockText = (p) =>
  p.stock < 1 ? `<span class="stock out">Out of stock</span>`
  : p.stock <= 5 ? `<span class="stock low">Only ${p.stock} left</span>`
  : `<span class="stock">${p.stock} in stock</span>`;

function loadProducts() {
  if (!productsLoaded) return;
  const q = $("#searchInput").value.trim().toLowerCase();
  const sort = $("#sortSelect").value;
  const list = products.filter((p) =>
    (activeCategory === "All" || p.category === activeCategory)
    && (!$("#stockOnly").checked || p.stock > 0)
    && `${p.name} ${p.category} ${p.description || ""}`.toLowerCase().includes(q));
  if (sort === "price-low") list.sort((a, b) => a.price - b.price);
  else if (sort === "price-high") list.sort((a, b) => b.price - a.price);
  else if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  else list.sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
  renderProducts(list);
}

function renderProducts(list) {
  $("#productGrid").innerHTML = list.map((p) => `
    <article class="product-card">
      <div class="product-image" data-view="${escapeHtml(p.id)}">
        <img src="${escapeHtml(safeImage(p.image))}" alt="${escapeHtml(p.name)}" loading="lazy">
        <span class="product-tag">${p.stock > 0 ? (p.featured ? "POPULAR" : escapeHtml(p.category)) : "OUT OF STOCK"}</span>
      </div>
      <div class="product-info">
        <span class="product-category">${escapeHtml(p.category)}</span>
        <h3><button class="name-btn" type="button" data-view="${escapeHtml(p.id)}">${escapeHtml(p.name)}</button></h3>
        <p>${escapeHtml(p.description)}</p>
        ${stockText(p)}
        <div class="product-bottom">
          <span class="product-price">${money(p.price)}</span>
          <button class="add-btn" aria-label="Add ${escapeHtml(p.name)} to cart" data-add="${escapeHtml(p.id)}" ${p.stock < 1 ? "disabled" : ""}>${p.stock < 1 ? "Unavailable" : "＋ Add"}</button>
        </div>
      </div>
    </article>`).join("");
  $("#emptyState").classList.toggle("hidden", list.length > 0);
}

function showProductsMessage(message) {
  $("#productGrid").innerHTML = `<div class="empty"><p>${escapeHtml(message)}</p></div>`;
  $("#emptyState").classList.add("hidden");
}

function renderCart() {
  const d = cartDetails();
  const count = d.reduce((s, p) => s + p.quantity, 0);
  const sub = d.reduce((s, p) => s + p.price * p.quantity, 0);
  const fee = deliveryFee(sub);
  $("#cartCount").textContent = count;
  $("#cartSubtotal").textContent = $("#checkoutSubtotal").textContent = money(sub);
  $("#cartDelivery").textContent = $("#checkoutDelivery").textContent = d.length && !fee ? "Free" : money(fee);
  $("#cartTotal").textContent = $("#checkoutTotal").textContent = money(sub + fee);
  $("#cartItems").innerHTML = d.length
    ? d.map((p) => `
      <div class="cart-row">
        <img class="cart-thumb" src="${escapeHtml(safeImage(p.image))}" alt="">
        <div><strong>${escapeHtml(p.name)}</strong><small>${money(p.price)} each · ${money(p.price * p.quantity)}</small></div>
        <div class="qty-controls">
          <button data-qty="${escapeHtml(p.id)}" data-delta="-1" aria-label="Decrease quantity of ${escapeHtml(p.name)}">−</button>
          <span>${p.quantity}</span>
          <button data-qty="${escapeHtml(p.id)}" data-delta="1" aria-label="Increase quantity of ${escapeHtml(p.name)}" ${p.quantity >= p.stock ? "disabled" : ""}>＋</button>
          <button data-remove="${escapeHtml(p.id)}" aria-label="Remove ${escapeHtml(p.name)}">×</button>
        </div>
      </div>`).join("")
    : '<div class="empty"><p>Your cart is empty.</p><button class="outline-btn" type="button" data-shop>Browse products</button></div>';
  $("#checkoutBtn").disabled = !d.length;
  $("#checkoutBtn").style.opacity = d.length ? 1 : 0.5;
}

/* ---------- Modals and cart drawer ---------- */

function openCart() {
  if (reconcileCart()) toast("Your cart was updated to match current stock.", true);
  renderCart();
  $("#overlay").classList.remove("hidden");
  $("#cartDrawer").classList.add("open");
}

function closeCart() {
  $("#overlay").classList.add("hidden");
  $("#cartDrawer").classList.remove("open");
}

function openModal(id) {
  closeCart();
  document.querySelectorAll(".modal").forEach((m) => m.classList.add("hidden"));
  lastFocus = document.activeElement;
  $("#overlay").classList.remove("hidden");
  const m = $("#" + id);
  m.classList.remove("hidden");
  m.scrollTop = 0;
  const first = m.querySelector("input:not([disabled]),button");
  if (first) first.focus();
}

function closeModals() {
  const open = [...document.querySelectorAll(".modal")].some((m) => !m.classList.contains("hidden"));
  document.querySelectorAll(".modal").forEach((m) => m.classList.add("hidden"));
  $("#overlay").classList.add("hidden");
  if (open && lastFocus && lastFocus.isConnected) lastFocus.focus();
}

function openProduct(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  const out = p.stock < 1;
  $("#productDetails").innerHTML = `
    <div class="details-grid">
      <div class="details-image"><img src="${escapeHtml(safeImage(p.image))}" alt="${escapeHtml(p.name)}"></div>
      <div>
        <span class="product-category">${escapeHtml(p.category)}</span>
        <h2>${escapeHtml(p.name)}</h2>
        <strong class="details-price">${money(p.price)}</strong>
        <p>${escapeHtml(p.description || "No description yet.")}</p>
        ${stockText(p)}
        <form class="details-buy" id="detailsForm" data-id="${escapeHtml(p.id)}">
          <label>Quantity<input name="qty" type="number" min="1" max="${Math.max(1, p.stock)}" step="1" value="1" required ${out ? "disabled" : ""}></label>
          <button class="primary-btn" ${out ? "disabled" : ""}>${out ? "Out of stock" : "Add to cart"}</button>
        </form>
        <p class="demo-note">Always read the label, and ask a pharmacist if you are unsure about a product.</p>
      </div>
    </div>`;
  openModal("productModal");
}

/* ---------- Firebase ---------- */

let anonymousSignIn = null;
async function currentUser() {
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  if (!anonymousSignIn) {
    anonymousSignIn = au.signInAnonymously(auth).then((c) => c.user).finally(() => { anonymousSignIn = null; });
  }
  return anonymousSignIn;
}

function watchProducts() {
  const visible = fs.query(fs.collection(db, "products"), fs.where("active", "==", true));
  fs.onSnapshot(visible, (snap) => {
    products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    productsLoaded = true;
    reconcileCart();
    if (!products.length) showProductsMessage("No products are available right now. Please check back soon.");
    else loadProducts();
    renderCart();
  }, (err) => {
    console.error("Products could not be loaded", err);
    showProductsMessage("Products could not be loaded. Check your connection and refresh the page.");
  });
}

const orderNumber = (id) => id.slice(0, 8).toUpperCase();
const orderDate = (o) => (o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleString("en-GB") : "Just now");

async function showOrders() {
  $("#myOrders").innerHTML = '<p class="empty">Loading your orders...</p>';
  openModal("ordersModal");
  try {
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) {
      $("#myOrders").innerHTML = '<p class="empty">No orders yet. Orders you place on this device appear here.</p>';
      return;
    }
    const snap = await fs.getDocs(fs.query(fs.collection(db, "orders"), fs.where("uid", "==", user.uid)));
    const orders = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    $("#myOrders").innerHTML = orders.length
      ? orders.map((o) => `
        <article class="order-card">
          <div class="order-top"><strong>Order #${orderNumber(o.id)}</strong><span class="status-pill">${escapeHtml(o.status)}</span></div>
          <p>${escapeHtml(orderDate(o))}</p>
          <ul>${o.items.map((i) => `<li>${escapeHtml(i.name)} &times; ${Number(i.quantity)} (${money(i.price * i.quantity)})</li>`).join("")}</ul>
          <strong>${money(o.total)}</strong> <small>including ${money(o.deliveryFee)} delivery</small>
        </article>`).join("")
      : '<p class="empty">No orders yet. Orders you place on this device appear here.</p>';
  } catch (err) {
    console.error("Orders could not be loaded", err);
    $("#myOrders").innerHTML = '<p class="empty">Your orders could not be loaded. Please try again.</p>';
  }
}

async function placeOrder(form) {
  const feedback = $("#checkoutFeedback");
  const button = form.querySelector('button[type="submit"]');
  feedback.textContent = "";
  if (reconcileCart()) {
    feedback.textContent = "Stock changed, so your cart was updated. Check the total and place the order again.";
    return;
  }
  const details = cartDetails();
  if (!details.length) return;
  const subtotal = details.reduce((s, p) => s + p.price * p.quantity, 0);
  const fee = deliveryFee(subtotal);
  const f = new FormData(form);
  button.disabled = true;
  button.textContent = "Placing order...";
  try {
    const user = await currentUser();
    const ref = await fs.addDoc(fs.collection(db, "orders"), {
      uid: user.uid,
      customer: {
        name: String(f.get("name")).trim(),
        email: String(f.get("email")).trim(),
        phone: String(f.get("phone")).trim(),
        address: String(f.get("address")).trim(),
        notes: String(f.get("notes") || "").trim()
      },
      items: details.map((p) => ({ productId: p.id, name: p.name, price: p.price, quantity: p.quantity })),
      subtotal,
      deliveryFee: fee,
      total: subtotal + fee,
      status: "Pending",
      stockDeducted: false,
      createdAt: fs.serverTimestamp()
    });
    const phone = String(f.get("phone")).trim();
    cart = [];
    saveCart();
    form.reset();
    $("#successMessage").textContent = `Your order number is ${orderNumber(ref.id)}. Total: ${money(subtotal + fee)}, paid in cash on delivery. We will call you on ${phone} to confirm it.`;
    openModal("successModal");
  } catch (err) {
    console.error("Order could not be placed", err);
    feedback.textContent = "We could not place your order. Check your connection and try again.";
  } finally {
    button.disabled = false;
    button.textContent = "Place order";
  }
}

async function sendMessage(form) {
  const feedback = $("#contactFeedback");
  const button = form.querySelector("button");
  button.disabled = true;
  feedback.textContent = "Sending...";
  try {
    await fs.addDoc(fs.collection(db, "messages"), {
      name: $("#contactName").value.trim(),
      email: $("#contactEmail").value.trim(),
      message: $("#contactMessage").value.trim(),
      createdAt: fs.serverTimestamp()
    });
    feedback.textContent = "Thanks! Your message was sent. We will reply by email.";
    form.reset();
  } catch (err) {
    console.error("Message could not be sent", err);
    feedback.textContent = "Your message could not be sent. Please try again.";
  } finally {
    button.disabled = false;
  }
}

/* ---------- Events ---------- */

$("#productGrid").addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  if (add) { addToCart(add.dataset.add, 1); return; }
  const view = e.target.closest("[data-view]");
  if (view) openProduct(view.dataset.view);
});

$("#productDetails").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target.closest("#detailsForm");
  if (addToCart(f.dataset.id, Math.max(1, Math.floor(Number(f.elements.qty.value) || 1)))) closeModals();
});

$("#cartItems").addEventListener("click", (e) => {
  const q = e.target.closest("[data-qty]");
  const r = e.target.closest("[data-remove]");
  if (r) cart = cart.filter((x) => x.id !== r.dataset.remove);
  if (q) {
    const item = cart.find((x) => x.id === q.dataset.qty);
    const p = products.find((x) => x.id === q.dataset.qty);
    if (item) {
      item.quantity = Math.min(p ? p.stock : item.quantity, item.quantity + Number(q.dataset.delta));
      if (item.quantity < 1) cart = cart.filter((x) => x !== item);
    }
  }
  saveCart();
});

$("#filters").addEventListener("click", (e) => {
  const b = e.target.closest("[data-category]");
  if (!b) return;
  activeCategory = b.dataset.category;
  document.querySelectorAll(".filter").forEach((x) => x.classList.toggle("active", x === b));
  loadProducts();
});

let searchTimer;
$("#searchInput").addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadProducts, 200); });
$("#sortSelect").addEventListener("change", loadProducts);
$("#stockOnly").addEventListener("change", loadProducts);
$("#clearFilters").addEventListener("click", () => {
  $("#searchInput").value = "";
  $("#stockOnly").checked = false;
  activeCategory = "All";
  document.querySelectorAll(".filter").forEach((x) => x.classList.toggle("active", x.dataset.category === "All"));
  loadProducts();
});

$("#openCart").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
$("#overlay").addEventListener("click", () => { closeModals(); closeCart(); });
$("#checkoutBtn").addEventListener("click", () => { $("#checkoutFeedback").textContent = ""; openModal("checkoutModal"); });
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) closeModals();
  if (e.target.closest("[data-orders]")) { e.preventDefault(); if (isConfigured) showOrders(); }
  if (e.target.closest("[data-shop]")) { closeCart(); $("#products").scrollIntoView(); }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModals(); closeCart(); } });

$("#checkoutForm").addEventListener("submit", (e) => { e.preventDefault(); placeOrder(e.currentTarget); });
$("#contactForm").addEventListener("submit", (e) => { e.preventDefault(); sendMessage(e.currentTarget); });

$("#menuToggle").addEventListener("click", () =>
  $("#menuToggle").setAttribute("aria-expanded", String($("#mainNav").classList.toggle("open"))));
$("#mainNav").addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    $("#mainNav").classList.remove("open");
    $("#menuToggle").setAttribute("aria-expanded", "false");
  }
});

window.addEventListener("storage", (e) => { if (e.key === "medicare_cart") { cart = readCart(); renderCart(); } });

/* ---------- Start ---------- */

$("#year").textContent = new Date().getFullYear();
if (SHOW_DEMO_NOTICE) $("#demoNotice").classList.remove("hidden");
renderCart();
if (isConfigured) {
  watchProducts();
} else {
  showProductsMessage("The store is not connected to its database yet.");
  $("#checkoutForm").querySelector('button[type="submit"]').disabled = true;
  $("#contactForm").querySelector("button").disabled = true;
}
