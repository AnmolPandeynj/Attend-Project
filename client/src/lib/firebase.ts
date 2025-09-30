import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, updateDoc, addDoc, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth functions
export const signInFaculty = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const signOutUser = async () => {
  return await signOut(auth);
};

export const setupRecaptcha = (containerId: string) => {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    }
  });
};

export const sendOTP = async (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
  return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
};

// Firestore collections
export const usersCollection = collection(db, 'users');
export const sessionsCollection = collection(db, 'sessions');
export const attendanceCollection = collection(db, 'attendance');
export const qrTokensCollection = collection(db, 'qr_tokens');

// Firestore helper functions
export const createUser = async (userData: any) => {
  const docRef = doc(usersCollection);
  await setDoc(docRef, {
    ...userData,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

export const getUser = async (uid: string) => {
  const docRef = doc(usersCollection, uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const createSession = async (sessionData: any) => {
  const docRef = doc(sessionsCollection);
  await setDoc(docRef, {
    ...sessionData,
    createdAt: Timestamp.now(),
    isActive: true
  });
  return docRef.id;
};

export const updateSession = async (sessionId: string, data: any) => {
  const docRef = doc(sessionsCollection, sessionId);
  await updateDoc(docRef, data);
};

export const markAttendance = async (attendanceData: any) => {
  const docRef = doc(attendanceCollection);
  await setDoc(docRef, {
    ...attendanceData,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

export const getSessionAttendance = async (sessionId: string) => {
  const q = query(attendanceCollection, where('sessionId', '==', sessionId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToSession = (sessionId: string, callback: (data: any) => void) => {
  const docRef = doc(sessionsCollection, sessionId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};

export const subscribeToAttendance = (sessionId: string, callback: (data: any[]) => void) => {
  const q = query(attendanceCollection, where('sessionId', '==', sessionId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const attendanceData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(attendanceData);
  });
};
