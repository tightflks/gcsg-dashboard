"use client";

import { useActionState, useState } from "react";
import { requestMaterials, type FormState } from "@/app/actions";
import { FormMessage } from "@/components/FormMessage";
import { Modal } from "@/components/Modal";

export function RequestMaterials({ className = "btn-pill", label = "Request Materials" }: { className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(requestMaterials, null);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <Modal title="Request donor materials" onClose={() => setOpen(false)}>
          {state?.ok ? (
            <>
              <div className="light"><FormMessage state={state} /></div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="button" className="btn-pill" onClick={() => setOpen(false)}>Close</button>
              </div>
            </>
          ) : (
            <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ color: "var(--ink-4)", fontSize: 14, lineHeight: 1.6 }}>
                Tell us who you are and we&apos;ll send the donor deck and full proposal.
              </p>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="rm-name">Name</label>
                  <input id="rm-name" name="name" required maxLength={200} autoComplete="name" />
                </div>
                <div className="field">
                  <label htmlFor="rm-email">Email</label>
                  <input id="rm-email" name="email" type="email" required autoComplete="email" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="rm-org">Organization (optional)</label>
                <input id="rm-org" name="organization" maxLength={200} autoComplete="organization" />
              </div>
              <div className="field">
                <label htmlFor="rm-msg">Message (optional)</label>
                <textarea id="rm-msg" name="message" rows={3} maxLength={4000} />
              </div>
              <div className="light"><FormMessage state={state} /></div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="btn-pill" disabled={pending}>{pending ? "Sending…" : "Send Request"}</button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
