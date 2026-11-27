# MediCare Pharmacy

A responsive online pharmacy store with a secure admin dashboard, built with HTML, CSS and vanilla JavaScript on top of Firebase (Firestore and Authentication). It runs on GitHub Pages with no build step.

**Live site:** https://mahmoudabdulla9.github.io/medicare-pharmacy/

## Features

**Store**

- Products load live from the Firestore database
- Search, category filters, in-stock filter and sorting
- Product details window with stock level and quantity
- Cart with quantity controls, subtotal, delivery fee and total (saved on the device)
- Checkout with cash on delivery; orders are saved to the database
- "My orders" shows the orders placed on the same device, with their status
- Contact form that sends messages to the admin
- Loading, empty, success and error states, and layouts for desktop, tablet and mobile

**Admin dashboard** (`admin.html`, not linked from the store)

- Email and password sign-in; only accounts listed in the `admins` collection get in
- Live statistics for products, orders, pending orders, low stock and order value
- Add, edit, hide and show products, or load 12 sample products into an empty store
- See every order with the customer's details and change its status
- Confirming an order takes its items out of stock; cancelling it puts them back
- Warns when an order's prices do not match the catalogue
- Read and delete contact messages

## Security

Access is enforced by Firebase, not by the page. The rules in `firestore.rules`:

- let anyone read visible products, and only admins change them
- let a shopper create an order for themselves and read only their own orders
- let only admins read all orders, change their status, and read messages
- never let anyone make themselves an admin; admins are added by hand in the Firebase console

The Firebase settings in `js/firebase-config.js` identify the project and are public by design.

## Set up your own copy

1. Create a Firebase project and a Firestore database (production mode).
2. In Authentication, enable **Email/Password** and **Anonymous**, and add your site's domain under Settings > Authorized domains.
3. Paste `firestore.rules` into Firestore > Rules and publish.
4. Add an admin user in Authentication > Users, then create a document in an `admins` collection whose ID is that user's UID (for example with a field `role: "admin"`).
5. Register a web app and copy its settings into `js/firebase-config.js`.
6. Set `SHOW_DEMO_NOTICE` to `false` in `js/firebase-config.js` when real customers will use the store.

## Run locally

The site uses JavaScript modules, so it must be served over HTTP rather than opened as a file:

```bash
python -m http.server 8000
```

Then open http://localhost:8000. `localhost` is allowed by Firebase by default.

## Structure

```text
index.html              Store
admin.html              Admin dashboard
css/style.css           Styles
js/firebase-config.js   Firebase project settings and the demo notice switch
js/firebase.js          Firebase connection
js/data.js              Sample products and shared helpers
js/store.js             Store logic
js/admin.js             Admin logic
firestore.rules         Database security rules
assets/images/          Product artwork, placeholder and favicon
```

## Limitations

- Payment is cash on delivery only; there is no online payment.
- Product images are added by URL. Uploading images to Firebase Storage needs the paid Blaze plan.
- The free Spark plan has daily limits that suit a small shop.
- Prescription medicines are not sold online. Selling medicines may need licences that the pharmacy is responsible for.
- The public portfolio copy shows a notice that orders are not delivered.

Some product photos are loaded from [Unsplash](https://unsplash.com).
