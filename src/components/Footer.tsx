// src/components/Footer.tsx
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Left side (Logo + Address) */}
        <div className="footer-left">
          <a
            className="footer-logo"
            href="https://www.swisstaxonline.ch/"
            target="_blank"
            rel="noopener noreferrer"
          >
            SwissTaxOnline
          </a>

          <p className="footer-address">
            SwissTaxOnline AG<br />
            Bahnhofstrasse 10<br />
            8001 Zürich<br />
            Switzerland
          </p>
        </div>

        {/* Right side (Links) */}
        <div className="footer-right">
          <a
            href="https://www.swisstaxonline.ch/blog"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("footer.blog")}
          </a>

          <a
            href="http://localhost:5173/about"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("footer.about")}
          </a>

          <a
            href="https://www.swisstaxonline.ch/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("footer.terms")}
          </a>

          <a
            href="https://www.swisstaxonline.ch/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("footer.privacy")}
          </a>
        </div>

      </div>
    </footer>
  );
}
