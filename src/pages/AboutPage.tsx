// src/pages/AboutPage.tsx
import { useTranslation } from "react-i18next";

export default function AboutPage() {
  const { t } = useTranslation();

  const teamMembers = [
    {
      key: "founder",
    },
    // {
    //   key: "partner",
    // },
    // {
    //   key: "taxExpert",
    // },
  ];

  const values = ["transparency", "reliability", "confidentiality", "proximity"] as const;

  const commitments = ["security", "hosting", "support"] as const;

  const addressLines = t("about.contact.addressLines", {
    returnObjects: true,
  }) as string[];

  return (
    <div className="about-page">
      {/* Header */}
      <header className="about-header">
        <div>
          <h1>{t("about.title")}</h1>
          <p className="about-subtitle">{t("about.subtitle")}</p>
        </div>
      </header>

      <main className="about-main">
        {/* Company presentation */}
        <section className="about-section">
          <h2 className="about-section-title">{t("about.company.title")}</h2>
          <div className="about-card">
            <p>{t("about.company.text1")}</p>
            <p>{t("about.company.text2")}</p>
          </div>
        </section>

        {/* Mission */}
        <section className="about-section">
          <h2 className="about-section-title">{t("about.mission.title")}</h2>
          <div className="about-card">
            <p>{t("about.mission.text")}</p>
          </div>
        </section>

        {/* Team */}
        <section className="about-section">
          <h2 className="about-section-title">{t("about.team.title")}</h2>
          <div className="about-card">
            <p className="about-section-intro">{t("about.team.intro")}</p>
            <div className="about-team-grid">
              {teamMembers.map((member) => (
                <div key={member.key} className="about-team-member">
                  <div className="about-avatar-placeholder">
                    {t(`about.team.members.${member.key}.initials`)}
                  </div>
                  <div>
                    <div className="about-team-name">
                      {t(`about.team.members.${member.key}.name`)}
                    </div>
                    <div className="about-team-role">
                      {t(`about.team.members.${member.key}.role`)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values & Commitments in two columns */}
        <section className="about-section">
          <div className="about-two-columns">
            {/* Values */}
            <div>
              <h2 className="about-section-title">
                {t("about.values.title")}
              </h2>
              <div className="about-card">
                <p className="about-section-intro">
                  {t("about.values.intro")}
                </p>
                <ul className="about-values-list">
                  {values.map((valueKey) => (
                    <li key={valueKey} className="about-value-item">
                      <div className="about-value-dot" />
                      <div>
                        <div className="about-value-title">
                          {t(`about.values.items.${valueKey}.title`)}
                        </div>
                        <div className="about-value-text">
                          {t(`about.values.items.${valueKey}.text`)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Commitments */}
            <div>
              <h2 className="about-section-title">
                {t("about.commitments.title")}
              </h2>
              <div className="about-card">
                <p className="about-section-intro">
                  {t("about.commitments.intro")}
                </p>
                <ul className="about-commitments-list">
                  {commitments.map((cKey) => (
                    <li key={cKey} className="about-commitment-item">
                      <span className="about-commitment-icon">✓</span>
                      <span>
                        {t(`about.commitments.items.${cKey}.text`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & address */}
        <section className="about-section">
          <h2 className="about-section-title">
            {t("about.contact.title")}
          </h2>
          <div className="about-card about-contact-card">
            <p className="about-section-intro">
              {t("about.contact.intro")}
            </p>

            <div className="about-contact-grid">
              <div>
                <h3 className="about-contact-subtitle">
                  {t("about.contact.addressLabel")}
                </h3>
                <address className="about-address">
                  {Array.isArray(addressLines) &&
                    addressLines.map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                </address>
              </div>

              <div>
                <h3 className="about-contact-subtitle">
                  {t("about.contact.contactLabel")}
                </h3>
                <p>
                  <strong>{t("about.contact.emailLabel")} </strong>
                  <a href="mailto:contact@taxero.ch">
                    contact@taxero.ch
                  </a>
                </p>
                <p>
                  <strong>{t("about.contact.phoneLabel")} </strong>
                  <a href="tel:+41263030409">+41 26 303 04 09</a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
