# MediCare Pharmacy

Responsive static pharmacy storefront demo built with HTML, CSS and vanilla JavaScript. Designed for GitHub Pages; no build step or backend is required.

## Pages
- `index.html` — storefront, product search and category filters, cart, and demo checkout.
- `admin.html` — browser-only dashboard for managing products and viewing demo orders.
- `css/style.css` — responsive styles.
- `js/store.js` — storefront behavior and sample catalogue.
- `js/admin.js` — demo dashboard behavior.

## Publish with GitHub Pages
1. Open the repository **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select branch `main` and folder `/(root)`, then save.
4. Wait for the Pages deployment to finish.

## Demo limitations
This is a frontend portfolio/demo project, not a real pharmacy service. Products and prices are illustrative. Cart, product changes, and orders are stored in each visitor's browser using `localStorage`; they are not shared between devices or users. Checkout does not process payments or send orders to a pharmacy. The admin page is not protected by real authentication and must not be used for real customer data. Do not enter sensitive or real customer information.

The contact form is also a local demo and does not send messages to an inbox.