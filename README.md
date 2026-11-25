# MediCare Pharmacy

A responsive online pharmacy storefront with a browser-only admin demo, built with HTML, CSS and vanilla JavaScript. No frameworks, build step or backend.

**Live site:** https://mahmoudabdulla9.github.io/medicare-pharmacy/
**Admin demo:** https://mahmoudabdulla9.github.io/medicare-pharmacy/admin.html

## Features

**Store**

- Homepage with product, about and contact sections
- Search, category filters, in-stock filter and sorting
- Product details window with stock level and quantity
- Cart with quantity controls, subtotal, delivery fee and total
- Checkout form with validation, demo order confirmation and "My orders"
- Cart, products, orders and messages saved in LocalStorage
- Placeholder image when a product photo fails to load
- Loading, empty, success and error states
- Layouts for desktop, tablet and mobile

**Admin demo**

- Product, order, pending, low-stock and order value statistics
- Add, edit, hide and show products
- View customer details and ordered items
- Change order status (cancelling returns items to stock)
- Read contact messages and reset the demo data

## Run locally

Download or clone the repository and open `index.html` in a modern browser, or serve the folder:

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Structure

```text
index.html          Storefront
admin.html          Admin demo
css/style.css       Styles for both pages
js/data.js          Sample catalogue and image fallback
js/store.js         Storefront logic
js/admin.js         Admin logic
assets/images/      Local product artwork, placeholder and favicon
.nojekyll           Serve files as they are on GitHub Pages
```

## Deployment

GitHub Pages publishes the `main` branch from the repository root.

## Important limitations

- This is a portfolio demo, not a licensed pharmacy. Products, prices and stock are fictional and nothing here is medical advice.
- The admin dashboard has no login or server. It is not a secure system and must not be used to manage a real pharmacy.
- LocalStorage belongs to one browser. Data is not shared between users or devices.
- No payment, delivery, prescription or email is processed. Do not enter real personal information.

Some product photos are loaded from [Unsplash](https://unsplash.com).
