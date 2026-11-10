import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDkZT93mXgdccGR_C5qbVVJiKwmN9WAj0U",
  authDomain: "radiorama-checador.firebaseapp.com",
  projectId: "radiorama-checador",
  storageBucket: "radiorama-checador.firebasestorage.app",
  messagingSenderId: "280976025548",
  appId: "1:280976025548:web:0847493663cb559504df69"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Exportamos los métodos que usaremos en el formulario
export { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile };