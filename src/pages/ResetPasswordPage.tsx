import { useForm } from "react-hook-form";
import PasswordField from "../components/PasswordField";
import axiosClient from "../api/axiosClient";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const nav = useNavigate();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<{ newPassword: string }>();

  const onSubmit = async ({ newPassword }: { newPassword: string }) => {
    try {
      await axiosClient.post("/auth/reset-password", {
        token,
        newPassword,
      });

      alert(t("auth.reset_success"));
      nav("/login");
    } catch {
      alert(t("auth.reset_failed"));
    }
  };

  return (
    <div className="auth-card">
      <h1>{t("auth.reset_title")}</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <PasswordField
          label={t("auth.new_password")}
          {...register("newPassword", {
            required: true,
            minLength: 8,
          })}
        />

        <button className="primary" disabled={isSubmitting} type="submit">
          {t("auth.update_password")}
        </button>
      </form>
    </div>
  );
}