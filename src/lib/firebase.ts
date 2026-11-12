import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

function readFirebaseConfig(): FirebaseOptions | null {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !storageBucket ||
    !messagingSenderId ||
    !appId
  ) {
    return null;
  }

  return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
}

const firebaseConfig = readFirebaseConfig();
const existingApps = getApps();

export const firebaseApp = firebaseConfig
  ? existingApps.length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth = firebaseApp
  ? existingApps.length > 0 || Platform.OS === "web"
    ? getAuth(firebaseApp)
    : initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage),
      })
  : null;

export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const storage = firebaseApp ? getStorage(firebaseApp) : null;
export const isFirebaseConfigured = firebaseApp !== null;

function requireAuth() {
  if (!auth) {
    throw new Error("Firebase no esta configurado. Completa las variables EXPO_PUBLIC_FIREBASE_*.");
  }

  return auth;
}

export function observeAuthState(
  listener: (user: User | null) => void,
  onError: (error: Error) => void,
) {
  return onAuthStateChanged(requireAuth(), listener, onError);
}

export async function registerWithEmail(name: string, email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(
    requireAuth(),
    email.trim(),
    password,
  );

  await updateProfile(userCredential.user, { displayName: name.trim() });
  if (!db) {
    throw new Error("Firestore no esta disponible.");
  }

  await setDoc(doc(db, "users", userCredential.user.uid), {
    displayName: name.trim(),
    email: userCredential.user.email,
    createdAt: serverTimestamp(),
  });

  return userCredential.user;
}

export async function signInWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(requireAuth(), email.trim(), password);
  return credential.user;
}

export async function signOutUser() {
  await signOut(requireAuth());
}

export function getFirebaseSetupMessage() {
  return "Crea un proyecto Firebase y completa las variables EXPO_PUBLIC_FIREBASE_* en .env.";
}
