import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDkgg2f7D73plxI9HBD3hJNUoKL21NmTa8",
  authDomain: "todlist-87237.firebaseapp.com",
  projectId: "todlist-87237",
  storageBucket: "todlist-87237.firebasestorage.app",
  messagingSenderId: "38996271758",
  appId: "1:38996271758:web:78eb38aef5c0e86426dfdf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
