import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export default function TextField({ label, error, ...rest }: Props) {
  const id = rest.id || rest.name;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...rest} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} />
      {error && <div id={`${id}-err`} role="alert" className="error">{error}</div>}
    </div>
  );
}
