import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function normalizeRoles(roles?: string[]) {
  return (roles ?? []).map((r) => r.trim().toUpperCase());
}

function isAdminRole(roles?: string[]) {
  const r = normalizeRoles(roles);
  return r.includes("ADMIN") || r.includes("SUPER_ADMIN");
}

export default function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAdminRole(user.roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
