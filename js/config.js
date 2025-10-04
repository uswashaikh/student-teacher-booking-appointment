/* 
    File: config.js
    Location: /js/config.js
    Description: Firebase configuration and initialization
*/

// Firebase configuration
// TODO: Replace with your Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyA9ngP_7D-pGAuEoi4KP-3h7Fpwka4OvBA",
  authDomain: "student-teacher-appointm-68e30.firebaseapp.com",
  projectId: "student-teacher-appointm-68e30",
  storageBucket: "student-teacher-appointm-68e30.firebasestorage.app",
  messagingSenderId: "229736772653",
  appId: "1:229736772653:web:f7bbf66f987e30c65274a4",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Log initialization
console.log("Firebase initialized successfully");

// Export for use in other files (for reference)
// In browser, these are available globally
