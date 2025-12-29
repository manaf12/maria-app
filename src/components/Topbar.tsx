/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/Topbar.tsx
import { useState, useCallback } from "react";
import { Link, useNavigate, useLocation, redirect } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import logoTaxera from "../assets/Icon.svg";

const LANGS: { code: "de" | "fr" | "en"; labelKey: string }[] = [
  { code: "de", labelKey: "topbar.lang.de" },
  { code: "fr", labelKey: "topbar.lang.fr" },
  { code: "en", labelKey: "topbar.lang.en" }
]

export default function Topbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // const [open, setOpen] = useState(false);
  const [menuopen, setMenuOpen] = useState(false);
  const currentLang = (i18n.language || "en").slice(0, 2) as "de" | "fr" | "en";

  const changeLanguage = (lng: "de" | "fr" | "en") => {
    i18n.changeLanguage(lng);
    localStorage.setItem("taxonline_lang", lng);
  };
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Logout failed. Please try again.");
    }
    // finally {
    //   window.location.href = "https://www.swisstaxonline.ch/";
    // }
  };
  const fullName = user ? `${user.firstName} ${user.lastName}` : "";

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="topbar-flag" >
          <img 
            src={logoTaxera} 
            alt="Taxera Logo"
            className="topbar-flag-img" />
        </div>
        <span className="topbar-text">{t("topbar.tagline")}</span>
      </div>

      <div className="topbar-right">
        <div className="topbar-langs">
          {LANGS.map((lng, idx) => (
            <span key={lng.code} className="topbar-lang-item">
              <button
                type="button"
                className={
                  "topbar-lang-btn" +
                  (currentLang === lng.code ? " active" : "")
                }
                onClick={() => changeLanguage(lng.code)}
              >
                {t(lng.labelKey)}
              </button>
              {idx < LANGS.length - 1 && (
                <span className="topbar-lang-separator">-</span>
              )}
            </span>
          ))}
        </div>

        {!user ? (
          <Link 
            to="/login"
            state={{redirectTo: location.pathname}}
            className="topbar-login-btn">
            {t("topbar.login")}
          </Link>
        ) : (

          <div className="user-menu">
            <button
              type="button"
              className="user-menu-trigger"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span>My Account</span>
              <span className="user-menu-caret">▾</span>
            </button>

            {menuopen && (
              <div className="user-menu-dropdown">
                <button
                  type="button"
                  className="user-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/dashboard");
                  }}
                >
                  {t("menu.settings")}
                </button>
                <button
                  type="button"
                  className="user-menu-item"
                  onClick={handleLogout}
                >
                  {t("menu.logout")}
                </button>
              </div>
            )}
          </div>
       )}
     </div>
   </div>
  );
}
