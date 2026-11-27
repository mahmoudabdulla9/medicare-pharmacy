// Sample catalogue. The admin can load it into an empty store with one click.
// All products, prices and stock levels are fictional.
export const SEED_PRODUCTS = [
  { id: 1, name: "Paracetamol 500mg", category: "Medicines", description: "Pain and fever relief. Use only as directed on the package.", price: 35, stock: 80, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600", featured: true },
  { id: 2, name: "Vitamin C 1000mg", category: "Vitamins", description: "Daily vitamin C supplement.", price: 120, stock: 45, image: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=600", featured: true },
  { id: 3, name: "Digital Thermometer", category: "Devices", description: "Digital thermometer for home use.", price: 95, stock: 30, image: "assets/images/thermometer.svg", featured: true },
  { id: 4, name: "Hand Sanitizer 250ml", category: "Personal Care", description: "Alcohol-based hand sanitizer.", price: 55, stock: 60, image: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=600", featured: false },
  { id: 5, name: "First Aid Kit", category: "Devices", description: "Basic home first aid kit.", price: 240, stock: 18, image: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600", featured: true },
  { id: 6, name: "Omega 3", category: "Vitamins", description: "Omega 3 supplement.", price: 210, stock: 25, image: "assets/images/omega-3.svg", featured: false },
  { id: 7, name: "Moisturizing Cream", category: "Personal Care", description: "Daily skin moisturizing cream.", price: 85, stock: 35, image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600", featured: false },
  { id: 8, name: "Medical Face Masks", category: "Personal Care", description: "Disposable protective face masks.", price: 45, stock: 100, image: "https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=600", featured: false },
  { id: 9, name: "Blood Pressure Monitor", category: "Devices", description: "Automatic upper-arm blood pressure monitor.", price: 780, stock: 12, image: "https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=600", featured: true },
  { id: 10, name: "Zinc 25mg", category: "Vitamins", description: "Zinc supplement.", price: 110, stock: 40, image: "assets/images/zinc.svg", featured: false },
  { id: 11, name: "Cough Syrup", category: "Medicines", description: "General cough relief product. Ask a pharmacist before use.", price: 70, stock: 22, image: "assets/images/cough-syrup.svg", featured: false },
  { id: 12, name: "Antiseptic Solution", category: "Medicines", description: "For external use only. Follow label instructions.", price: 65, stock: 28, image: "assets/images/antiseptic.svg", featured: false }
];

export const CATEGORIES = ["Medicines", "Vitamins", "Personal Care", "Devices"];
export const PLACEHOLDER_IMAGE = "assets/images/placeholder.svg";
export const DELIVERY_FEE = 25;
export const FREE_DELIVERY_FROM = 500;

export const deliveryFee = (subtotal) => (subtotal >= FREE_DELIVERY_FROM || subtotal === 0 ? 0 : DELIVERY_FEE);
export const money = (n) => `EGP ${Number(n || 0).toFixed(2)}`;
export const escapeHtml = (value = "") =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Only local images and https addresses are shown; anything else uses the placeholder.
export const safeImage = (src) => {
  const value = String(src || "").trim();
  return /^assets\/[\w./-]+$/.test(value) || /^https:\/\/\S+$/i.test(value) ? value : PLACEHOLDER_IMAGE;
};

// Show the placeholder when any image fails to load.
document.addEventListener("error", (event) => {
  const img = event.target;
  if (img.tagName === "IMG" && !img.dataset.failed) {
    img.dataset.failed = "1";
    img.src = PLACEHOLDER_IMAGE;
  }
}, true);
