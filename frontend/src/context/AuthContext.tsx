"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import type { AuthResponse, User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const COOKIE_EXPIRY_DAYS = 7;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadCurrentUser = useCallback(async () => {
    const token = Cookies.get(AUTH_COOKIE_NAME);
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await apiFetch<User>("/auth/me", { token });
      setUser(currentUser);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        Cookies.remove(AUTH_COOKIE_NAME);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCurrentUser();
  }, [loadCurrentUser]);

  const applyAuthResponse = useCallback((response: AuthResponse) => {
    Cookies.set(AUTH_COOKIE_NAME, response.accessToken, {
      expires: COOKIE_EXPIRY_DAYS,
      sameSite: "lax",
    });
    setUser(response.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      applyAuthResponse(response);
    },
    [applyAuthResponse]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const response = await apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: { name, email, password },
      });
      applyAuthResponse(response);
    },
    [applyAuthResponse]
  );

  const logout = useCallback(() => {
    Cookies.remove(AUTH_COOKIE_NAME);
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
