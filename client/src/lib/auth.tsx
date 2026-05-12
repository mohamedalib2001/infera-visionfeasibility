import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { queryClient } from "./queryClient";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  language?: string;
}

interface Subscription {
  plan: string;
  status: string;
  reportsLimit: number;
  reportsUsed: number;
}

interface AuthContextType {
  user: User | null;
  subscription: Subscription | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  setLanguage: (lang: string) => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Set initial RTL direction based on localStorage before auth loads
    const storedLang = localStorage.getItem("lang") || "en";
    document.documentElement.dir = storedLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = storedLang;
    fetchUser();
  }, []);

  useEffect(() => {
    // Update RTL direction when user language changes
    const lang = user?.language || localStorage.getItem("lang") || "en";
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [user?.language]);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSubscription(data.subscription);
      } else {
        setUser(null);
        setSubscription(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await res.json();
    setUser(data.user);
    await fetchUser();
    setLocation("/dashboard");
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Registration failed");
    }

    const data = await res.json();
    setUser(data.user);
    await fetchUser();
    setLocation("/dashboard");
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include',
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    queryClient.clear();
    setUser(null);
    setSubscription(null);
    setLocation("/");
  };

  const refreshAuth = async () => {
    await fetchUser();
  };

  const setLanguage = (lang: string) => {
    if (user) {
      setUser({ ...user, language: lang });
    }
    // Also store in localStorage for unauthenticated state
    localStorage.setItem("lang", lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  return (
    <AuthContext.Provider value={{ user, subscription, isLoading, login, register, logout, setLanguage, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
