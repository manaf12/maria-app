import { useForm } from "react-hook-form";
import TextField from "../components/TextField";
import { useTranslation } from "react-i18next";
import axiosClient from "../api/axiosClient";
// import axiosClient, { ensureCsrf } from "../api/axiosClient";
type FormData = {
  email: string;
};

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { 
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
   } = useForm<FormData>();
  
   const onSubmit = async ({ email }: FormData) => {
    try {
      // await ensureCsrf();
      await axiosClient.post("/api/auth/forgot-password", { email });
      alert(t("auth.forgot.success"));
    } catch (e: any){
      alert(e?.response?.data?.error ?? t("auth.forgot.error"));
    }
  };
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>{t("auth.forgot.title")}</h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            label={t("auth.forgot.email")}
            type="email"
            autoComplete="email"
            {...register("email", { required: true })}
            error={errors.email?.message} />

          <button className="primary" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? t("auth.forgot.loading")
              : t("auth.forgot.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
