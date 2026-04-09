import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import {
  onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export const ALL_ROLES = [
  'YFJ Chair',
  'Territory Coordinator',
  'Regional Coordinator',
  'Deacon',
  'EY',
  'YFJ',
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => signOut(auth);

  const refreshUser = async (user) => {
    if (!user) { setCurrentUser(null); return; }
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setCurrentUser({ ...user, ...userDoc.data() });
      } else {
        setCurrentUser(user);
      }
    } catch {
      setCurrentUser(user);
    }
  };

  const register = async ({ email, password, fullName, role, territory }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: fullName });
    const userData = {
      fullName,
      role,
      territory,
      region: 'North America',
      email,
      notificationsEnabled: false,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", cred.user.uid), userData);
    setCurrentUser({ ...cred.user, ...userData });
    return cred.user;
  };

  const updateUserData = async (uid, data) => {
    await setDoc(doc(db, "users", uid), data, { merge: true });
    await refreshUser(auth.currentUser);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      await refreshUser(user);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, logout, register, updateUserData, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
