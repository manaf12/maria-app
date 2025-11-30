/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/MenuBar.tsx
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import logoTaxera1 from "../assets/Typeface.svg";

export default function MenuBar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();

  // Logo always sends logged-in users to dashboard
  const logoTarget = user ? "/dashboard" : "/";

  return (
    <header className="menu-bar">
      {/* Left side empty to keep logo centered */}
      <div className="menu-left"></div>

      {/* Centered Logo */}
      <Link to={logoTarget} className="menu-logo">
        <img 
          src={logoTaxera1} 
          alt="Taxera Logo"
          className="menu-logo-img" />
      </Link>

      {/* Right side: Dashboard button (only if logged in) */}
      <div className="menu-right">
        {user && (
          <Link to="/dashboard" className="menu-cta-btn">
            {t("menu.dashboard")}
          </Link>
        )}
      </div>
    </header>
  );
}
