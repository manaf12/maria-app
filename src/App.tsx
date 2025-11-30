// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Topbar from "./components/Topbar";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./auth/ProtectedRoute";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SignupPage from "./pages/SignupPage";
import MenuBar from "./components/MenuBar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import DashboardPage1 from "./pages/DashboardPage1";
import ViewRequestPage from "./pages/ViewRequestPage";
import TestDeclarationCard from "./pages/TestDeclarationCard";
import TestViewRequestPage from "./pages/TestViewRequestPage";
import AboutPage from "./pages/AboutPage";
import FaqPage from "./pages/FaqPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import "./i18n/i18n";

export default function App() {
  return (
    <>
      <Topbar />
      <MenuBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/product" element={<ProductPage />} />
        <Route path="/declarations/:id" element={<ViewRequestPage />} />
        <Route path="/test-card" element={<TestDeclarationCard  />} />
        <Route path="/client-dashboard" element={<DashboardPage1 />} />
        <Route path="/test-view-request" element={<TestViewRequestPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/settings" element={<AccountSettingsPage />} />
        {/* <Route element={<ProtectedRoute />}>
          <Route path="/client-dashboard" element={<DashboardPage1 />} />
        </Route> */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        
        <Route path="*" element={<div>Not found</div>} />
      </Routes>
      <Footer />
    </>
  );
}
