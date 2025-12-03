// src/components/Footer.tsx
import { useTranslation } from "react-i18next";
import logoTaxera1 from "../assets/Typeface.svg";

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
            <img
              src={logoTaxera1}
              alt="Taxera Logo"
              className="footer-logo-img"
            />
          </a>

          <p className="footer-address">
            Taxero AG<br />
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
