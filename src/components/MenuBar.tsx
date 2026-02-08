/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/MenuBar.tsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import logoTaxera1 from "../assets/Typeface.svg";

function normalizeRoles(roles?: unknown) {
  const raw =
    Array.isArray(roles) ? roles : typeof roles === "string" ? roles.split(",") : [];

  return raw
    .map((r) => String(r).trim().toUpperCase())
    .filter(Boolean);
}

function isAdminRole(roles?: unknown) {
  const r = normalizeRoles(roles);
  return r.includes("ADMIN") || r.includes("SUPER_ADMIN");
}

export default function MenuBar() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Logo sends admins to admin declarations, clients to home (or keep "/")
  const logoTarget = user
    ? isAdminRole((user as any)?.roles)
      ? "/admin/declarations"
      : "/"
    : "/";

  // Dashboard button: admin -> /admin/declarations, client -> /client-dashboard
  const dashboardTarget = isAdminRole((user as any)?.roles)
    ? "/admin/declarations"
    : "/client-dashboard";

  return (
    <header className="menu-bar">
      {/* Left side empty to keep logo centered */}
      <div className="menu-left"></div>

      {/* Centered Logo */}
      <Link to={logoTarget} className="menu-logo">
        <img
          src={logoTaxera1}
          alt="Taxera Logo"
          className="menu-logo-img"
        />
      </Link>

      {/* Right side: Dashboard button (only if logged in) */}
      <div className="menu-right">
        {user && (
          <Link to={dashboardTarget} className="menu-cta-btn">
            {t("menu.dashboard")}
          </Link>
        )}
      </div>
    </header>
  );
}
