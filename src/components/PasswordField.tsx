// src/components/PasswordField.tsx
import { useState, forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type Props = {
  label?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

const PasswordField = forwardRef<HTMLInputElement, Props>(
  ({ label = "Password", error, ...inputProps }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div>
        <label>{label}</label>
        <div className="password-wrapper">
          <input
            ref={ref}
            type={show ? "text" : "password"}
            {...inputProps}
          />
          <button
            type="button"
            className="toggle-visibility"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            title={show ? "Hide password" : "Show password"}
            tabIndex={0}
          >
            {show ? (
              // eye-off
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9.88 5.09A10.8 10.8 0 0112 5c6 0 9.5 5.5 9.5 7s-3.5 7-9.5 7a11.5 11.5 0 01-5.3-1.33M5.12 7.22A10.7 10.7 0 002.5 12c0 1.16.86 2.77 2.32 4.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              // eye
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            )}
          </button>
        </div>
        {error && <div className="error">{error}</div>}
      </div>
    );
  }
);

export default PasswordField;
