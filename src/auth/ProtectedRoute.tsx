import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
