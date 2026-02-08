// ==============================
// src/App.tsx
// (Public routes + Protected routes + Admin routes + Lazy loading)
// ==============================
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

import Topbar from "./components/Topbar";
import MenuBar from "./components/MenuBar";
import Footer from "./components/Footer";

import ProtectedRoute from "./auth/ProtectedRoute";
import AdminRoute from "./auth/AdminRoute";

import "./i18n/i18n";
import ScrollToTop from "./components/ScrollToTop";

// Public
const HomePage = lazy(() => import("./pages/HomePage"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));

// Auth (Public)
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const EmailVerificationPage = lazy(() => import("./pages/EmailVerificationPage"));

// Protected
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const DashboardPage1 = lazy(() => import("./pages/DashboardPage1"));
const AccountSettingsPage = lazy(() => import("./pages/AccountSettingsPage"));
const ViewRequestPage = lazy(() => import("./pages/ViewRequestPage"));
const TestViewRequestPage = lazy(() => import("./pages/TestViewRequestPage"));
const TestDeclarationCard = lazy(() => import("./pages/TestDeclarationCard"));

// Admin
const AdminDeclarationsPage = lazy(
  () => import("./pages/admin/AdminDeclarationsPage")
);


function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader__spinner" />
      <div className="page-loader__text">Loading…</div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Topbar />
      <MenuBar />

      <Suspense fallback={<PageLoader />}>
        <ScrollToTop />
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<HomePage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/product" element={<ProductPage />} />

          {/* AUTH (PUBLIC) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />

          {/* PROTECTED */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/client-dashboard" element={<DashboardPage1 />} />
            <Route path="/settings" element={<AccountSettingsPage />} />

            <Route path="/declaration/:id" element={<ViewRequestPage />} />
            <Route
              path="/declarations/:declarationId"
              element={<TestViewRequestPage />}
            />

            <Route path="/test-card" element={<TestDeclarationCard />} />
          </Route>

          {/* ADMIN ONLY */}
          <Route element={<AdminRoute />}>
            <Route
              path="/admin/declarations"
              element={<AdminDeclarationsPage />}
            />
            
          </Route>

          <Route path="*" element={<div>Not found</div>} />
        </Routes>
      </Suspense>

      <Footer />
    </>
  );
}
