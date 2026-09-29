"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveAction, type FormState } from "@/app/actions";
import { FormMessage } from "@/components/FormMessage";
import { Modal } from "@/components/Modal";
import { ACTION_STATUSES, type ActionItem } from "@/lib/types";

export function ActionForm({
  item,
  onClose,
  onSaved,
}: {
  item: ActionItem | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveAction, null);

  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;
  useEffect(() => {
    if (state?.ok) onSavedRef.current(state.message);
  }, [state]);

  return (
    <Modal title={item ? "Edit action item" : "New action item"} onClose={onClose}>
      <form action={action} className="light" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {item && <input type="hidden" name="id" value={item.id} />}
        <div className="field">
          <label htmlFor="af-title">Action</label>
          <input id="af-title" name="title" required maxLength={300} defaultValue={item?.title} />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="af-owner">Owner</label>
            <input id="af-owner" name="owner" maxLength={120} defaultValue={item?.owner ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="af-due">Due date</label>
            <input id="af-due" name="due_date" type="date" defaultValue={item?.due_date ?? ""} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="af-status">Status</label>
          <select id="af-status" name="status" defaultValue={item?.status ?? "open"}>
            {ACTION_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="af-note">Notes</label>
          <textarea id="af-note" name="note" rows={3} maxLength={2000} defaultValue={item?.note ?? ""} />
        </div>
        {!state?.ok && <FormMessage state={state} />}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-pill" disabled={pending}>
            {pending ? "Saving…" : item ? "Save Changes" : "Add Action"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
