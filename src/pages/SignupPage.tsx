// src/pages/SignupPage.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import TextField from "../components/TextField";
import PasswordField from "../components/PasswordField";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

type FormData = {
  firstName: string;
  lastName: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
};

const passwordPattern =
  /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&\-_#.^]{8,}$/;

export default function SignupPage() {
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const location = useLocation() as {
    state?: { redirectTo?: string; fromAuth?: string };
  };
  const redirectTo = location.state?.redirectTo ?? "/dashboard";
  const fromAuth = location.state?.fromAuth;

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: { terms: false },
  });

  const terms = watch("terms");
  const [stage, setStage] = useState<"form" | "verify">("form");
  const email = watch("email");
  const pwd = watch("password");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function getStrength(pwd?: string) {
    if (!pwd) return { score: 0, label: "—" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const labels = ["weak", "fair", "good", "strong"];
    return { score, label: labels[Math.min(score, labels.length) - 1] || "weak" };
  }
  function VerifySignupStep({
  email,
  onSuccess,
  onBack,
}: {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const { verifySignupOtp, resendSignupOtp } = useAuth();
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<{ otp: string }>();
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    setSeconds(60);
  }, [email]);

  useEffect(() => {
    if (seconds <= 0) return;
    const tmr = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(tmr);
  }, [seconds]);

  const submit = async ({ otp }: { otp: string }) => {
    try {
      await verifySignupOtp(email, otp);
      onSuccess();
    } catch (e: any) {
      alert(e?.response?.data?.error ?? t("auth.signup.errors.invalidCode"));
    }
  };

  const resend = async () => {
    try {
      await resendSignupOtp(email);
      setSeconds(60);
    } catch (e: any) {
      alert(e?.response?.data?.error ?? t("auth.signup.errors.failed"));
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>{t("auth.signup.verifyTitle")}</h1>
        <p className="muted">
          {t("auth.signup.verifyMsg")} <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit(submit)} noValidate>
          <TextField
            label={t("auth.signup.code")}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            {...register("otp", { required: true })}
          />

          <button className="primary" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? t("auth.signup.verifying")
              : t("auth.signup.verify")}
          </button>
        </form>

        <div className="verify-actions">
          <button className="link-like" onClick={onBack}>
            {t("auth.signup.changeEmail")}
          </button>
          <span className="muted">•</span>
          <button
            className="link-like"
            onClick={resend}
            disabled={seconds > 0}
          >
            {seconds > 0
              ? `${t("auth.signup.resendIn")} ${seconds}s`
              : t("auth.signup.resend")}
          </button>
        </div>
      </div>

      <p className="muted">
        {t("auth.signup.haveAccount")}{" "}
        <Link className="link" to="/login">
          {t("auth.signup.signin")}
        </Link>
      </p>
    </div>
  );
}


  const onSubmit = async (data: FormData) => {
    if (data.password !== data.confirmPassword) {
      setError("confirmPassword", { message: t("auth.signup.errors.match") });
      return;
    }

    try {
      // نحدد locale افتراضي بناءً على لغة الـ UI
      const locale: "en" | "fr" | "de" =
        i18n.language.startsWith("fr")
          ? "fr"
          : i18n.language.startsWith("de")
          ? "de"
          : "en";

      const payload = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        streetAddress: data.streetAddress,
        postalCode: data.postalCode,
        city: data.city,
        locale,
      };
      
      

      const res = await registerUser(payload);
      if (res === "OTP_SENT") {
        setStage("verify");
      } else {
        setSuccessMsg(t("auth.signup.successMsg"));
        setTimeout(() => {
          navigate(redirectTo, {
            replace: true,
            state: fromAuth ? { fromAuth } : undefined,
          });
        }, 1500);
      }
    } catch (e: any) {
      alert(e?.response?.data?.error ?? t("auth.signup.errors.failed"));
    }
  };

  if (stage === "verify") {
    return (
      <div className="auth-wrap">
        {successMsg && (
          <div className="toast-success">
            {successMsg}
          </div>
        )}
      <VerifySignupStep
        email={email}
        onSuccess={() => {
          setSuccessMsg(t("auth.signup.successMsg"));
          setTimeout(() => {
            navigate(redirectTo, {
              replace: true,
              state: fromAuth ? { fromAuth } : undefined,
            });
          }, 1500);
        }}
        onBack={() => setStage("form")}
      />
    </div>
  );
 }

  return (
    <div className="auth-wrap">
      {successMsg && (
        <div className="toast-success">
          {successMsg}
        </div>
      )}
      <div className="auth-card">
        <h1>{t("auth.signup.title")}</h1>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            label={t("auth.signup.email")}
            type="email"
            autoComplete="email"
            {...register("email", {
              required: "Required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email",
              },
            })}
            error={errors.email?.message}
          />

          <PasswordField
            label={t("auth.signup.password")}
            autoComplete="new-password"
            {...register("password", {
              required: "Required",
              pattern: {
                value: passwordPattern,
                message: t("auth.signup.errors.weak"),
              },
            })}
            error={errors.password?.message}
          />

          <div className="helper muted">
            {t("auth.signup.strength")}: {getStrength(pwd).label}
          </div>

          <PasswordField
            label={t("auth.signup.confirm")}
            autoComplete="new-password"
            {...register("confirmPassword", { required: "Required" })}
            error={errors.confirmPassword?.message}
          />

          <TextField
            label={t("auth.signup.firstName")}
            autoComplete="given-name"
            {...register("firstName", {
              required: "Required",
              minLength: { value: 2, message: "Too short" },
            })}
            error={errors.firstName?.message}
          />

          <TextField
            label={t("auth.signup.lastName")}
            autoComplete="family-name"
            {...register("lastName", {
              required: "Required",
              minLength: { value: 2, message: "Too short" },
            })}
            error={errors.lastName?.message}
          />

          <TextField
            label={t("auth.signup.street")}
            autoComplete="address-line1"
            {...register("streetAddress", {
              required: "Required",
              minLength: { value: 3, message: "Too short" },
            })}
            error={errors.streetAddress?.message}
          />

          <TextField
            label={t("auth.signup.postal")}
            autoComplete="postal-code"
            {...register("postalCode", {
              required: "Required",
              minLength: { value: 3, message: "Too short" },
            })}
            error={errors.postalCode?.message}
          />

          <TextField
            label={t("auth.signup.city")}
            autoComplete="address-level2"
            {...register("city", {
              required: "Required",
              minLength: { value: 2, message: "Too short" },
            })}
            error={errors.city?.message}
          />

          <label className="checkbox-row">
            <input type="checkbox" {...register("terms", { required: true })} />
            <span>{t("auth.signup.terms")}</span>
          </label>
          {errors.terms && (
            <div className="error">
              {t("auth.signup.errors.mustAgree")}
            </div>
          )}

          <button
            className="primary"
            disabled={isSubmitting || !terms || !isValid}
            type="submit"
          >
            {isSubmitting ? t("auth.signup.loading") : t("auth.signup.submit")}
          </button>
        </form>

        <p className="muted">
          {t("auth.signup.haveAccount")}{" "}
          <Link className="link" to="/login">
            {t("auth.signup.signin")}
          </Link>
        </p>
      </div>
    </div>
  );
}

// باقي VerifySignupStep و getStrength نفس ما هو عندك …

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/SignupPage.tsx
// import { useEffect, useState } from "react";
// import { useForm } from "react-hook-form";
// import TextField from "../components/TextField";
// import PasswordField from "../components/PasswordField";
// import { useAuth } from "../auth/AuthContext";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import { useTranslation } from "react-i18next";

// type FormData = {
//   firstName: string;
//   lastName: string;
//   streetAddress: string;
//   postalCode: string;
//   city: string;
//   email: string;
//   password: string;
//   confirmPassword: string;
//   terms: boolean;
// };
// const api = import.meta.env.VITE_API_URL;
// // # const user = axios.post ( api/auth/register)
// const passwordPattern =
//   /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&\-_#.^]{8,}$/;

// export default function SignupPage() {
//   const { registerUser } = useAuth();
//   const navigate = useNavigate();
//   const { t } = useTranslation();

//   // نقرأ redirectTo / fromAuth من الـ state بس من دون أي navigate هون
//   const location = useLocation() as {
//     state?: { redirectTo?: string; fromAuth?: string };
//   };
//   const redirectTo = location.state?.redirectTo ?? "/dashboard";
//   const fromAuth = location.state?.fromAuth;

//   const {
//     register,
//     handleSubmit,
//     watch,
//     setError,
//     formState: { errors, isSubmitting, isValid },
//   } = useForm<FormData>({
//     mode: "onChange",
//     defaultValues: { terms: false },
//   });

//   const terms = watch("terms");
//   const [stage, setStage] = useState<"form" | "verify">("form");
//   const email = watch("email");
//   const pwd = watch("password");

//   const onSubmit = async (data: FormData) => {
//     if (data.password !== data.confirmPassword) {
//       setError("confirmPassword", { message: t("auth.signup.errors.match") });
//       return;
//     }

//     try {
//       const payload = {
//         email: data.email,
//         password: data.password,
//         firstName: data.firstName,
//         lastName: data.lastName,
//         streetAddress: data.streetAddress,
//         postalCode: data.postalCode,
//         city: data.city,
//       };

//       const res = await registerUser(payload);
//       if (res === "OTP_SENT") {
//         // انتقل لمرحلة التحقق بالكود
//         setStage("verify");
//       } else {
//         // تسجيل من دون OTP → رجّع اليوزر للمكان الصح
//         navigate(redirectTo, {
//           replace: true,
//           state: fromAuth ? { fromAuth } : undefined,
//         });
//       }
//     } catch (e: any) {
//       alert(e?.response?.data?.error ?? t("auth.signup.errors.failed"));
//     }
//   };

//   if (stage === "verify") {
//     return (
//       <VerifySignupStep
//         email={email}
//         onSuccess={() =>
//           navigate(redirectTo, {
//             replace: true,
//             state: fromAuth ? { fromAuth } : undefined,
//           })
//         }
//         onBack={() => setStage("form")}
//       />
//     );
//   }

//   return (
//     <div className="auth-wrap">
//       <div className="auth-card">
//         <h1>{t("auth.signup.title")}</h1>
//         <form onSubmit={handleSubmit(onSubmit)} noValidate>
//           {/* Email */}
//           <TextField
//             label={t("auth.signup.email")}
//             type="email"
//             autoComplete="email"
//             {...register("email", {
//               required: "Required",
//               pattern: {
//                 value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
//                 message: "Invalid email",
//               },
//             })}
//             error={errors.email?.message}
//           />

//           {/* Password */}
//           <PasswordField
//             label={t("auth.signup.password")}
//             autoComplete="new-password"
//             {...register("password", {
//               required: "Required",
//               pattern: {
//                 value: passwordPattern,
//                 message: t("auth.signup.errors.weak"),
//               },
//             })}
//             error={errors.password?.message}
//           />

//           <div className="helper muted">
//             {t("auth.signup.strength")}: {getStrength(pwd).label}
//           </div>

//           {/* Confirm password */}
//           <PasswordField
//             label={t("auth.signup.confirm")}
//             autoComplete="new-password"
//             {...register("confirmPassword", { required: "Required" })}
//             error={errors.confirmPassword?.message}
//           />

//           {/* First name */}
//           <TextField
//             label={t("auth.signup.firstName")}
//             autoComplete="given-name"
//             {...register("firstName", {
//               required: "Required",
//               minLength: { value: 2, message: "Too short" },
//             })}
//             error={errors.firstName?.message}
//           />

//           {/* Last name */}
//           <TextField
//             label={t("auth.signup.lastName")}
//             autoComplete="family-name"
//             {...register("lastName", {
//               required: "Required",
//               minLength: { value: 2, message: "Too short" },
//             })}
//             error={errors.lastName?.message}
//           />

//           {/* Street address */}
//           <TextField
//             label={t("auth.signup.street")}
//             autoComplete="address-line1"
//             {...register("streetAddress", {
//               required: "Required",
//               minLength: { value: 3, message: "Too short" },
//             })}
//             error={errors.streetAddress?.message}
//           />

//           {/* Postal code */}
//           <TextField
//             label={t("auth.signup.postal")}
//             autoComplete="postal-code"
//             {...register("postalCode", {
//               required: "Required",
//               minLength: { value: 3, message: "Too short" },
//             })}
//             error={errors.postalCode?.message}
//           />

//           {/* City */}
//           <TextField
//             label={t("auth.signup.city")}
//             autoComplete="address-level2"
//             {...register("city", {
//               required: "Required",
//               minLength: { value: 2, message: "Too short" },
//             })}
//             error={errors.city?.message}
//           />

//           {/* Terms checkbox */}
//           <label className="checkbox-row">
//             <input type="checkbox" {...register("terms", { required: true })} />
//             <span>{t("auth.signup.terms")}</span>
//           </label>
//           {errors.terms && (
//             <div className="error">
//               {t("auth.signup.errors.mustAgree")}
//             </div>
//           )}

//           <button
//             className="primary"
//             disabled={isSubmitting || !terms || !isValid}
//             type="submit"
//           >
//             {isSubmitting ? t("auth.signup.loading") : t("auth.signup.submit")}
//           </button>
//         </form>

//         <p className="muted">
//           {t("auth.signup.haveAccount")}{" "}
//           <Link className="link" to="/login">
//             {t("auth.signup.signin")}
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// }

// function getStrength(pwd?: string) {
//   if (!pwd) return { score: 0, label: "—" };
//   let score = 0;
//   if (pwd.length >= 8) score++;
//   if (/[A-Z]/.test(pwd)) score++;
//   if (/\d/.test(pwd)) score++;
//   if (/[^A-Za-z0-9]/.test(pwd)) score++;
//   const labels = ["weak", "fair", "good", "strong"];
//   return { score, label: labels[Math.min(score, labels.length) - 1] || "weak" };
// }

// export function VerifySignupStep({
//   email,
//   onSuccess,
//   onBack,
// }: {
//   email: string;
//   onSuccess: () => void;
//   onBack: () => void;
// }) {
//   const { verifySignupOtp, resendSignupOtp } = useAuth();
//   const { t } = useTranslation();
//   const {
//     register,
//     handleSubmit,
//     formState: { isSubmitting },
//   } = useForm<{ otp: string }>();
//   const [seconds, setSeconds] = useState(60);

//   useEffect(() => {
//     setSeconds(60);
//   }, [email]);

//   useEffect(() => {
//     if (seconds <= 0) return;
//     const tmr = setTimeout(() => setSeconds((s) => s - 1), 1000);
//     return () => clearTimeout(tmr);
//   }, [seconds]);

//   const submit = async ({ otp }: { otp: string }) => {
//     try {
//       await verifySignupOtp(email, otp);
//       onSuccess();
//     } catch (e: any) {
//       alert(e?.response?.data?.error ?? t("auth.signup.errors.invalidCode"));
//     }
//   };

//   const resend = async () => {
//     try {
//       await resendSignupOtp(email);
//       setSeconds(60);
//     } catch (e: any) {
//       alert(e?.response?.data?.error ?? t("auth.signup.errors.failed"));
//     }
//   };

//   return (
//     <div className="auth-wrap">
//       <div className="auth-card">
//         <h1>{t("auth.signup.verifyTitle")}</h1>
//         <p className="muted">
//           {t("auth.signup.verifyMsg")} <strong>{email}</strong>
//         </p>

//         <form onSubmit={handleSubmit(submit)} noValidate>
//           <TextField
//             label={t("auth.signup.code")}
//             inputMode="numeric"
//             autoComplete="one-time-code"
//             maxLength={6}
//             {...register("otp", { required: true })}
//           />

//           <button className="primary" disabled={isSubmitting} type="submit">
//             {isSubmitting
//               ? t("auth.signup.verifying")
//               : t("auth.signup.verify")}
//           </button>
//         </form>

//         <div className="verify-actions">
//           <button className="link-like" onClick={onBack}>
//             {t("auth.signup.changeEmail")}
//           </button>
//           <span className="muted">•</span>
//           <button
//             className="link-like"
//             onClick={resend}
//             disabled={seconds > 0}
//           >
//             {seconds > 0
//               ? `${t("auth.signup.resendIn")} ${seconds}s`
//               : t("auth.signup.resend")}
//           </button>
//         </div>
//       </div>

//       <p className="muted">
//         {t("auth.signup.haveAccount")}{" "}
//         <Link className="link" to="/login">
//           {t("auth.signup.signin")}
//         </Link>
//       </p>
//     </div>
//   );
// }
