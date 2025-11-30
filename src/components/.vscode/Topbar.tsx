// src/components/Topbar.tsx
import { useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const LANGS: { code: "de" | "fr" | "en"; label: string }[] = [
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
  { code: "en", label: "English" },
];

export default function Topbar() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const currentLang = i18n.language as "de" | "fr" | "en";

  const changeLanguage = useCallback(
    (lng: "de" | "fr" | "en") => {
      i18n.changeLanguage(lng);
      localStorage.setItem("taxonline_lang", lng);
    },
    [i18n]
  );

  return (
    <div className="topbar">
      {/* Left side: Swiss flag + tagline */}
      <div className="topbar-left">
        <span className="topbar-flag" aria-hidden="true">
          🇨🇭
        </span>
        <span className="topbar-text">Your trusted Swiss partner</span>
      </div>

      {/* Right side: language selector + login */}
      <div className="topbar-right">
        <div className="topbar-langs">
          {LANGS.map((lng, idx) => (
            <span key={lng.code} className="topbar-lang-item">
              <button
                type="button"
                className={
                  "topbar-lang-btn" +
                  (currentLang?.startsWith(lng.code) ? " active" : "")
                }
                onClick={() => changeLanguage(lng.code)}
              >
                {lng.label}
              </button>
              {idx < LANGS.length - 1 && (
                <span className="topbar-lang-separator">-</span>
              )}
            </span>
          ))}
        </div>

        <Link
          to="/login"
          state={{ from: location.pathname }}
          className="topbar-login-btn"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
