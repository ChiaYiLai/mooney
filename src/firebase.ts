import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCeuhpIpQ-pHI-qPgTP_K5l5HMHufTcKrI",
  authDomain: "goodthings-f98a9.firebaseapp.com",
  databaseURL: "https://goodthings-f98a9.firebaseio.com",
  projectId: "goodthings-f98a9",
  storageBucket: "goodthings-f98a9.appspot.com",
  messagingSenderId: "1079841576572",
  appId: "1:1079841576572:web:1f827bc726b8b7f41adbf9",
  measurementId: "G-B052RQXWPE",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
