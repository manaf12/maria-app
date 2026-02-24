// src/components/MenuBar.tsx
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import logoTaxera1 from "../assets/Typeface.svg";
import PhoneIcon from "../assets/phone.svg";

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
  const location = useLocation();

  // هل نحنا بصفحة /product ؟
  const isProductPage = location.pathname === "/product";

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
      {/* Left side: email chip */}
      <div className="menu-left">
        {user?.email && (
          <button type="button" className="email-chip">
            <span className="email-text">{user.email}</span>
            <span className="caret">▾</span>
          </button>
        )}
      </div>

      {/* Centered Logo */}
      {isProductPage ? (
        // في صفحة /product: اللوجو شكل فقط بدون Link
        <div className="menu-logo">
          <img src={logoTaxera1} alt="Taxero Logo" className="menu-logo-img" />
        </div>
      ) : (
        // باقي الصفحات: اللوجو يعمل navigation عادي
        <Link to={logoTarget} className="menu-logo">
          <img src={logoTaxera1} alt="Taxero Logo" className="menu-logo-img" />
        </Link>
      )}

      {/* Right side */}
      <div className="menu-right">
        <div className="menu-phone-wrapper">
          {isProductPage ? (
            // في /product: رقم الهاتف بدون href حتى ما يفتح dialer
            <div className="menu-phone">
              <img src={PhoneIcon} alt="Phone" className="menu-phone-icon" />
              <span className="menu-phone-number">+41 26 303 04 09</span>
            </div>
          ) : (
            <a href="tel:+41263030409" className="menu-phone">
              <img src={PhoneIcon} alt="Phone" className="menu-phone-icon" />
              <span className="menu-phone-number">+41 26 303 04 09</span>
            </a>
          )}
        </div>

        {user &&
          (isProductPage ? (
            // في /product: Dashboard زر شكلي ماله action
            <button type="button" className="menu-cta-btn" disabled>
              {t("menu.dashboard")}
            </button>
          ) : (
            <Link to={dashboardTarget} className="menu-cta-btn">
              {t("menu.dashboard")}
            </Link>
          ))}
      </div>
    </header>
  );
}