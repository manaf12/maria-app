import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <div>
      <h1>
        {t("dashboard.welcome")}, {user?.firstName}
      </h1>

      <p>
        {t("dashboard.email")}: {user?.email}
      </p>

      <button onClick={logout}>
        {t("dashboard.logout")}
      </button>
    </div>
  );
}
