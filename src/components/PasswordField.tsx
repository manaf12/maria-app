// src/components/PasswordField.tsx
import { useState, forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

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
  ({ label = "Password", error, disabled, id, ...inputProps }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div>
        {label && <label htmlFor={id}>{label}</label>}

        <div className="password-wrapper">
          <input
            ref={ref}
            id={id}
            type={show ? "text" : "password"}
            disabled={disabled}
            {...inputProps}
          />

          <button
            type="button"
            className="toggle-visibility"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            title={show ? "Hide password" : "Show password"}
            disabled={disabled}
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        {error && <div className="error">{error}</div>}
      </div>
    );
  }
);

export default PasswordField;