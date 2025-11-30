// src/pages/EmailVerificationPage.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../auth/AuthContext";

type VerifyStatus = "idle" | "verifying" | "success" | "error" | "expired";

export default function EmailVerificationPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");

  // إذا وصل المستخدم عبر رابط فيه token → نحاول نتحقق مباشرة
  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        setStatus("verifying");
        setMessage(null);

        await axiosClient.post("/api/auth/verify-email", { token });

        setStatus("success");
        setMessage(t("verifyEmail.verifiedMessage"));

        // بعد ثانيتين نرجع عالـ Dashboard (إذا حابّة خليه بزر بس)
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 2000);
      } catch (e: any) {
        const code = e?.response?.data?.code;
        if (code === "TOKEN_EXPIRED") {
          setStatus("expired");
          setMessage(t("verifyEmail.linkExpired"));
        } else {
          setStatus("error");
          setMessage(
            e?.response?.data?.error ?? t("verifyEmail.invalidLinkMessage")
          );
        }
      }
    };

    verify();
  }, [token, navigate, t]);

  const handleResend = async () => {
    try {
      setIsResending(true);
      setMessage(null);

      await axiosClient.post("/api/auth/resend-verification");

      setMessage(t("verifyEmail.resendSuccess"));
    } catch (e: any) {
      setMessage(
        e?.response?.data?.error ?? t("verifyEmail.resendError")
      );
    } finally {
      setIsResending(false);
    }
  };

  const showResendBlock = !token || status === "expired" || status === "error";

  return (
    <div className="verify-page">
      <div className="verify-card">
        <h1 className="verify-title">{t("verifyEmail.title")}</h1>

        {/* حالة الحساب */}
        <p className="verify-status-line">
          <span className="verify-status-label">
            {t("verifyEmail.statusLabel")}
          </span>
          <span
            className={
              "verify-status-pill " +
              (status === "success" ? "is-success" : "is-pending")
            }
          >
            {status === "success"
              ? t("verifyEmail.statusVerified")
              : t("verifyEmail.statusPending")}
          </span>
        </p>

        {/* الرسالة الأساسية */}
        {!token && (
          <p className="verify-text">
            {t("verifyEmail.instructionsNoToken")}
          </p>
        )}

        {token && status === "verifying" && (
          <p className="verify-text">
            {t("verifyEmail.verifying")}
          </p>
        )}

        {message && (
          <div
            className={
              "verify-alert " +
              (status === "success" ? "verify-alert-success" : "")
            }
          >
            {message}
          </div>
        )}

        {/* بلوك إعادة الإرسال */}
        {showResendBlock && (
          <div className="verify-resend-block">
            <h2 className="verify-resend-title">
              {t("verifyEmail.resendTitle")}
            </h2>
            <p className="verify-text">
              {t("verifyEmail.resendHint")}
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending
                ? t("verifyEmail.resendLoading")
                : t("verifyEmail.resendCta")}
            </button>
          </div>
        )}

        {/* أزرار التنقل */}
        <div className="verify-actions">
          {status === "success" && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/dashboard")}
            >
              {t("verifyEmail.goToDashboard")}
            </button>
          )}

          {!user && (
            <Link to="/login" className="link verify-back-link">
              {t("verifyEmail.backToLogin")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
