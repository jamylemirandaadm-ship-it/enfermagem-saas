import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBJ2H1PJTNCkzEZ2Bjp99vNKl5X6dJsHV4",
  authDomain: "enfermagem-pro.firebaseapp.com",
  projectId: "enfermagem-pro",
  storageBucket: "enfermagem-pro.firebasestorage.app",
  messagingSenderId: "295634593810",
  appId: "1:295634593810:web:433282781a848412c290cb",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);