"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/lib/types";

type Option<T extends string> = { value: T; label: string; tone: Tone };

/** A status badge that opens a menu of statuses when clicked. */
export function StatusPicker<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0]!;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="status-wrap" ref={ref}>
      <button
        type="button"
        className={`badge tone-${current.tone}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Change status"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        {current.label} ▾
      </button>
      {open && (
        <div className="status-menu" role="listbox">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              className={`badge tone-${o.tone}`}
              style={{ outline: o.value === value ? "2px solid rgba(22,71,47,.25)" : undefined }}
              onClick={() => {
                setOpen(false);
                if (o.value !== value) onChange(o.value);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
