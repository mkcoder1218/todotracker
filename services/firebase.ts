import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from "firebase/auth";
import {
  getFirestore,
  collection as _collection,
  addDoc as _addDoc,
  updateDoc as _updateDoc,
  deleteDoc as _deleteDoc,
  doc as _doc,
  query as _query,
  where as _where,
  onSnapshot as _onSnapshot,
  orderBy as _orderBy,
  Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDehfB8qzXZOsr_7C6eOtUnQNJhzQBs2vQ",
  authDomain: "todo-a697c.firebaseapp.com",
  projectId: "todo-a697c",
  storageBucket: "todo-a697c.firebasestorage.app",
  messagingSenderId: "1004230173120",
  appId: "1:1004230173120:web:b4da1bc2f554d3c909e825",
  measurementId: "G-K2DC0DFVJ2",
};

// State to track if we should use mock even if config exists
let forceMock = localStorage.getItem("zentask_force_mock") === "true";

export const isFirebaseConfigured = true;

let app: FirebaseApp | null = null;
let _auth: Auth | any = null;
let _db: Firestore | any = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    _auth = getAuth(app);
    _db = getFirestore(app);
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
}

export const enableDemoMode = () => {
  localStorage.setItem("zentask_force_mock", "true");
  window.location.reload();
};

export const resetToRealFirebase = () => {
  localStorage.removeItem("zentask_force_mock");
  window.location.reload();
};

// --- MOCK IMPLEMENTATION ---
const MOCK_STORAGE_KEY = "zentask_mock_data";
const MOCK_USER_KEY = "zentask_mock_user";

const getMockData = () =>
  JSON.parse(
    localStorage.getItem(MOCK_STORAGE_KEY) || '{"tasks": [], "categories": []}',
  );
const saveMockData = (data: any) => {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("zentask_data_changed"));
};

const mockAuth = {
  currentUser: JSON.parse(localStorage.getItem(MOCK_USER_KEY) || "null"),
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    const handler = () => callback(mockAuth.currentUser);
    window.addEventListener("zentask_auth_changed", handler);
    setTimeout(handler, 0);
    return () => window.removeEventListener("zentask_auth_changed", handler);
  },
};

export const auth = isFirebaseConfigured ? _auth : mockAuth;
export const db = isFirebaseConfigured ? _db : {};
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/calendar");
googleProvider.addScope("https://www.googleapis.com/auth/calendar.events");

export const loginWithGoogle = async () => {
  if (isFirebaseConfigured && _auth) {
    try {
      const result = await signInWithPopup(_auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        localStorage.setItem("google_access_token", credential.accessToken);
      }
      return result.user;
    } catch (error: any) {
      console.error("Firebase Auth Error Details:", error);
      // Let the UI handle the specific error codes
      throw error;
    }
  } else {
    // Mock Login
    const mockUser = {
      uid: "mock-user-123",
      displayName: "Zen User (Demo)",
      email: "hello@zentask.ai",
      photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zen",
    } as any;
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockUser));
    mockAuth.currentUser = mockUser;
    window.dispatchEvent(new CustomEvent("zentask_auth_changed"));
    return mockUser;
  }
};

export const logout = async () => {
  if (isFirebaseConfigured && _auth) {
    return signOut(_auth);
  } else {
    localStorage.removeItem(MOCK_USER_KEY);
    mockAuth.currentUser = null;
    window.dispatchEvent(new CustomEvent("zentask_auth_changed"));
  }
};

// Persistence functions
export const collection = (db: any, path: string) =>
  isFirebaseConfigured ? _collection(db, path) : path;
export const doc = (db: any, path: string, id: string) =>
  isFirebaseConfigured ? _doc(db, path, id) : { path, id };
export const query = (ref: any, ...constraints: any[]) =>
  isFirebaseConfigured ? _query(ref, ...constraints) : ref;
export const where = (field: string, op: string, val: any) =>
  isFirebaseConfigured ? _where(field, op as any, val) : { field, op, val };
export const orderBy = (field: string, dir: string) =>
  isFirebaseConfigured ? _orderBy(field, dir as any) : { field, dir };

export const addDoc = async (collRef: any, data: any) => {
  if (isFirebaseConfigured) return _addDoc(collRef, data);
  const store = getMockData();
  const newDoc = { ...data, id: Math.random().toString(36).substr(2, 9) };
  store[collRef].push(newDoc);
  saveMockData(store);
  return { id: newDoc.id };
};

export const updateDoc = async (docRef: any, data: any) => {
  if (isFirebaseConfigured) return _updateDoc(docRef, data);
  const store = getMockData();
  const index = store[docRef.path].findIndex(
    (item: any) => item.id === docRef.id,
  );
  if (index !== -1) {
    store[docRef.path][index] = { ...store[docRef.path][index], ...data };
    saveMockData(store);
  }
};

export const deleteDoc = async (docRef: any) => {
  if (isFirebaseConfigured) return _deleteDoc(docRef);
  const store = getMockData();
  store[docRef.path] = store[docRef.path].filter(
    (item: any) => item.id !== docRef.id,
  );
  saveMockData(store);
};

export const onSnapshot = (
  q: any,
  callback: (snapshot: any) => void,
  onError?: (error: any) => void,
) => {
  if (isFirebaseConfigured) return _onSnapshot(q, callback, onError);
  const handler = () => {
    const store = getMockData();
    const data = store[q] || [];
    callback({
      docs: data.map((item: any) => ({
        id: item.id,
        data: () => item,
      })),
    });
  };
  window.addEventListener("zentask_data_changed", handler);
  setTimeout(handler, 0);
  return () => window.removeEventListener("zentask_data_changed", handler);
};
