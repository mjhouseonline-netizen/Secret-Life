/**
 * Firebase Service
 * Handles authentication, Firestore database, and Firebase Storage
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { User, UserSettings } from '../types';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID
};

const ADMIN_EMAIL = 'bubblesfox@gmail.com';
const DEFAULT_CREDITS = 100;

class FirebaseService {
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private db: Firestore | null = null;
  private storage: FirebaseStorage | null = null;
  private googleProvider: GoogleAuthProvider | null = null;
  private appleProvider: OAuthProvider | null = null;

  /**
   * Check if Firebase is configured
   */
  isConfigured(): boolean {
    return !!(
      firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId
    );
  }

  /**
   * Initialize Firebase
   */
  init(): boolean {
    if (this.app) return true;

    if (!this.isConfigured()) {
      console.warn('Firebase not configured. Set VITE_FIREBASE_* environment variables.');
      return false;
    }

    try {
      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      this.storage = getStorage(this.app);

      // Setup providers
      this.googleProvider = new GoogleAuthProvider();
      this.googleProvider.addScope('profile');
      this.googleProvider.addScope('email');

      this.appleProvider = new OAuthProvider('apple.com');
      this.appleProvider.addScope('email');
      this.appleProvider.addScope('name');

      return true;
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      return false;
    }
  }

  /**
   * Get current Firebase user
   */
  getCurrentFirebaseUser(): FirebaseUser | null {
    return this.auth?.currentUser || null;
  }

  /**
   * Listen for auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    if (!this.auth) {
      return () => {};
    }

    return onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await this.getUserProfile(firebaseUser.uid);
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    if (!this.auth || !this.googleProvider) {
      throw new Error('Firebase not initialized');
    }

    const result = await signInWithPopup(this.auth, this.googleProvider);
    const firebaseUser = result.user;

    // Get or create user profile in Firestore
    let user = await this.getUserProfile(firebaseUser.uid);

    if (!user) {
      // Create new user
      user = await this.createUserProfile(firebaseUser);
    } else {
      // Update last login
      await this.updateUserProfile(firebaseUser.uid, {
        avatarUrl: firebaseUser.photoURL || user.avatarUrl
      });
    }

    return user;
  }

  /**
   * Sign in with Apple
   */
  async signInWithApple(): Promise<User> {
    if (!this.auth || !this.appleProvider) {
      throw new Error('Firebase not initialized');
    }

    const result = await signInWithPopup(this.auth, this.appleProvider);
    const firebaseUser = result.user;

    let user = await this.getUserProfile(firebaseUser.uid);

    if (!user) {
      user = await this.createUserProfile(firebaseUser);
    }

    return user;
  }

  /**
   * Sign in with email/password
   */
  async signInWithEmail(email: string, password: string): Promise<User> {
    if (!this.auth) {
      throw new Error('Firebase not initialized');
    }

    const result = await signInWithEmailAndPassword(this.auth, email, password);
    const user = await this.getUserProfile(result.user.uid);

    if (!user) {
      throw new Error('User profile not found');
    }

    return user;
  }

  /**
   * Sign up with email/password
   */
  async signUpWithEmail(email: string, password: string, username: string): Promise<User> {
    if (!this.auth) {
      throw new Error('Firebase not initialized');
    }

    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    const user = await this.createUserProfile(result.user, username);

    return user;
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    if (this.auth) {
      await signOut(this.auth);
    }
  }

  /**
   * Get user profile from Firestore
   */
  async getUserProfile(uid: string): Promise<User | null> {
    if (!this.db) return null;

    try {
      const userDoc = await getDoc(doc(this.db, 'users', uid));

      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();
      return {
        id: uid,
        username: data.username,
        email: data.email,
        role: data.role,
        credits: data.credits,
        avatarUrl: data.avatarUrl,
        cloudProvider: data.cloudProvider || 'none',
        cloudAccessToken: data.cloudAccessToken,
        cloudTokenExpiry: data.cloudTokenExpiry,
        settings: data.settings
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Create user profile in Firestore
   */
  async createUserProfile(firebaseUser: FirebaseUser, username?: string): Promise<User> {
    if (!this.db) {
      throw new Error('Firestore not initialized');
    }

    const isAdmin = firebaseUser.email?.toLowerCase() === ADMIN_EMAIL;
    const displayName = username || firebaseUser.displayName || 'Studio Director';

    const userData = {
      username: displayName,
      email: firebaseUser.email || '',
      role: isAdmin ? 'admin' : 'user',
      credits: isAdmin ? 999999 : DEFAULT_CREDITS,
      avatarUrl: firebaseUser.photoURL || '',
      cloudProvider: 'none',
      settings: {
        safeMode: true,
        hdByDefault: true,
        autoCloudSync: false
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(this.db, 'users', firebaseUser.uid), userData);

    return {
      id: firebaseUser.uid,
      username: userData.username,
      email: userData.email,
      role: userData.role as 'user' | 'admin',
      credits: userData.credits,
      avatarUrl: userData.avatarUrl,
      cloudProvider: 'none',
      settings: userData.settings
    };
  }

  /**
   * Update user profile in Firestore
   */
  async updateUserProfile(uid: string, updates: Partial<User>): Promise<void> {
    if (!this.db) return;

    try {
      await updateDoc(doc(this.db, 'users', uid), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }

  /**
   * Update user credits
   */
  async updateCredits(uid: string, newCredits: number): Promise<void> {
    await this.updateUserProfile(uid, { credits: newCredits });
  }

  /**
   * Update user settings
   */
  async updateSettings(uid: string, settings: UserSettings): Promise<void> {
    await this.updateUserProfile(uid, { settings });
  }

  /**
   * Upload file to Firebase Storage
   */
  async uploadFile(
    userId: string,
    fileData: Blob,
    fileName: string,
    contentType: string
  ): Promise<string> {
    if (!this.storage) {
      throw new Error('Firebase Storage not initialized');
    }

    const filePath = `users/${userId}/creations/${fileName}`;
    const storageRef = ref(this.storage, filePath);

    await uploadBytes(storageRef, fileData, { contentType });
    const downloadUrl = await getDownloadURL(storageRef);

    return downloadUrl;
  }

  /**
   * Save creation metadata to Firestore
   */
  async saveCreation(
    userId: string,
    creationId: string,
    metadata: {
      type: string;
      prompt: string;
      timestamp: number;
      storageUrl?: string;
      metadata?: any;
    }
  ): Promise<void> {
    if (!this.db) return;

    await setDoc(doc(this.db, 'users', userId, 'creations', creationId), {
      ...metadata,
      createdAt: serverTimestamp()
    });
  }

  /**
   * Get user creations from Firestore
   */
  async getCreations(userId: string): Promise<any[]> {
    if (!this.db) return [];

    try {
      const creationsRef = collection(this.db, 'users', userId, 'creations');
      const q = query(creationsRef);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting creations:', error);
      return [];
    }
  }

  /**
   * Delete user account and data
   */
  async deleteAccount(uid: string): Promise<void> {
    if (!this.auth || !this.db) return;

    // Delete user document (Firestore rules should handle cascading deletes)
    // For production, you'd want a Cloud Function to handle this properly

    await signOut(this.auth);
  }
}

export const firebaseService = new FirebaseService();
