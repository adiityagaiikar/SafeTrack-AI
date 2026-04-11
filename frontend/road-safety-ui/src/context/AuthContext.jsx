import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "../services/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);

  const resolveProfile = async (firebaseUser) => {
    const email = firebaseUser.email || "";
    const fallbackIsAdmin = email.toLowerCase() === "admin@roadsafety.local";

    const resolvedName = firebaseUser.displayName || email.split("@")[0] || "User";

    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      const profile = userSnap.exists() ? userSnap.data() : {};
      const resolvedRole = profile.role || (fallbackIsAdmin ? "admin" : "user");

      if (!userSnap.exists()) {
        await setDoc(
          userRef,
          {
            fullname: resolvedName,
            email,
            role: resolvedRole,
            is_admin: resolvedRole === "admin",
            contacts: [],
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else if (profile.role !== resolvedRole || profile.fullname !== resolvedName) {
        await setDoc(
          userRef,
          {
            fullname: resolvedName,
            email,
            role: resolvedRole,
            is_admin: resolvedRole === "admin",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      return {
        uid: firebaseUser.uid,
        email,
        fullname: profile.fullname || resolvedName,
        role: resolvedRole,
        is_admin: resolvedRole === "admin",
        contacts: profile.contacts || [],
      };
    } catch (error) {
      console.warn("Failed to load Firestore profile, using fallback auth profile:", error);
      return {
        uid: firebaseUser.uid,
        email,
        fullname: resolvedName,
        role: fallbackIsAdmin ? "admin" : "user",
        is_admin: fallbackIsAdmin,
        contacts: [],
      };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const idToken = await user.getIdToken();
          const profile = await resolveProfile(user);
          setToken(idToken);
          setCurrentUser(user);
          setUser(profile);
          setRole(profile.role || "user");
        } else {
          setToken(null);
          setCurrentUser(null);
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Auth state resolution failed:", error);
        setToken(null);
        setCurrentUser(null);
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
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
    const profile = await resolveProfile(userCredential.user);
    setToken(idToken);
    setCurrentUser(userCredential.user);
    setUser(profile);
    setRole(profile.role || "user");
    return { user: profile, role: profile.role || "user" };
  };

  const signup = async ({ fullname, email, password }) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    const profile = await resolveProfile(userCredential.user);
    setToken(idToken);
    setCurrentUser(userCredential.user);
    setUser({ ...profile, fullname: fullname || profile.fullname });
    setRole(profile.role || "user");

    // In a real app we might update profile with fullname or write to Firestore users collection
    // The backend `get_current_user` dependency will auto-create the user document in Firestore on first request.
    return { user: { ...profile, fullname: fullname || profile.fullname }, role: profile.role || "user" };
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
      user,
      token,
      getFreshToken,
      role,
      loading,
      isAuthenticated: Boolean(currentUser),
      isAdmin: role === "admin" || user?.is_admin === true,
      login,
      signup,
      logout,
      mockLogin
    }),
    [currentUser, user, token, role, loading]
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
