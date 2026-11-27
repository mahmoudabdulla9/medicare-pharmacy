// Firebase web app settings, from Firebase console > Project settings > Your apps.
// These values identify the project and are meant to be public. Access is
// controlled by the Firestore rules in firestore.rules, not by hiding them.
export const firebaseConfig = {
  apiKey: "AIzaSyDhteAhbStQceM4HZiSaZT3-g7Xj6svvs4",
  authDomain: "medicare-pharmacy-c9d09.firebaseapp.com",
  projectId: "medicare-pharmacy-c9d09",
  storageBucket: "medicare-pharmacy-c9d09.firebasestorage.app",
  messagingSenderId: "712367330249",
  appId: "1:712367330249:web:b5c6d66548f4c1dbdfce18"
};

// Shows a banner telling visitors that orders are not delivered.
// Set to false when a real pharmacy uses the store.
export const SHOW_DEMO_NOTICE = true;
