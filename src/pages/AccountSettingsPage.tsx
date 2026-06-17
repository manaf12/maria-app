// src/pages/AccountSettingsPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

type LanguageCode = "en" | "fr" | "de";

type AccountSettingsState = {
  firstName: string;
  lastName: string;
  email: string; // read-only in UI
  phone: string; // read-only in UI (optional)
  // language removed from UI (kept optional if you ever need it)
  language?: LanguageCode;
};

type ProfileResponse = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  language: LanguageCode;
  user: {
    email?: string;
    phone?: string;
  };
}>;

type SaveOutcome = {
  personalInfoSaved: boolean;
  passwordSaved: boolean;
};

type PasswordStrength = "weak" | "medium" | "strong";
type PasswordScore = {
  strength: PasswordStrength;
  score: number; // 0..6
  hints: string[]; // i18n keys
};

function normalizeApiError(e: any, fallback: string): string {
  const data = e?.response?.data;
  if (!data) return fallback;

  // common backend patterns
  if (typeof data?.error === "string" && data.error.trim()) return data.error;

  const msg = data?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  if (Array.isArray(msg) && msg.length) return msg.filter(Boolean).join("\n");

  return fallback;
}

function shallowEqual(
  a: Pick<AccountSettingsState, "firstName" | "lastName">,
  b: Pick<AccountSettingsState, "firstName" | "lastName">,
) {
  return a.firstName === b.firstName && a.lastName === b.lastName;
}

function scorePassword(pw: string): PasswordScore {
  const hints: string[] = [];
  let score = 0;

  if (pw.length >= 8) score += 1;
  else hints.push("password.hints.minLength");

  if (pw.length >= 12) score += 1;

  if (/[A-Z]/.test(pw)) score += 1;
  else hints.push("password.hints.uppercase");

  if (/[a-z]/.test(pw)) score += 1;
  else hints.push("password.hints.lowercase");

  if (/\d/.test(pw)) score += 1;
  else hints.push("password.hints.number");

  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  else hints.push("password.hints.symbol");

  const strength: PasswordStrength =
    score >= 5 ? "strong" : score >= 3 ? "medium" : "weak";

  return { strength, score: Math.min(score, 6), hints };
}

function EyeIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 12C1 12 5 5 12 5C19 5 23 12 23 12C23 12 19 19 12 19C5 19 1 12 1 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 2L22 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PasswordHints({
  hints,
  t,
}: {
  hints: string[];
  t: (key: string, options?: { defaultValue?: string }) => string;
}) {
  if (!hints.length) return null;

  return (
    <ul className="pw-hints-list">
      {hints.map((key) => (
        <li key={key}>{t(key, { defaultValue: key })}</li>
      ))}
    </ul>
  );
}

export default function AccountSettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<AccountSettingsState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Track initial snapshot for dirty state + reset
  const initialSnapshotRef = useRef<
    Pick<AccountSettingsState, "firstName" | "lastName"> | null
  >(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [pwTouched, setPwTouched] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const [pwErrors, setPwErrors] = useState<{
    current?: string;
    next?: string;
    confirm?: string;
    general?: string;
  }>({});

  const [showPw, setShowPw] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const anyPasswordDirty = Boolean(
    currentPassword || newPassword || confirmNewPassword,
  );

  const pwScore = useMemo(() => scorePassword(newPassword), [newPassword]);

  const isProfileDirty = useMemo(() => {
    const snap = initialSnapshotRef.current;
    if (!snap) return false;

    return !shallowEqual(
      { firstName: settings.firstName, lastName: settings.lastName },
      snap,
    );
  }, [settings.firstName, settings.lastName]);

  const isDirty = isProfileDirty || anyPasswordDirty;

  // Load profile
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setFormError(null);
      setFormMessage(null);

      try {
        setIsLoading(true);

        const res = await axiosClient.get("/settings/profile");
        const data = res.data as ProfileResponse;

        const email = (data.email ?? data.user?.email ?? "").trim();
        const phone = (data.phone ?? data.user?.phone ?? "").trim();

        const merged: AccountSettingsState = {
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          email,
          phone,
        };

        if (cancelled) return;

        setSettings(merged);
        initialSnapshotRef.current = {
          firstName: merged.firstName,
          lastName: merged.lastName,
        };
      } catch (e: any) {
        if (cancelled) return;

        console.error(e);
        const status = e?.response?.status;
        if (status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setFormError(
          normalizeApiError(
            e,
            t("accountSettings.loadError", "Failed to load settings."),
          ),
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validatePasswordBlock = (): boolean => {
    const errs: typeof pwErrors = {};

    if (!anyPasswordDirty) {
      setPwErrors({});
      return true;
    }

    const cur = currentPassword.trim();
    const next = newPassword.trim();
    const conf = confirmNewPassword.trim();

    if (!cur)
      errs.current = t(
        "accountSettings.errors.currentRequired",
        "Current password is required.",
      );
    if (!next)
      errs.next = t(
        "accountSettings.errors.newRequired",
        "New password is required.",
      );
    if (!conf)
      errs.confirm = t(
        "accountSettings.errors.confirmRequired",
        "Please confirm your new password.",
      );
    if (next && conf && next !== conf)
      errs.confirm = t(
        "accountSettings.errors.passwordMismatch",
        "New password and confirmation do not match.",
      );

    // baseline policy
    if (next && next.length < 8) {
      errs.next = t(
        "accountSettings.errors.minLength",
        "Password must be at least 8 characters.",
      );
    }

    // prevent using same password
    if (cur && next && cur === next) {
      errs.next = t(
        "accountSettings.errors.mustDiffer",
        "New password must be different from the current password.",
      );
    }

    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const mapPasswordApiError = (rawMsg: string) => {
    const msg =
      rawMsg || t("accountSettings.saveError", "Failed to save settings.");
    const lower = msg.toLowerCase();

    const mapped: typeof pwErrors = { general: msg };

    if (
      lower.includes("current") &&
      (lower.includes("incorrect") || lower.includes("invalid"))
    ) {
      mapped.current = t(
        "accountSettings.errors.currentIncorrect",
        "Current password is incorrect.",
      );
    }

    if (lower.includes("min") && lower.includes("length")) {
      mapped.next = t(
        "accountSettings.errors.minLength",
        "Password must be at least 8 characters.",
      );
    }

    if (lower.includes("weak") || lower.includes("complex")) {
      mapped.next = t(
        "accountSettings.errors.tooWeak",
        "Password is too weak. Add numbers and symbols.",
      );
    }

    return mapped;
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    setFormMessage(null);
    setFormError(null);
    setPwErrors((p) => ({ ...p, general: undefined }));

    if (!isDirty) {
      setFormMessage(t("accountSettings.noChanges", "No changes to save."));
      return;
    }

    if (anyPasswordDirty) {
      setPwTouched({ current: true, next: true, confirm: true });
      if (!validatePasswordBlock()) return;
    }

    setIsSaving(true);

    const outcome: SaveOutcome = {
      personalInfoSaved: false,
      passwordSaved: false,
    };

    try {
      const snap = initialSnapshotRef.current;

      const shouldSavePersonal =
        !snap ||
        settings.firstName !== snap.firstName ||
        settings.lastName !== snap.lastName;

      const tasks: Array<Promise<any>> = [];
      const keys: Array<keyof SaveOutcome> = [];

      if (shouldSavePersonal) {
        tasks.push(
          axiosClient.patch("/settings/personal-info", {
            firstName: settings.firstName,
            lastName: settings.lastName,
          }),
        );
        keys.push("personalInfoSaved");
      }

      if (anyPasswordDirty) {
        tasks.push(
          axiosClient.patch("/settings/password", {
            currentPassword: currentPassword.trim(),
            newPassword: newPassword.trim(),
            confirmNewPassword: confirmNewPassword.trim(),
          }),
        );
        keys.push("passwordSaved");
      }

      const results = await Promise.allSettled(tasks);

      const failedMessages: string[] = [];
      let passwordFailedMessage: string | null = null;

      results.forEach((r, idx) => {
        const key = keys[idx];
        if (r.status === "fulfilled") {
          outcome[key] = true;
        } else {
          outcome[key] = false;

          const msg = normalizeApiError(
            r.reason,
            t("accountSettings.saveError", "Failed to save settings."),
          );

          if (key === "passwordSaved") passwordFailedMessage = msg;
          else failedMessages.push(msg);
        }
      });

      if (outcome.personalInfoSaved) {
        initialSnapshotRef.current = {
          firstName: settings.firstName,
          lastName: settings.lastName,
        };
      }

      if (outcome.passwordSaved) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setPwTouched({ current: false, next: false, confirm: false });
        setPwErrors({});
      } else if (passwordFailedMessage) {
        setPwErrors(mapPasswordApiError(passwordFailedMessage));
      }

      if (failedMessages.length || passwordFailedMessage) {
        const okParts: string[] = [];
        if (outcome.personalInfoSaved)
          okParts.push(
            t("accountSettings.outcome.personalSaved", "Name updated"),
          );
        if (outcome.passwordSaved)
          okParts.push(
            t("accountSettings.outcome.passwordSaved", "Password updated"),
          );

        const header = okParts.length
          ? t(
            "accountSettings.partialSaved",
            "Some changes were saved, but not all:",
          )
          : t("accountSettings.saveFailed", "Saving failed:");

        const all = [header, okParts.length ? okParts.join(" • ") : null, ...failedMessages]
          .filter(Boolean)
          .join("\n");

        if (all.trim()) setFormError(all);
      } else {
        const okParts: string[] = [];
        if (outcome.personalInfoSaved)
          okParts.push(
            t("accountSettings.outcome.personalSaved", "Name updated"),
          );
        if (outcome.passwordSaved)
          okParts.push(
            t("accountSettings.outcome.passwordSaved", "Password updated"),
          );

        setFormMessage(
          okParts.length
            ? okParts.join(" • ")
            : t("accountSettings.saveSuccess", "Saved successfully."),
        );
      }
    } catch (e2: any) {
      console.error(e2);
      const status = e2?.response?.status;
      if (status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setFormError(
        normalizeApiError(
          e2,
          t("accountSettings.saveError", "Failed to save settings."),
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormError(null);
    setFormMessage(null);
    setPwErrors({});
    setPwTouched({ current: false, next: false, confirm: false });

    const snap = initialSnapshotRef.current;
    if (!snap) return;

    setSettings((prev) => ({
      ...prev,
      firstName: snap.firstName,
      lastName: snap.lastName,
    }));

    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleDeleteAccount = async () => {
    setFormError(null);
    setFormMessage(null);

    const confirmed = window.confirm(
      t(
        "accountSettings.delete.confirmQuestion",
        "Are you sure you want to delete your account?",
      ),
    );
    if (!confirmed) return;

    try {
      await axiosClient.delete("/settings/account");
      navigate("/", { replace: true });
    } catch (e: any) {
      console.error(e);
      const status = e?.response?.status;
      if (status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setFormError(
        normalizeApiError(
          e,
          t("accountSettings.delete.error", "Failed to delete account."),
        ),
      );
    }
  };

  const strengthLabel =
    pwScore.strength === "weak"
      ? t("accountSettings.passwordStrength.weak", "Weak")
      : pwScore.strength === "medium"
        ? t("accountSettings.passwordStrength.medium", "Medium")
        : t("accountSettings.passwordStrength.strong", "Strong");

  const showHideLabel = (isShown: boolean) =>
    isShown
      ? t("accountSettings.password.hide", "Hide password")
      : t("accountSettings.password.show", "Show password");

  return (
    <div className="account-page">
      <div className="account-page-inner">
        <header className="account-header">
          <h1>{t("accountSettings.title", "Account settings")}</h1>
          <p className="account-subtitle">
            {t(
              "accountSettings.subtitle",
              "Manage your personal information and password.",
            )}
          </p>
        </header>

        {isLoading ? (
          <p className="muted">{t("accountSettings.loading", "Loading…")}</p>
        ) : (
          <form onSubmit={handleSave} className="account-form">
            {/* Personal information */}
            <section className="account-section">
              <h2 className="account-section-title">
                {t("accountSettings.personal.title", "Personal information")}
              </h2>
              <p className="account-section-desc">
                {t(
                  "accountSettings.personal.desc",
                  "Update the details linked to your Taxero account.",
                )}
              </p>

              <div className="field-grid-2">
                <div className="field-row">
                  <label htmlFor="firstName">
                    {t("accountSettings.personal.firstName", "First name")}
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={settings.firstName}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, firstName: e.target.value }))
                    }
                    autoComplete="given-name"
                    disabled={isSaving}
                  />
                </div>

                <div className="field-row">
                  <label htmlFor="lastName">
                    {t("accountSettings.personal.lastName", "Last name")}
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={settings.lastName}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, lastName: e.target.value }))
                    }
                    autoComplete="family-name"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="field-grid-2">
                <div className="field-row">
                  <label htmlFor="email">
                    {t("accountSettings.personal.email", "Email")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={
                      settings.email ||
                      t(
                        "accountSettings.personal.emailNotAvailable",
                        "Not available",
                      )
                    }
                    disabled
                    autoComplete="email"
                  />
                </div>

                {/* Phone: keep commented per your requirement */}
                {/* {settings.phone ? (
                  <div className="field-row">
                    <label htmlFor="phone">
                      {t("accountSettings.personal.phone", "Phone")}
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={settings.phone}
                      disabled
                      autoComplete="tel"
                    />
                  </div>
                ) : (
                  <div className="field-row" />
                )} */}
              </div>
            </section>

            {/* Account security */}
            <section className="account-section">
              <h2 className="account-section-title">
                {t("accountSettings.security.title", "Account security")}
              </h2>
              <p className="account-section-desc">
                {t("accountSettings.security.desc", "Change your password.")}
              </p>

              <div className="field-grid-2">
                <div className="field-row">
                  <label htmlFor="currentPassword">
                    {t(
                      "accountSettings.security.currentPassword",
                      "Current password",
                    )}
                  </label>

                  <div className="password-wrapper">
                    <input
                      id="currentPassword"
                      type={showPw.current ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      onBlur={() =>
                        setPwTouched((p) => ({ ...p, current: true }))
                      }
                      autoComplete="current-password"
                      disabled={isSaving}
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      aria-label={showHideLabel(showPw.current)}
                      title={showHideLabel(showPw.current)}
                      onClick={() =>
                        setShowPw((p) => ({ ...p, current: !p.current }))
                      }
                      disabled={isSaving}
                    >
                      {showPw.current ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>

                  {pwTouched.current && pwErrors.current && (
                    <div className="field-error">{pwErrors.current}</div>
                  )}
                </div>

                <div className="field-row" />
              </div>

              <div className="field-grid-2">
                <div className="field-row">
                  <label htmlFor="newPassword">
                    {t("accountSettings.security.newPassword", "New password")}
                  </label>

                  <div className="password-wrapper">
                    <input
                      id="newPassword"
                      type={showPw.next ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onBlur={() => setPwTouched((p) => ({ ...p, next: true }))}
                      autoComplete="new-password"
                      disabled={isSaving}
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      aria-label={showHideLabel(showPw.next)}
                      title={showHideLabel(showPw.next)}
                      onClick={() =>
                        setShowPw((p) => ({ ...p, next: !p.next }))
                      }
                      disabled={isSaving}
                    >
                      {showPw.next ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>

                  {newPassword && (
                    <div className="pw-strength">
                      <div className="pw-strength-text">
                        {t("accountSettings.passwordStrength.label", "Strength")}:{" "}
                        {strengthLabel}
                      </div>

                      {pwScore.strength !== "strong" && pwScore.hints.length > 0 && (
                        <PasswordHints hints={pwScore.hints.slice(0, 3)} t={t} />
                      )}
                    </div>
                  )}

                  {pwTouched.next && pwErrors.next && (
                    <div className="field-error">{pwErrors.next}</div>
                  )}
                </div>

                <div className="field-row">
                  <label htmlFor="confirmNewPassword">
                    {t(
                      "accountSettings.security.confirmNewPassword",
                      "Confirm new password",
                    )}
                  </label>

                  <div className="password-wrapper">
                    <input
                      id="confirmNewPassword"
                      type={showPw.confirm ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      onBlur={() =>
                        setPwTouched((p) => ({ ...p, confirm: true }))
                      }
                      autoComplete="new-password"
                      disabled={isSaving}
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      aria-label={showHideLabel(showPw.confirm)}
                      title={showHideLabel(showPw.confirm)}
                      onClick={() =>
                        setShowPw((p) => ({ ...p, confirm: !p.confirm }))
                      }
                      disabled={isSaving}
                    >
                      {showPw.confirm ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>

                  {pwTouched.confirm && pwErrors.confirm && (
                    <div className="field-error">{pwErrors.confirm}</div>
                  )}
                </div>
              </div>

              {pwErrors.general && (
                <div className="account-message is-error" aria-live="polite">
                  {pwErrors.general}
                </div>
              )}
            </section>

            {/* Danger zone */}
            <section className="account-section account-section-danger">
              <h2 className="account-section-title">
                {t("accountSettings.delete.title", "Delete account")}
              </h2>
              <p className="account-section-desc">
                {t(
                  "accountSettings.delete.desc",
                  "Delete your account and all associated data.",
                )}
              </p>

              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteAccount}
                disabled={isSaving}
              >
                {t("accountSettings.delete.button", "Delete my account")}
              </button>
            </section>

            {(formMessage || formError) && (
              <div
                className={
                  "account-message " + (formError ? "is-error" : "is-success")
                }
                aria-live="polite"
              >
                {formError ?? formMessage}
              </div>
            )}

            <div className="account-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReset}
                disabled={isSaving || !isDirty}
              >
                {t("accountSettings.reset", "Reset")}
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={isSaving || !isDirty}
              >
                {isSaving
                  ? t("accountSettings.saving", "Saving…")
                  : t("accountSettings.save", "Save changes")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}