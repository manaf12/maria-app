// src/pages/DashboardPage.tsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../auth/AuthContext";
import TaxDeclarationCard from "../components/TaxDeclarationCard";
import type { TaxDeclarationFull  } from "../types/types";

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [declarations, setDeclarations] = useState<TaxDeclarationFull []>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await axiosClient.get("/orders/my-declarations");
        const items = (res.data as TaxDeclarationFull [])
          .slice()
          .sort((a, b) => b.taxYear - a.taxYear);
        setDeclarations(items);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user]);

  const handleNewDeclaration = () => {
    localStorage.removeItem("taxonline_quote_draft");
    navigate("/product");
  };

  return (
    <div className="dashboard-page">
      {/* HEADER */}
      <header className="dashboard-header">
        <div>
          <h1>{t("dashboard.title")}</h1>
          <p className="dashboard-subtitle">
            {t("dashboard.subtitle")}
          </p>
        </div>

        <button
          type="button"
          className="dashboard-new-btn"
          onClick={handleNewDeclaration}
        >
          {t("dashboard.newDeclaration")}
        </button>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h2>{t("dashboard.myDeclarations")}</h2>
            <Link className="dashboard-help-link" to="/faq">
              {t("dashboard.helpLink")}
            </Link>
          </div>

          {isLoading && (
            <p className="muted">{t("dashboard.loading")}</p>
          )}

          {!isLoading && declarations.length === 0 && (
            <div className="empty-state">
              <p className="muted">{t("dashboard.empty")}</p>
              <button
                type="button"
                className="dashboard-empty-btn"
                onClick={handleNewDeclaration}
              >
                {t("dashboard.startFirst")}
              </button>
            </div>
          )}

          <div className="declarations-list">
            {declarations.map((decl) => (
              <TaxDeclarationCard
                key={decl.id}
                declaration={decl}
                onActionClick={(d) =>
                  navigate(`/declarations/${d.id}`)
                }
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
