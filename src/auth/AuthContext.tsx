// ==============================
// src/auth/AuthContext.tsx
// FINAL – stable & production-safe
// ==============================
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useState } from "react";
import axiosClient, { setAccessToken } from "../api/axiosClient";

type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  locale?: "en" | "fr" | "de";
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
  roles?: string[];
};

type SignupPayload = {
  firstName: string;
  lastName: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  email: string;
  password: string;
  locale?: "en" | "fr" | "de";
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<"OK" | "OTP_REQUIRED">;
  verifyOtp: (otp: string) => Promise<void>;
  registerUser: (payload: SignupPayload) => Promise<"OTP_SENT" | "OK">;
  verifySignupOtp: (email: string, otp: string) => Promise<void>;
  resendSignupOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as any);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingLogin, setPendingLogin] = useState(false);

  // ==============================
  // Init: restore session safely
  // ==============================
  useEffect(() => {
    let isMounted = true;

    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          setAccessToken(null);
          if (isMounted) setUser(null);
          return;
        }

        setAccessToken(token);

        const res = await axiosClient.get("auth/me", {
          headers: { "Cache-Control": "no-cache" },
        });

        if (isMounted) {
          setUser(res.data.user ?? null);
        }
      } catch (err) {
        console.error("Auth init failed:", err);
        setAccessToken(null);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // ==============================
  // Helpers
  // ==============================
  const storeTokenFromResponse = (res: any): string | null => {
    const token =
      res?.data?.accessToken ||
      res?.data?.token ||
      res?.data?.jwt ||
      null;

    if (!token) {
      console.warn("Auth: no token found in response");
      return null;
    }

    setAccessToken(token);
    return token;
  };

  const refreshMe = async () => {
    const res = await axiosClient.get("auth/me", {
      headers: { "Cache-Control": "no-cache" },
    });
    setUser(res.data.user ?? null);
  };

  // ==============================
  // Login
  // ==============================
  const login = async (
    email: string,
    password: string
  ): Promise<"OK" | "OTP_REQUIRED"> => {
    try {
      const res = await axiosClient.post("auth/login", { email, password });

      const token = storeTokenFromResponse(res);
      if (!token) {
        throw new Error("Login succeeded but no token returned");
      }

      await refreshMe();
      setPendingLogin(false);

      return "OK";
    } catch (err: any) {
      if (err?.response?.data?.error === "OTP_REQUIRED") {
        setPendingLogin(true);
        return "OTP_REQUIRED";
      }
      throw err;
    }
  };

  // ==============================
  // OTP verification
  // ==============================
  const verifyOtp = async (otp: string) => {
    const res = await axiosClient.post("auth/verify-otp", { otp });
    storeTokenFromResponse(res);
    setUser(res.data.user ?? null);
    setPendingLogin(false);
  };

  // ==============================
  // Registration
  // ==============================
  const registerUser = async (
    payload: SignupPayload
  ): Promise<"OTP_SENT" | "OK"> => {
    const res = await axiosClient.post("auth/register", payload);

    if (res.data?.status === "OTP_SENT") return "OTP_SENT";

    if (res.data?.user) {
      storeTokenFromResponse(res);
      setUser(res.data.user);
    }

    return "OK";
  };

  const verifySignupOtp = async (email: string, otp: string) => {
    const res = await axiosClient.post("auth/verify-signup-otp", {
      email,
      otp,
    });
    storeTokenFromResponse(res);
    setUser(res.data.user ?? null);
  };

  const resendSignupOtp = async (email: string) => {
    await axiosClient.post("auth/resend-signup-otp", { email });
  };

  // ==============================
  // Logout (hard reset)
  // ==============================
  const logout = async () => {
    try {
      await axiosClient.post("auth/logout");
    } catch {
      // ignore backend failure
    } finally {
      setAccessToken(null);
      setUser(null);
      setPendingLogin(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        verifyOtp,
        registerUser,
        verifySignupOtp,
        resendSignupOtp,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
