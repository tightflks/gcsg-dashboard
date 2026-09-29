"use client";

import { useActionState, useState } from "react";
import { signIn, type FormState } from "@/app/actions";
import { FormMessage } from "@/components/FormMessage";

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"password" | "link">("password");
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, null);

  return (
    <form action={action} className="light" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <input type="hidden" name="next" value={next} />
      <div className="chips" role="tablist" aria-label="Sign-in method">
        <button type="button" role="tab" aria-selected={mode === "password"} className={`chip${mode === "password" ? " on" : ""}`} onClick={() => setMode("password")}>
          Password
        </button>
        <button type="button" role="tab" aria-selected={mode === "link"} className={`chip${mode === "link" ? " on" : ""}`} onClick={() => setMode("link")}>
          Email me a link
        </button>
      </div>
      <div className="field">
        <label htmlFor="login-email">Email</label>
        <input id="login-email" name="email" type="email" required autoComplete="email" />
      </div>
      {mode === "password" && (
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input id="login-password" name="password" type="password" required autoComplete="current-password" />
        </div>
      )}
      <FormMessage state={state} />
      <button type="submit" className="btn-pill" disabled={pending}>
        {pending ? "Signing in…" : mode === "password" ? "Sign In" : "Send Sign-In Link"}
      </button>
    </form>
  );
}
