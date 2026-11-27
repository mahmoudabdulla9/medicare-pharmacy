// Connects the site to Firebase (Firestore database and Authentication).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import * as fs from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import * as au from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

export const isConfigured = Boolean(firebaseConfig.apiKey) && !firebaseConfig.apiKey.startsWith("PASTE");

let db = null;
let auth = null;
if (isConfigured) {
  const app = initializeApp(firebaseConfig);
  db = fs.getFirestore(app);
  auth = au.getAuth(app);
}

export { db, auth, fs, au };
