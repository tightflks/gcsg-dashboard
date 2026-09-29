"use client";

import { useActionState } from "react";
import { subscribe, type FormState } from "@/app/actions";
import { FormMessage } from "@/components/FormMessage";

export function SubscribeForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribe, null);
  return (
    <form action={action} style={{ maxWidth: 420 }}>
      <label htmlFor="nl-email" className="sr-only">Email address</label>
      <input id="nl-email" type="email" name="email" placeholder="you@email.com" required autoComplete="email" />
      <button type="submit" className="btn-pill" disabled={pending}>{pending ? "…" : "Subscribe"}</button>
      <FormMessage state={state} />
    </form>
  );
}
