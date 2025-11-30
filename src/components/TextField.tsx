// src/components/TextField.tsx
import React, { forwardRef, InputHTMLAttributes } from "react";

type Props = {
  label?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

const TextField = forwardRef<HTMLInputElement, Props>(
  ({ label, error, ...inputProps }, ref) => {
    return (
      <div>
        {label && <label>{label}</label>}
        <input ref={ref} {...inputProps} />
        {error && <div className="error">{error}</div>}
      </div>
    );
  }
);

export default TextField;
