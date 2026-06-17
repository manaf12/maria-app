import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="stage1-card" style={{ maxWidth: 600, margin: "32px auto" }}>
      <div className="stage1-confirm-row">
        <div className="stage1-confirm-info">
          <h1 className="stage1-title" style={{ marginBottom: 4 }}>
            {t("dashboard.welcome")}, {user?.firstName}
          </h1>
          <p className="stage1-subtitle">
            {t("dashboard.email")}: {user?.email}
          </p>
        </div>

        <button
          type="button"
          className="confirm-step-btn"
          onClick={logout}
        >
          {t("dashboard.logout")}
        </button>
      </div>
    </div>
  );
}
