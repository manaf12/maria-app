import React, { useState } from "react";
import TextField from "../TextField";

export default function PasswordField(props: any) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-field">
      <TextField type={show ? "text" : "password"} {...props} />
      <button type="button" onClick={() => setShow(s => !s)} aria-label="Toggle password visibility">
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}
