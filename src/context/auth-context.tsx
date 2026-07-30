"use client";

import {
  onIdTokenChanged,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { Loader2 } from "lucide-react";
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

import { getFirebaseAuth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  idToken: string | null; // Added idToken
  loading: boolean;
  logout: () => Promise<void>;
  getFreshToken: (force?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  idToken: null, // Added idToken
  loading: true,
  logout: async () => {},
  getFreshToken: async () => null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null); // Added idToken state
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Only initialize Firebase Auth on the client side
    const auth = getFirebaseAuth();
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setUser(user);
        setIdToken(token);
      } else {
        setUser(null);
        setIdToken(null);
      }
      setLoading(false);
    });

    // Periodically refresh the token every 10 minutes to ensure it's always valid
    const refreshInterval = setInterval(
      async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            if (typeof navigator !== "undefined" && !navigator.onLine) {
              return; // Skip refresh if explicitly offline
            }
            const token = await currentUser.getIdToken(true);
            setIdToken(token);
          } catch (error) {
            const err = error as { code?: string; message?: string } | null;
            if (
              err?.code === "auth/network-request-failed" ||
              err?.message?.includes("network-request-failed")
            ) {
              console.warn(
                "Skipping token refresh due to network disconnection."
              );
            } else {
              console.error("Token refresh failed:", error);
            }
          }
        }
      },
      10 * 60 * 1000
    );

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      await fetch("/api/auth/logout", { method: "POST" });
      await firebaseSignOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  }, [router]);

  const getFreshToken = useCallback(async (force = false) => {
    const auth = getFirebaseAuth();
    if (!auth.currentUser) return null;
    try {
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Аутентикация...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
