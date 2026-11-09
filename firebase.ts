// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCk0J_f-1Erty50LFWmkqwDtT0AyFmytjU",
  authDomain: "presion-1966.firebaseapp.com",
  projectId: "presion-1966",
  storageBucket: "presion-1966.firebasestorage.app",
  messagingSenderId: "692033244035",
  appId: "1:692033244035:web:0f5b489824a7e504a8c4b6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth adaptado a React Native con AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Inicializar Firestore (Base de datos)
const db = getFirestore(app);

// Autenticar de forma anónima automáticamente
signInAnonymously(auth)
  .then(() => {
    console.log("Sesión anónima iniciada correctamente");
  })
  .catch((error) => {
    console.error("Error en la autenticación anónima:", error);
  });

export { db, auth };