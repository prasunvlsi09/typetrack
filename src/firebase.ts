import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { getFirestore, getDoc, doc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Helper to create a dummy email from a username
const getDummyEmail = (username: string) => {
  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${cleanUsername}@typetrack.local`;
};

export const signUpWithUsername = async (username: string, displayName: string, password: string, rememberMe: boolean = true) => {
  try {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const email = getDummyEmail(username);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error("Error signing up", error);
    let errorMessage = "Failed to sign up.";
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = "Username is already taken.";
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "Password should be at least 6 characters.";
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = "Email/Password sign-in is not enabled in Firebase Console.";
    }
    return { user: null, error: errorMessage };
  }
};

export const logInWithUsername = async (username: string, password: string, rememberMe: boolean = true) => {
  try {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const email = getDummyEmail(username);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Check if account is disabled
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (userDoc.exists() && userDoc.data().disabled) {
      await signOut(auth);
      return { user: null, error: "This account has been disabled." };
    }
    
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error("Error logging in", error);
    let errorMessage = "Failed to log in.";
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      errorMessage = "Invalid username or password.";
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = "Email/Password sign-in is not enabled in Firebase Console.";
    }
    return { user: null, error: errorMessage };
  }
};

export const signInWithGoogle = async (rememberMe: boolean = true) => {
  try {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const result = await signInWithPopup(auth, googleProvider);
    
    // Check if account is disabled
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (userDoc.exists() && userDoc.data().disabled) {
      await signOut(auth);
      throw new Error("This account has been disabled.");
    }
    
    return result;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

async function testConnection() {
  try {
    await getDoc(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();
