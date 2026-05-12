// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3M3EM6Wvw4EL9UBAqfCO9WwrTCMWUnIE",
  authDomain: "dalia-kitchen-54edf.firebaseapp.com",
  databaseURL: "https://dalia-kitchen-54edf-default-rtdb.firebaseio.com",
  projectId: "dalia-kitchen-54edf",
  storageBucket: "dalia-kitchen-54edf.firebasestorage.app",
  messagingSenderId: "1001812094584",
  appId: "1:1001812094584:web:42b2e93d579f6d81fc478d"
};

// Initialize Firebase (using compat SDK for simplicity in current project structure)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
