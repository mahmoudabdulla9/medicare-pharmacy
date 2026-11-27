// Admin dashboard. Access is enforced by Firebase Authentication and the Firestore rules,
// so hiding or editing this page in the browser does not give anyone access to the data.
import { SEED_PRODUCTS, CATEGORIES, deliveryFee, money, escapeHtml as esc, safeImage } from "./data.js";
import { isConfigured, db, auth, fs, au } from "./firebase.js";

const $ = (selector) => document.querySelector(selector);
const STATUSES = ["Pending", "Confirmed", "Preparing", "Out for delivery", "Completed", "Cancelled"];
const holdsStock = (status) => ["Confirmed", "Preparing", "Out for delivery", "Completed"].includes(status);

let products = [];
let orders = [];
let messages = [];
let unsubscribers = [];
let toastTimer;

/* ---------- Helpers ---------- */

function toast(message, isError) {
  const t = $("#toast");
  t.textContent = message;
  t.className = "toast show" + (isError ? " error" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}

function openModal(id) { $("#overlay").classList.remove("hidden"); $("#" + id).classList.remove("hidden"); }
function closeModals() { $("#overlay").classList.add("hidden"); document.querySelectorAll(".modal").forEach((m) => m.classList.add("hidden")); }

function show(view) {
  $("#checkingPanel").classList.toggle("hidden", view !== "checking");
  $("#loginPanel").classList.toggle("hidden", view !== "login");
  $("#dashboard").classList.toggle("hidden", view !== "dashboard");
}

const shortId = (id) => id.slice(0, 8).toUpperCase();
const when = (ts) => (ts && ts.toDate ? ts.toDate().toLocaleString("en-GB") : "Just now");

/* ---------- Sign in ---------- */

function loginError(err) {
  const code = err && err.code;
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found" || code === "auth/invalid-email") return "Wrong email or password.";
  if (code === "auth/too-many-requests") return "Too many attempts. Wait a few minutes and try again.";
  if (code === "auth/network-request-failed") return "No connection. Check your internet and try again.";
  return "Sign in failed. Please try again.";
}

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const button = form.querySelector("button");
  $("#loginFeedback").textContent = "";
  button.disabled = true;
  button.textContent = "Signing in...";
  try {
    await au.signInWithEmailAndPassword(auth, form.elements.email.value.trim(), form.elements.password.value);
    form.reset();
  } catch (err) {
    $("#loginFeedback").textContent = loginError(err);
  } finally {
    button.disabled = false;
    button.textContent = "Sign in";
  }
});

$("#logoutBtn").addEventListener("click", () => au.signOut(auth));

function stopWatching() {
  unsubscribers.forEach((stop) => stop());
  unsubscribers = [];
}

function startWatching() {
  const onError = (what) => (err) => { console.error(what, err); toast(`${what} could not be loaded.`, true); };
  unsubscribers.push(fs.onSnapshot(fs.collection(db, "products"), (snap) => {
    products = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name));
    renderStats(); renderProducts(); renderOrders();
  }, onError("Products")));
  unsubscribers.push(fs.onSnapshot(fs.query(fs.collection(db, "orders"), fs.orderBy("createdAt", "desc")), (snap) => {
    orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderStats(); renderOrders();
  }, onError("Orders")));
  unsubscribers.push(fs.onSnapshot(fs.query(fs.collection(db, "messages"), fs.orderBy("createdAt", "desc")), (snap) => {
    messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderMessages();
  }, onError("Messages")));
}

if (!isConfigured) {
  show("login");
  $("#loginFeedback").textContent = "The admin panel is not connected to Firebase yet. Add the project settings to js/firebase-config.js.";
  $("#loginForm").querySelector("button").disabled = true;
} else {
  au.onAuthStateChanged(auth, async (user) => {
    stopWatching();
    if (!user || user.isAnonymous) { show("login"); return; }
    show("checking");
    try {
      const admin = await fs.getDoc(fs.doc(db, "admins", user.uid));
      if (!admin.exists()) {
        await au.signOut(auth);
        $("#loginFeedback").textContent = "This account does not have admin access.";
        return;
      }
    } catch (err) {
      console.error("Admin check failed", err);
      await au.signOut(auth);
      $("#loginFeedback").textContent = "Your access could not be checked. Please try again.";
      return;
    }
    $("#adminWelcome").textContent = `Signed in as ${user.email}`;
    show("dashboard");
    startWatching();
  });
}

/* ---------- Stats ---------- */

function renderStats() {
  const value = orders.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + Number(o.total || 0), 0);
  const stats = [
    ["Visible products", products.filter((p) => p.active).length],
    ["All orders", orders.length],
    ["Pending orders", orders.filter((o) => o.status === "Pending").length],
    ["Low or no stock", products.filter((p) => p.active && p.stock <= 5).length],
    ["Order value", money(value)]
  ];
  $("#statsGrid").innerHTML = stats.map(([label, n]) => `<div class="stat-card"><small>${label}</small><strong>${n}</strong></div>`).join("");
}

/* ---------- Products ---------- */

function renderProducts() {
  if (!products.length) {
    $("#adminProducts").innerHTML = `<tr><td colspan="6">No products yet. Add your own, or <button class="small-btn" id="seedBtn" type="button">load the 12 sample products</button></td></tr>`;
    return;
  }
  $("#adminProducts").innerHTML = products.map((p) => `
    <tr>
      <td><span class="cell-product"><img src="${esc(safeImage(p.image))}" alt=""><strong>${esc(p.name)}</strong></span></td>
      <td>${esc(p.category)}</td>
      <td>${money(p.price)}</td>
      <td>${Number(p.stock)}</td>
      <td>${p.active ? "Visible" : "Hidden"}</td>
      <td><div class="table-actions">
        <button class="small-btn" data-edit="${esc(p.id)}" type="button">Edit</button>
        <button class="small-btn danger" data-toggle="${esc(p.id)}" type="button">${p.active ? "Hide" : "Show"}</button>
      </div></td>
    </tr>`).join("");
}

$("#categorySelect").innerHTML = CATEGORIES.map((c) => `<option>${c}</option>`).join("");

function fillProductForm(p) {
  const f = $("#productForm");
  f.reset();
  f.elements.id.value = p ? p.id : "";
  f.elements.name.value = p ? p.name : "";
  f.elements.category.value = p ? p.category : CATEGORIES[0];
  f.elements.price.value = p ? p.price : "";
  f.elements.stock.value = p ? p.stock : "";
  f.elements.image.value = p ? p.image || "" : "";
  f.elements.description.value = p ? p.description || "" : "";
  f.elements.featured.checked = Boolean(p && p.featured);
  $("#productModalTitle").textContent = p ? "Edit product" : "Add product";
  $("#productFeedback").textContent = "";
  openModal("productModal");
  f.elements.name.focus();
}

$("#addProductBtn").addEventListener("click", () => fillProductForm(null));

$("#productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const button = f.querySelector('button[type="submit"]');
  const id = f.elements.id.value;
  const data = {
    name: f.elements.name.value.trim(),
    category: f.elements.category.value,
    price: Number(f.elements.price.value),
    stock: Math.max(0, Math.floor(Number(f.elements.stock.value))),
    image: f.elements.image.value.trim(),
    description: f.elements.description.value.trim(),
    featured: f.elements.featured.checked,
    updatedAt: fs.serverTimestamp()
  };
  button.disabled = true;
  try {
    if (id) await fs.updateDoc(fs.doc(db, "products", id), data);
    else await fs.addDoc(fs.collection(db, "products"), { ...data, active: true });
    closeModals();
    toast(`${data.name} saved`);
  } catch (err) {
    console.error("Product could not be saved", err);
    $("#productFeedback").textContent = "The product could not be saved. Check your connection and try again.";
  } finally {
    button.disabled = false;
  }
});

$("#adminProducts").addEventListener("click", async (e) => {
  if (e.target.closest("#seedBtn")) { seedProducts(e.target); return; }
  const edit = e.target.closest("[data-edit]");
  if (edit) { fillProductForm(products.find((p) => p.id === edit.dataset.edit)); return; }
  const toggle = e.target.closest("[data-toggle]");
  if (!toggle) return;
  const p = products.find((x) => x.id === toggle.dataset.toggle);
  if (!p) return;
  toggle.disabled = true;
  try {
    await fs.updateDoc(fs.doc(db, "products", p.id), { active: !p.active, updatedAt: fs.serverTimestamp() });
    toast(`${p.name} is now ${p.active ? "hidden" : "visible"}`);
  } catch (err) {
    console.error("Product could not be updated", err);
    toast("The product could not be updated.", true);
    toggle.disabled = false;
  }
});

async function seedProducts(button) {
  button.disabled = true;
  try {
    const batch = fs.writeBatch(db);
    SEED_PRODUCTS.forEach((p) => {
      batch.set(fs.doc(db, "products", `p${p.id}`), {
        name: p.name, category: p.category, description: p.description, price: p.price, stock: p.stock,
        image: p.image, featured: Boolean(p.featured), active: true, updatedAt: fs.serverTimestamp()
      });
    });
    await batch.commit();
    toast("Sample products loaded");
  } catch (err) {
    console.error("Sample products could not be loaded", err);
    toast("Sample products could not be loaded.", true);
    button.disabled = false;
  }
}

/* ---------- Orders ---------- */

// Flags orders whose prices do not match the catalogue, since shoppers' browsers send the totals.
function priceWarning(o) {
  const sum = o.items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
  const totalOff = Math.abs(sum - Number(o.subtotal)) > 0.01 || Math.abs(sum + deliveryFee(sum) - Number(o.total)) > 0.01;
  const priceOff = o.items.some((i) => { const p = products.find((x) => x.id === i.productId); return p && Math.abs(p.price - Number(i.price)) > 0.01; });
  if (totalOff) return '<p class="feedback error-text">Check this order: its total does not add up.</p>';
  if (priceOff) return '<p class="feedback error-text">Prices in this order differ from the current catalogue.</p>';
  return "";
}

function renderOrders() {
  $("#adminOrders").innerHTML = orders.length ? orders.map((o) => {
    const c = o.customer || {};
    return `
      <article class="order-card">
        <div class="order-top">
          <strong>Order #${shortId(o.id)} · ${esc(c.name)}</strong>
          <select data-status="${esc(o.id)}" aria-label="Status of order ${shortId(o.id)}">
            ${STATUSES.map((s) => `<option ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
        <p>${esc(c.email)} · <a href="tel:${esc(String(c.phone).replace(/[^\d+]/g, ""))}">${esc(c.phone)}</a><br>${esc(c.address)}<br>${esc(when(o.createdAt))}${c.notes ? `<br>Notes: ${esc(c.notes)}` : ""}</p>
        <ul>${o.items.map((i) => `<li>${esc(i.name)} × ${Number(i.quantity)} — ${money(i.price * i.quantity)}</li>`).join("")}</ul>
        <strong>${money(o.total)}</strong> <small>(${money(o.deliveryFee)} delivery)</small>
        ${priceWarning(o)}
      </article>`;
  }).join("") : '<p class="empty">No orders have been placed yet.</p>';
}

// Moving an order into a confirmed state takes stock; moving it out (cancel or back to pending) returns it.
async function changeStatus(orderId, status) {
  const orderRef = fs.doc(db, "orders", orderId);
  await fs.runTransaction(db, async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists()) throw new Error("This order no longer exists.");
    const o = orderSnap.data();
    const wantStock = holdsStock(status);
    const direction = wantStock && !o.stockDeducted ? -1 : !wantStock && o.stockDeducted ? 1 : 0;
    const reads = [];
    if (direction) {
      for (const item of o.items) {
        const ref = fs.doc(db, "products", item.productId);
        reads.push({ ref, snap: await tx.get(ref), item });
      }
      for (const { snap, item } of reads) {
        if (snap.exists() && snap.data().stock + direction * item.quantity < 0) {
          throw new Error(`Not enough stock for ${item.name}.`);
        }
      }
      for (const { ref, snap, item } of reads) {
        if (snap.exists()) tx.update(ref, { stock: snap.data().stock + direction * item.quantity });
      }
    }
    tx.update(orderRef, { status, stockDeducted: direction ? wantStock : o.stockDeducted });
  });
}

$("#adminOrders").addEventListener("change", async (e) => {
  const select = e.target.closest("[data-status]");
  if (!select) return;
  select.disabled = true;
  try {
    await changeStatus(select.dataset.status, select.value);
    toast(`Order is now ${select.value}`);
  } catch (err) {
    console.error("Status could not be changed", err);
    toast(err.message && !err.code ? err.message : "The status could not be changed.", true);
    renderOrders();
  } finally {
    select.disabled = false;
  }
});

/* ---------- Messages ---------- */

function renderMessages() {
  $("#adminMessages").innerHTML = messages.length ? messages.map((m) => `
    <article class="order-card">
      <div class="order-top"><strong>${esc(m.name)}</strong><button class="small-btn danger" data-delete-message="${esc(m.id)}" type="button">Delete</button></div>
      <p><a href="mailto:${esc(m.email)}">${esc(m.email)}</a><br>${esc(when(m.createdAt))}</p>
      <p class="message-text">${esc(m.message)}</p>
    </article>`).join("") : '<p class="empty">No messages yet.</p>';
}

$("#adminMessages").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-delete-message]");
  if (!b || !confirm("Delete this message? This cannot be undone.")) return;
  try {
    await fs.deleteDoc(fs.doc(db, "messages", b.dataset.deleteMessage));
    toast("Message deleted");
  } catch (err) {
    console.error("Message could not be deleted", err);
    toast("The message could not be deleted.", true);
  }
});

/* ---------- Layout ---------- */

document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll("[data-tab]").forEach((x) => x.classList.toggle("active", x === b));
  ["products", "orders", "messages"].forEach((t) => $(`#${t}Tab`).classList.toggle("hidden", b.dataset.tab !== t));
}));
document.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModals(); });
$("#overlay").addEventListener("click", closeModals);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModals(); });
