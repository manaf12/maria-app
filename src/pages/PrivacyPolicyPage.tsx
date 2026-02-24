import { useTranslation } from "react-i18next";

type Section = { title: string; body: string[] };

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  const sections = t("legal.privacy.sections", { returnObjects: true }) as Section[];

  return (
    <div className="legal-page">
      <div className="legal-card">
        <header className="legal-header">
          <h1 className="legal-title">{t("legal.privacy.title")}</h1>
          <p className="legal-updated">{t("legal.lastUpdated", { date: t("legal.privacy.lastUpdated") })}</p>
        </header>

        <div className="legal-content">
          {sections.map((s, idx) => (
            <section key={idx} className="legal-section">
              <h2 className="legal-h2">
                {idx + 1}. {s.title}
              </h2>
              {s.body.map((p, pIdx) => (
                <p key={pIdx} className="legal-p">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
