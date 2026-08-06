
'use client';

import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithPopup,
    updateProfile,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    type User 
} from 'firebase/auth';
import { app } from '@/lib/firebase';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, pass: string, name: string) => Promise<User | null>;
  login: (email: string, pass: string) => Promise<User | null>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<User | null>;
  loginWithApple: () => Promise<User | null>;
  updateUserProfile: (name: string) => Promise<void>;
  updateUserPassword: (newPassword: string, currentPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth State Changed:", user);
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signup = async (email: string, pass: string, name: string): Promise<User | null> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, { displayName: name });
      // To get the updated user info, we need to get the user object again
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser({ ...currentUser }); // Force a state update with the new profile info
        return currentUser;
      }
      return userCredential.user;
    } catch (error: any) {
      console.error("Signup error:", error.code, error.message);
      if (error.code === 'auth/email-already-in-use') {
          throw new Error('This email address is already registered. Please login or use a different email.');
      }
      // Let the UI handle other errors
      throw new Error(error.message || 'An unexpected error occurred during sign up.');
    }
  };

  const login = async (email: string, pass: string): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      return userCredential.user;
    } catch (error: any) {
      console.error("Login error:", error.message);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          throw new Error('Invalid email or password. Please try again.');
      }
      // Let the UI handle other errors
      throw new Error(error.message || 'An unexpected error occurred during login.');
    }
  };
  
  const loginWithGoogle = async (): Promise<User | null> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user') {
            console.log("Google login popup closed by user.");
            return null;
        }
        console.error("Google login error:", error.message);
        throw new Error(error.message || 'Failed to sign in with Google.');
    }
  }

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const updateUserProfile = async (name: string) => {
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
        setUser({ ...auth.currentUser }); // Force refresh of user state
    } else {
        throw new Error("No user is currently signed in.");
    }
  };

  const updateUserPassword = async (newPassword: string, currentPassword: string) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("No user is currently signed in.");
    }

    if (!user.email) {
        throw new Error("Cannot change password: no email on account.");
    }

    try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
    } catch (error: any) {
        console.error("Password update error:", error);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error("Current password is incorrect. Please try again.");
        }
        if (error.code === 'auth/weak-password') {
            throw new Error("New password is too weak. Use at least 6 characters.");
        }
        throw new Error(error.message || 'An unexpected error occurred while updating the password.');
    }
  };

  const loginWithApple = async (): Promise<User | null> => {
    try {
        const result = await signInWithPopup(auth, appleProvider);
        return result.user;
    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user') {
            console.log("Apple login popup closed by user.");
            return null;
        }
        console.error("Apple login error:", error.message);
        throw new Error(error.message || 'Failed to sign in with Apple.');
    }
  }

  const value = { user, loading, signup, login, logout, loginWithGoogle, loginWithApple, updateUserProfile, updateUserPassword };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

    