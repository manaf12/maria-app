// src/pages/AccountSettingsPage.tsx
import { useEffect, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import axiosClient from "../api/axiosClient";
import { useNavigate } from "react-router-dom";

type LanguageCode = "en" | "fr" | "de";

type AccountSettings = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  language: LanguageCode;
  twoFactorEnabled: boolean;
};

export default function AccountSettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<AccountSettings>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    language: (i18n.language as LanguageCode) || "en",
    twoFactorEnabled: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // change password local state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // load settings from API
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await axiosClient.get("/api/account/settings");
        const data = res.data as Partial<AccountSettings>;

        setSettings((prev) => ({
          ...prev,
          ...data,
          language: (data.language as LanguageCode) || prev.language,
          twoFactorEnabled: data.twoFactorEnabled ?? prev.twoFactorEnabled,
        }));

        if (data.language) {
          i18n.changeLanguage(data.language);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [i18n]);

  const handleFieldChange =
    (field: keyof AccountSettings) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        field === "twoFactorEnabled"
          ? (e as ChangeEvent<HTMLInputElement>).target.checked
          : e.target.value;

      setSettings((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleSave = async () => {
    setFormMessage(null);
    setFormError(null);

    if (newPassword && newPassword !== confirmNewPassword) {
      setFormError(t("accountSettings.errors.passwordMismatch"));
      return;
    }

    try {
      setIsSaving(true);

      // 1) save general settings (profile + language + 2FA flag)
      const payload: AccountSettings = {
        firstName: settings.firstName,
        lastName: settings.lastName,
        email: settings.email,
        phone: settings.phone ?? "",
        language: settings.language,
        twoFactorEnabled: settings.twoFactorEnabled,
      };

      await axiosClient.put("/api/account/settings", payload);

      // 2) change password if fields filled
      if (currentPassword && newPassword) {
        await axiosClient.post("/api/account/change-password", {
          currentPassword,
          newPassword,
        });

        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }

      // change language locally
      i18n.changeLanguage(settings.language);

      setFormMessage(t("accountSettings.saveSuccess"));
    } catch (e: any) {
      console.error(e);
      setFormError(
        e?.response?.data?.error ?? t("accountSettings.saveError")
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      t("accountSettings.delete.confirmQuestion")
    );
    if (!confirmed) return;

    try {
      await axiosClient.delete("/api/account");
      // ممكن تضيفي هنا /api/auth/logout إذا عندكم
      navigate("/", { replace: true });
    } catch (e: any) {
      console.error(e);
      setFormError(
        e?.response?.data?.error ?? t("accountSettings.delete.error")
      );
    }
  };

  return (
    <div className="account-page">
      <div className="account-page-inner">
        <header className="account-header">
          <h1>{t("accountSettings.title")}</h1>
          <p className="account-subtitle">
            {t("accountSettings.subtitle")}
          </p>
        </header>

        {isLoading && (
          <p className="muted">{t("accountSettings.loading")}</p>
        )}

        {!isLoading && (
          <>
            {/* Personal information */}
            <section className="account-section">
              <h2 className="account-section-title">
                {t("accountSettings.personal.title")}
              </h2>
              <p className="account-section-desc">
                {t("accountSettings.personal.desc")}
              </p>

              <div className="field-grid-2">
                <div className="field-row">
                  <label htmlFor="firstName">
                    {t("accountSettings.personal.firstName")}
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={settings.firstName}
                    onChange={handleFieldChange("firstName")}
                  />
                </div>
                <div className="field-row">
                  <label htmlFor="lastName">
                    {t("accountSettings.personal.lastName")}
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={settings.lastName}
                    onChange={handleFieldChange("lastName")}
                  />
                </div>
              </div>

              <div className="field-grid-2">
                <div className="field-row">
                  <label htmlFor="email">
                    {t("accountSettings.personal.email")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={handleFieldChange("email")}
                    autoComplete="email"
                  />
                </div>
                <div className="field-row">
                  <label htmlFor="phone">
                    {t("accountSettings.personal.phone")}
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={settings.phone ?? ""}
                    onChange={handleFieldChange("phone")}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </section>

            {/* Language */}
            <section className="account-section">
              <h2 className="account-section-title">
                {t("accountSettings.language.title")}
              </h2>
              <p className="account-section-desc">
                {t("accountSettings.language.desc")}
              </p>

              <div className="field-row field-row-inline">
                <label htmlFor="lang-select">
                  {t("accountSettings.language.label")}
                </label>
                <select
                  id="lang-select"
                  value={settings.language}
                  onChange={handleFieldChange("language")}
                >
                  <option value="en">
                    {t("accountSettings.language.en")}
                  </option>
                  <option value="fr">
                    {t("accountSettings.language.fr")}
                  </option>
                  <option value="de">
                    {t("accountSettings.language.de")}
                  </option>
                </select>
              </div>
            </section>

            {/* Security */}
            <section className="account-section">
              <h2 className="account-section-title">
                {t("accountSettings.security.title")}
              </h2>
              <p className="account-section-desc">
                {t("accountSettings.security.desc")}
              </p>

              <div className="field-grid-2">
                <div className="field-row">
                  <label htmlFor="currentPassword">
                    {t("accountSettings.security.currentPassword")}
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <div className="field-row" />
              </div>

              <div className="field-grid-2">
                <div className="field-row">
                  <label htmlFor="newPassword">
                    {t("accountSettings.security.newPassword")}
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="field-row">
                  <label htmlFor="confirmNewPassword">
                    {t("accountSettings.security.confirmNewPassword")}
                  </label>
                  <input
                    id="confirmNewPassword"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) =>
                      setConfirmNewPassword(e.target.value)
                    }
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="field-row field-row-inline">
                <span>{t("accountSettings.security.twoFactorLabel")}</span>
                <label className="switch-row">
                  <input
                    type="checkbox"
                    checked={settings.twoFactorEnabled}
                    onChange={handleFieldChange("twoFactorEnabled")}
                    aria-label={t(
                      "accountSettings.security.twoFactorToggle"
                    )}
                  />
                  <span>
                    {t("accountSettings.security.twoFactorToggle")}
                  </span>
                </label>
              </div>
            </section>

            {/* Delete account */}
            <section className="account-section account-section-danger">
              <h2 className="account-section-title">
                {t("accountSettings.delete.title")}
              </h2>
              <p className="account-section-desc">
                {t("accountSettings.delete.desc")}
              </p>

              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteAccount}
              >
                {t("accountSettings.delete.button")}
              </button>
            </section>

            {/* messages + save button */}
            {(formMessage || formError) && (
              <div
                className={
                  "account-message " +
                  (formError ? "is-error" : "is-success")
                }
              >
                {formError ?? formMessage}
              </div>
            )}

            <div className="account-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving
                  ? t("accountSettings.saving")
                  : t("accountSettings.save")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
