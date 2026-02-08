// src/components/Footer.tsx
import { useTranslation } from "react-i18next";
import logoTaxera1 from "../assets/Typeface.svg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Footer() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin =
    user?.roles?.includes("admin") ||
    user?.roles?.includes("SUPER_ADMIN");

  const handleLogoClick = () => {
    if (isAdmin) {
      navigate("/"); // أو الصفحة اللي بدّك ياها
    } else {
      window.location.href = "https://www.taxero.ch/";
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Left side (Logo + Address) */}
        <div className="footer-left">

          <a
            className="footer-logo"
            onClick={handleLogoClick}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <img
              src={logoTaxera1}
              alt="Taxera Logo"
              className="footer-logo-img"
            />
          </a>

          <p className="footer-address">
            A&G Fiduciaire Sàrl<br />
            Route de Moncor 14<br />
            1752 Villars sur Glâne<br />
          </p>
        </div>

        {/* Right side (Links) */}
        <div className="footer-right">
          {/* <a
            href="https://www.swisstaxonline.ch/blog"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("footer.blog")}
          </a> */}

          <a
            href="http://www.taxero.ch/about"
            rel="noopener noreferrer"
          >
            {t("footer.about")}
          </a>

          <a
            href="https://www.taxero.ch/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("footer.terms")}
          </a>

          <a
            href="https://www.taxero.ch/privacy"
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
