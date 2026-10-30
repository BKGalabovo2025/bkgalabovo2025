"use client";

import type { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface AuthContextType {
  user: User | null;
  idToken: string | null;
  loading: boolean;
  logout: () => Promise<void>;
  getFreshToken: (force?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  idToken: null,
  loading: true,
  logout: async () => {},
  getFreshToken: async () => null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Optimization: avoid booting Firebase Auth when no stored auth session exists in browser
    let hasStoredAuth = false;
    try {
      hasStoredAuth =
        localStorage.getItem("firebase:hasAuth") === "1" ||
        Object.keys(localStorage).some((k) =>
          k.startsWith("firebase:authUser")
        ) ||
        (typeof document !== "undefined" &&
          document.cookie.includes("session="));
    } catch {
      // Ignore storage restrictions
    }

    if (!hasStoredAuth) {
      setUser(null);
      setIdToken(null);
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};
    let refreshInterval: ReturnType<typeof setInterval> | null = null;
    let isMounted = true;

    // Dynamically import Firebase Auth only when authenticated or on protected routes
    Promise.all([import("@/lib/firebase"), import("firebase/auth")])
      .then(([{ getFirebaseAuth }, { onIdTokenChanged }]) => {
        if (!isMounted) return;
        const auth = getFirebaseAuth();

        unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
          if (!isMounted) return;
          if (currentUser) {
            try {
              const token = await currentUser.getIdToken();
              setUser(currentUser);
              setIdToken(token);
            } catch (error) {
              console.warn(
                "Failed to retrieve ID token (network issue):",
                error
              );
              setUser(currentUser);
            }
          } else {
            setUser(null);
            setIdToken(null);
          }
          setLoading(false);
        });

        refreshInterval = setInterval(
          async () => {
            const current = auth.currentUser;
            if (current) {
              try {
                if (typeof navigator !== "undefined" && !navigator.onLine) {
                  return;
                }
                const token = await current.getIdToken(true);
                if (isMounted) setIdToken(token);
              } catch (error) {
                const err = error as { code?: string; message?: string } | null;
                if (
                  err?.code !== "auth/network-request-failed" &&
                  !err?.message?.includes("network-request-failed")
                ) {
                  console.warn("Token refresh check:", error);
                }
              }
            }
          },
          10 * 60 * 1000
        );
      })
      .catch((err) => {
        console.error("Failed to load Firebase Auth module:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      unsubscribe();
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      try {
        localStorage.removeItem("firebase:hasAuth");
      } catch {
        // Ignore storage restrictions
      }
      const [{ getFirebaseAuth }, { signOut: firebaseSignOut }] =
        await Promise.all([import("@/lib/firebase"), import("firebase/auth")]);
      const auth = getFirebaseAuth();
      await fetch("/api/auth/logout", { method: "POST" });
      await firebaseSignOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  }, [router]);

  const getFreshToken = useCallback(async (force = false) => {
    try {
      const { getFirebaseAuth } = await import("@/lib/firebase");
      const auth = getFirebaseAuth();
      if (!auth.currentUser) return null;
      const token = await auth.currentUser.getIdToken(force);
      setIdToken(token);
      return token;
    } catch (error) {
      console.error("Error getting fresh token:", error);
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({ user, idToken, loading, logout, getFreshToken }),
    [user, idToken, loading, logout, getFreshToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
