// src/components/TextField.tsx
import { forwardRef, type InputHTMLAttributes } from "react";

type Props = {
  label?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

const TextField = forwardRef<HTMLInputElement, Props>(
  ({ label, error, ...inputProps }, ref) => {
    const inputId = inputProps.id ?? inputProps.name;
    const errorId = inputId ? `${inputId}-error` : undefined;

    return (
      <div>
        {label && <label htmlFor={inputId}>{label}</label>}
        <input
          ref={ref}
          {...inputProps}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : inputProps["aria-describedby"]}
        />
        {error && (
          <div id={errorId} className="error" role="alert">
            {error}
          </div>
        )}
      </div>
    );
  }
);

export default TextField;
