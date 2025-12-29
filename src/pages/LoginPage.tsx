/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useForm } from "react-hook-form";
import TextField from "../components/TextField";
import PasswordField from "../components/PasswordField";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles.css";
import { useTranslation } from "react-i18next";
import axiosClient from "../api/axiosClient";

type FormData = { email: string; password: string };

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const location = useLocation() as {
    state?: { redirectTo?: string; fromAuth?: string };
  };

  const redirectTo = location.state?.redirectTo ?? "/";
  const fromAuth = location.state?.fromAuth;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const [otpStep, setOtpStep] = useState(false);
  const afterLogin = async (): Promise<boolean> => {
    const token = localStorage.getItem("anonymousToken");

    if (!token) {
      return false;   
    }

    try {
      const res = await axiosClient.post("/questionnaire/claim-anonymous", {
        token,
      });
      const { questionnaireId, declarationId } = res.data;

      if (questionnaireId) {
        localStorage.setItem("questionnaireId", questionnaireId);
      }
      if (declarationId) {
        localStorage.setItem("anonymousDeclarationId", declarationId);
      }
      localStorage.removeItem("anonymousToken");
      return true;
    } catch (err) {
      console.error("Claim anonymous failed", err);
      return false;
    }
  };
  const onSubmit = async (data: FormData) => {
    try {
      const status = await login(data.email, data.password);

      if (status === "OTP_REQUIRED") {
        setOtpStep(true);
      } else {
        const claimed = await afterLogin();
        if (claimed) {
          navigate("/product", { state: { fromAuth: true } });
        } else {
          navigate(redirectTo, {
            replace: true,
            state: fromAuth ? { fromAuth } : undefined,
          });
        }
      }
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Login failed");
    }
  };

  if (otpStep) {
    return (
      <OtpStep
        onDone={async () => {
          const claimed = await afterLogin();
          if (claimed) {
            navigate("/product", { state: { fromAuth: true } });
          } else {
            navigate(redirectTo, { replace: true });
          }
        }}
      />
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>{t("auth.login.title")}</h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            label={t("auth.login.email")}
            type="email"
            autoComplete="email"
            autoFocus
            {...register("email", { required: "Required" })}
            error={errors.email?.message}
          />

          <PasswordField
            label={t("auth.login.password")}
            autoComplete="current-password"
            {...register("password", { required: "Required" })}
            error={errors.password?.message}
          />

          <button className="primary" disabled={isSubmitting} type="submit">
            {t("auth.login.submit")}
          </button>
        </form>

        <div className="auth-links">
          <Link className="link" to="/forgot-password">
            {t("auth.login.forgot")}
          </Link>
          <p className="muted" style={{ marginTop: 8 }}>
            {t("auth.login.noAccount")}{" "}
            <Link className="link" to="/signup">
              {t("auth.login.signup")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function OtpStep({ onDone }: { onDone: () => void }) {
  const { verifyOtp } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<{ otp: string }>();

  const submit = async ({ otp }: { otp: string }) => {
    try {
      await verifyOtp(otp);
      await onDone();
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Invalid code");
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Two-factor code</h1>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <TextField
            label="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            {...register("otp", { required: true })}
          />
          <button className="primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}
