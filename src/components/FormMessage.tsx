import type { FormState } from "@/app/actions";

export function FormMessage({ state }: { state: FormState }) {
  if (!state) return null;
  return (
    <p className={`form-msg ${state.ok ? "ok" : "err"}`} role={state.ok ? "status" : "alert"}>
      {state.message}
    </p>
  );
}
