"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Modal } from "@/components/Modal";
import type { Vendor } from "@/lib/types";

const Ctx = createContext<(slug: string) => void>(() => {});

export function VendorModalProvider({ vendors, children }: { vendors: Vendor[]; children: React.ReactNode }) {
  const [slug, setSlug] = useState<string | null>(null);
  const open = useCallback((s: string) => setSlug(s), []);
  const close = useCallback(() => setSlug(null), []);
  const vendor = vendors.find((v) => v.slug === slug);
  const total = vendors.reduce((s, v) => s + (v.annual_cost ?? 0), 0);

  return (
    <Ctx.Provider value={open}>
      {children}
      {vendor && (
        <Modal title={vendor.name} onClose={close}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span className={`badge tone-${vendor.status_tone ?? "upcoming"}`}>{vendor.status_label}</span>
            <span style={{ color: "#6B7A6F", fontSize: 13, fontWeight: 600 }}>{vendor.role}</span>
          </div>
          <p style={{ color: "var(--ink-2)", fontSize: 15, lineHeight: 1.65 }}>{vendor.detail}</p>
          <div className="paper" style={{ padding: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "var(--cream)" }}>
            <div>
              <div className="tracked" style={{ fontSize: 10.5, fontWeight: 700, color: "var(--khaki)" }}>Cost</div>
              <div className="display" style={{ fontSize: 20, color: "var(--forest-700)" }}>{vendor.cost_label}</div>
            </div>
            <div>
              <div className="tracked" style={{ fontSize: 10.5, fontWeight: 700, color: "var(--khaki)" }}>Share of vendor spend</div>
              <div className="display" style={{ fontSize: 20, color: "var(--forest-700)" }}>
                {total && vendor.annual_cost ? `${((vendor.annual_cost / total) * 100).toFixed(1)}%` : "—"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <a className="btn-ghost" href="#timeline-section" onClick={close}>See timeline</a>
            <button type="button" className="btn-pill" onClick={close}>Done</button>
          </div>
        </Modal>
      )}
    </Ctx.Provider>
  );
}

export function VendorButton({
  slug,
  className,
  style,
  children,
  label,
}: {
  slug: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  label?: string;
}) {
  const open = useContext(Ctx);
  return (
    <button type="button" className={className} style={style} onClick={() => open(slug)} aria-label={label}>
      {children}
    </button>
  );
}
