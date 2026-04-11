import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "../services/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        setToken(idToken);
        setCurrentUser(user);

        // Let's assume user role is default "user", authority might be decoded later
        // from custom claims or fetched from firestore via an endpoint if needed.
        // For simplicity, local state defaults to user.
        setRole("user");
      } else {
        setToken(null);
        setCurrentUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Ensure token is fresh when calling APIs
  const getFreshToken = async () => {
    if (currentUser) {
      return await currentUser.getIdToken(true);
    }
    return null;
  };

  const login = async ({ email, password }) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    setToken(idToken);
    return { user: userCredential.user, role: "user" };
  };

  const signup = async ({ fullname, email, password }) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    setToken(idToken);

    // In a real app we might update profile with fullname or write to Firestore users collection
    // The backend `get_current_user` dependency will auto-create the user document in Firestore on first request.
    return { user: userCredential.user, role: "user" };
  };

  const logout = () => {
    return signOut(auth);
  };

  const mockLogin = () => {
    // Deprecated
  }

  const value = useMemo(
    () => ({
      currentUser,
      token,
      getFreshToken,
      role,
      loading,
      isAuthenticated: Boolean(currentUser),
      login,
      signup,
      logout,
      mockLogin
    }),
    [currentUser, token, role, loading]
  );

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
