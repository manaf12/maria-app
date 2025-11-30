// src/auth/AuthContext.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import axiosClient, { setAccessToken } from "../api/axiosClient";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  locale: "en" | "fr" | "de";
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setPendingLogin] = useState<boolean>(false);

  // 1) أول ما يفتح الموقع: حمّل التوكن من localStorage وجيب /api/auth/me
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("accessToken");
        console.log("TOKEN ON LOAD:", token);

        if (!token) {
          console.log("no token found");
          setUser(null);
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

  // helper: يلقط أي شكل للتوكن من response ويحفظه
  const storeTokenFromResponse = (res: any) => {
    console.log("STORE TOKEN FN INPUT:", res.data);
    const token =
      res?.data?.accessToken ||
      res?.data?.token ||
      res?.data?.jwt ||
      null;

    if (!token) {
      console.warn("NO TOKEN FOUND IN RESPONSE");
      return null;
    }
    localStorage.setItem("accessToken", token);
    setAccessToken(token); // هذا يكتب في localStorage
    console.log("Token saved:", token);
    return token;
  };

  // 2) Login
  const login = async (email: string, password: string) => {
    try {
      const res = await axiosClient.post("auth/login", { email, password });
      const token = storeTokenFromResponse(res);
      // إمّا تستعمل helper:
 if (token) {
      // بما أننا حصلنا على توكن، نستدعي دالة refreshMe لجلب بيانات المستخدم
      await refreshMe(); // refreshMe تستدعي 'auth/me' وتضبط setUser
    } else {
      // إذا لم يتم العثور على توكن، فهناك مشكلة
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

  // 3) Verify OTP (للـ login)
  const verifyOtp = async (otp: string) => {
    const res = await axiosClient.post("auth/verify-otp", { otp });
    storeTokenFromResponse(res);
    setUser(res.data.user);
    setPendingLogin(false);
  };

  // 4) Signup
  const registerUser = async (payload: SignupPayload) => {
    const res = await axiosClient.post("auth/register", payload);

    if (res.data?.status === "OTP_SENT") {
      return "OTP_SENT";
    }

    if (res.data?.user) {
      // في حال ما كان في OTP
      storeTokenFromResponse(res);
      setUser(res.data.user);
      return "OK";
    }

    return "OK";
  };

  // 5) Verify OTP للـ signup
  const verifySignupOtp = async (email: string, otp: string) => {
    const res = await axiosClient.post("auth/verify-signup-otp", {
      email,
      otp,
    });
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
      // حتى لو فشل، امسح التوكن لوكلي
    }
    setAccessToken(null);
    setUser(null);
  };

  const refreshMe = async () => {
    const res = await axiosClient.get("auth/me");
    setUser(res.data.user);
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



// /* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable react-refresh/only-export-components */
// import { createContext, useContext, useEffect, useState } from "react";
// import axiosClient, { ensureCsrf } from "../api/axiosClient";

// type User = {
//   id: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   locale: "en" | "fr" | "de";
//   twoFactorEnabled?: boolean;
//   emailVerified?: boolean;
//   streetAddress?: string;
//   postalCode?: string;
//   city?: string;
// };

// type SignupPayload = {
//   firstName: string;
//   lastName: string;
//   streetAddress: string;
//   postalCode: string;
//   city: string;
//   email: string;
//   password: string;
//   locale?: "en" | "fr" | "de";
// };

// type AuthContextType = {
//   user: User | null;
//   loading: boolean;
//   login: (email: string, password: string) => Promise<"OK" | "OTP_REQUIRED">;
//   verifyOtp: (otp: string) => Promise<void>;
//   registerUser: (payload: SignupPayload) => Promise<"OTP_SENT" | "OK">;
//   verifySignupOtp: (email: string, otp: string) => Promise<void>;
//   resendSignupOtp: (email: string) => Promise<void>;
//   logout: () => Promise<void>;
//   refreshMe: () => Promise<void>;
// };

// const AuthContext = createContext<AuthContextType>({} as any);
// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [, setPendingLogin] = useState<boolean>(false); // when OTP required

//   useEffect(() => {
//     // on first load, try to fetch session
//     (async () => {
//       try {
//         await ensureCsrf();
//         const res = await axiosClient.get("/api/auth/me");
//         setUser(res.data.user);
//       } catch {
//         setUser(null);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   const login = async (email: string, password: string) => {
//     await ensureCsrf();
//     try {
//       const res = await axiosClient.post("/api/auth/login", { email, password });
//       setUser(res.data.user);
//       setPendingLogin(false);
//       return "OK";
//     } catch (err: any) {
//       if (err?.response?.data?.error === "OTP_REQUIRED") {
//         setPendingLogin(true);
//         return "OTP_REQUIRED";
//       }
//       throw err;
//     }
//   };

//   const verifyOtp = async (otp: string) => {
//     await ensureCsrf();
//     const res = await axiosClient.post("/api/auth/verify-otp", { otp });
//     setUser(res.data.user);
//     setPendingLogin(false);
//   };

//   const registerUser = async (payload: SignupPayload) => {
//     await ensureCsrf();
//     const res = await axiosClient.post("/api/auth/register", payload);

//     if (res.data?.status === "OTP_SENT") {
 
//       return "OTP_SENT";
//     }

//     if (res.data?.user) {
//       setUser(res.data.user);
//       return "OK";
//     }

//     return "OK";
//   };

//   const verifySignupOtp = async (email: string, otp: string) => {
//     await ensureCsrf();
//     const res = await axiosClient.post("/api/auth/verify-signup-otp", { email, otp });
//     setUser(res.data.user);
//   };

//   const resendSignupOtp = async (email: string) => {
//     await ensureCsrf();
//     await axiosClient.post("/api/auth/resend-signup-otp", { email });
//   };

//   const logout = async () => {
//     await ensureCsrf();
//     await axiosClient.post("/api/auth/logout");
//     setUser(null);
//   };

//   const refreshMe = async () => {
//     const res = await axiosClient.get("/api/auth/me");
//     setUser(res.data.user);
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         loading,
//         login,
//         verifyOtp,
//         registerUser,
//         verifySignupOtp,
//         resendSignupOtp,
//         logout,
//         refreshMe,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };
