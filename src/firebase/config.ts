import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

export { onAuthStateChanged, type User };
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { Thread } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyDKGNXCwtgGYUNGOxcsGlfg-a97NUaPD_Y",
  authDomain: "gamuraai.firebaseapp.com",
  projectId: "gamuraai",
  storageBucket: "gamuraai.firebasestorage.app",
  messagingSenderId: "293191856506",
  appId: "1:293191856506:web:3153e354cd6881d2dca6c3",
  measurementId: "G-ZBH0TT195S"
};

// Initialize Firebase safely (avoid duplicate app initializations)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Normalizes username or email to valid email for Firebase Auth
 */
export function formatAuthEmail(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  // If user entered a plain username, map to internal domain
  const cleanUsername = trimmed.replace(/[^a-z0-9_.-]/g, '');
  return `${cleanUsername || 'user'}@gamura.local`;
}

/**
 * Sign in with Username or Email and Password
 */
export async function loginWithEmailOrUsername(identifier: string, pass: string): Promise<User> {
  const email = formatAuthEmail(identifier);
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

/**
 * Register with Username, Nickname, and Password
 */
export async function registerWithUserAndNick(
  identifier: string,
  nickname: string,
  pass: string
): Promise<User> {
  const email = formatAuthEmail(identifier);
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (nickname.trim()) {
    await updateProfile(result.user, {
      displayName: nickname.trim(),
    });
  }
  // Store user record in Firestore
  try {
    await setDoc(doc(db, 'users', result.user.uid), {
      username: identifier.trim(),
      nickname: nickname.trim() || identifier.trim(),
      email: result.user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Could not write user profile to Firestore:', err);
  }
  return result.user;
}

/**
 * Sign in with Google
 */
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  try {
    await setDoc(doc(db, 'users', result.user.uid), {
      nickname: result.user.displayName || 'Gamura User',
      email: result.user.email,
      photoURL: result.user.photoURL,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Could not sync Google user profile:', err);
  }
  return result.user;
}

/**
 * Sign out
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Real-time sync: Save or update thread in Firestore
 */
export async function syncThreadToFirestore(userId: string, thread: Thread): Promise<void> {
  if (!userId) return;
  try {
    const threadRef = doc(db, 'users', userId, 'chats', thread.id);
    await setDoc(threadRef, {
      id: thread.id,
      title: thread.title,
      msgs: thread.msgs.slice(-50), // keep recent messages clean
      pin: Boolean(thread.pin),
      t: thread.t || Date.now(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to sync thread to Firestore:', err);
  }
}

/**
 * Real-time sync: Delete thread in Firestore
 */
export async function deleteThreadFromFirestore(userId: string, threadId: string): Promise<void> {
  if (!userId) return;
  try {
    const threadRef = doc(db, 'users', userId, 'chats', threadId);
    await deleteDoc(threadRef);
  } catch (err) {
    console.warn('Failed to delete thread from Firestore:', err);
  }
}

/**
 * Real-time sync: Subscribe to user threads
 */
export function subscribeToUserThreads(
  userId: string,
  onUpdate: (threads: Thread[]) => void
): () => void {
  if (!userId) return () => {};

  const chatsCol = collection(db, 'users', userId, 'chats');
  const chatsQuery = query(chatsCol, orderBy('t', 'desc'));

  return onSnapshot(
    chatsQuery,
    (snapshot) => {
      const threads: Thread[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        threads.push({
          id: data.id || docSnap.id,
          title: data.title || 'Chat',
          msgs: Array.isArray(data.msgs) ? data.msgs : [],
          pin: Boolean(data.pin),
          t: data.t || Date.now(),
        });
      });
      onUpdate(threads);
    },
    (err) => {
      console.warn('Firestore real-time subscription error:', err);
    }
  );
}
