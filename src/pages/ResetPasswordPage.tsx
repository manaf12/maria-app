import { useForm } from "react-hook-form";
import PasswordField from "../components/PasswordField";
import axiosClient from "../api/axiosClient";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const nav = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting } } =
    useForm<{ newPassword: string }>();

  const onSubmit = async ({ newPassword }: { newPassword: string }) => {
    try {
      await axiosClient.post("/api/auth/reset-password", { token, newPassword });
      alert("Password updated. Please login.");
      nav("/login");
    } catch {
      alert("Reset failed.");
    }
  };

  return (
    <div className="auth-card">
      <h1>Reset password</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <PasswordField label="New password" {...register("newPassword", { required: true, minLength: 8 })} />
        <button disabled={isSubmitting} type="submit">Update password</button>
      </form>
    </div>
  );
}
