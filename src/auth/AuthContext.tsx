// ==============================
// src/auth/AuthContext.tsx
// (Updated init loading logic + consistent token handling)
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
  const [, setPendingLogin] = useState<boolean>(false);

  // Init: load token then /auth/me
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setUser(null);
          setAccessToken(null);
          return;
        }

        setAccessToken(token);
        const res = await axiosClient.get("auth/me");
        setUser(res.data.user);
      } catch (e) {
        console.error(e);
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const storeTokenFromResponse = (res: any) => {
    const token =
      res?.data?.accessToken || res?.data?.token || res?.data?.jwt || null;

    if (!token) {
      console.warn("NO TOKEN FOUND IN RESPONSE");
      return null;
    }

    setAccessToken(token); // writes localStorage + memory
    return token;
  };

  const refreshMe = async () => {
    const res = await axiosClient.get("auth/me");
    setUser(res.data.user);
  };

  // Login
  const login = async (email: string, password: string) => {
    try {
      const res = await axiosClient.post("auth/login", { email, password });

      const token = storeTokenFromResponse(res);
      if (token) {
        await refreshMe();
      } else {
        throw new Error("Login successful but no token received.");
      }

      return "OK";
    } catch (err: any) {
      if (err?.response?.data?.error === "OTP_REQUIRED") {
        setPendingLogin(true);
        return "OTP_REQUIRED";
      }
      throw err;
    }
  };

  const verifyOtp = async (otp: string) => {
    const res = await axiosClient.post("auth/verify-otp", { otp });
    storeTokenFromResponse(res);
    setUser(res.data.user);
    setPendingLogin(false);
  };

  const registerUser = async (payload: SignupPayload) => {
    const res = await axiosClient.post("auth/register", payload);

    if (res.data?.status === "OTP_SENT") return "OTP_SENT";

    if (res.data?.user) {
      storeTokenFromResponse(res);
      setUser(res.data.user);
      return "OK";
    }

    return "OK";
  };

  const verifySignupOtp = async (email: string, otp: string) => {
    const res = await axiosClient.post("auth/verify-signup-otp", { email, otp });
    storeTokenFromResponse(res);
    setUser(res.data.user);
  };

  const resendSignupOtp = async (email: string) => {
    await axiosClient.post("auth/resend-signup-otp", { email });
  };

  const logout = async () => {
    try {
      await axiosClient.post("auth/logout");
    } catch {
      // ignore
    } finally {
      setAccessToken(null); // removes localStorage + memory
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