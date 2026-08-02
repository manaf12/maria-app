// src/components/PasswordField.tsx
import { useState, forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  label?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* slash */}
      <path
        d="M2 2L22 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* same eye outline */}
      <path
        d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* same pupil circle */}
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

const PasswordField = forwardRef<HTMLInputElement, Props>(
  ({ label = "Password", error, disabled, id: providedId, ...inputProps }, ref) => {
    const [show, setShow] = useState(false);
    const { t } = useTranslation();
    const inputId = providedId ?? inputProps.name;
    const errorId = inputId ? `${inputId}-error` : undefined;
    const visibilityLabel = show
      ? t("common.hidePassword")
      : t("common.showPassword");

    return (
      <div>
        {label && <label htmlFor={inputId}>{label}</label>}

        <div className="password-wrapper">
          <input
            ref={ref}
            {...inputProps}
            id={inputId}
            type={show ? "text" : "password"}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : inputProps["aria-describedby"]}
          />

          <button
            type="button"
            className="toggle-visibility"
            onClick={() => setShow((s) => !s)}
            aria-label={visibilityLabel}
            title={visibilityLabel}
            disabled={disabled}
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        {error && (
          <div id={errorId} className="error" role="alert">
            {error}
          </div>
        )}
      </div>
    );
  }
);

export default PasswordField;
