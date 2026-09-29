"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/actions";
import { Icon } from "@/components/Icon";
import type { Viewer } from "@/lib/data";

export function Topbar({ viewer }: { viewer: Viewer }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync from the URL (e.g. back/forward) unless the user is mid-typing.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setQ(params.get("q") ?? "");
  }, [params]);

  // Live-filter the overview as you type; elsewhere, Enter jumps to the overview.
  useEffect(() => {
    if (pathname !== "/admin") return;
    const t = setTimeout(() => {
      const current = params.get("q") ?? "";
      if (current === q) return;
      router.replace(q ? `/admin?q=${encodeURIComponent(q)}` : "/admin", { scroll: false });
    }, 200);
    return () => clearTimeout(t);
  }, [q, pathname, params, router]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="topbar">
      <div>
        <div className="tracked eyebrow">Internal — Not For Distribution</div>
        <Link href="/admin" className="display title">Board &amp; Staff Dashboard</Link>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <form
          role="search"
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(q ? `/admin?q=${encodeURIComponent(q)}` : "/admin");
          }}
        >
          <Icon name="search" size={15} />
          <label htmlFor="admin-search" className="sr-only">Search</label>
          <input
            ref={inputRef}
            id="admin-search"
            type="search"
            placeholder="Search meetings, vendors…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button type="button" className="icon-btn" style={{ width: 22, height: 22 }} aria-label="Clear search" onClick={() => setQ("")}>
              <Icon name="close" size={12} />
            </button>
          )}
        </form>
        <Link href="/" className="btn-ghost">Public View</Link>
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            type="button"
            className="avatar-btn"
            aria-haspopup="menu"
            aria-expanded={menu}
            aria-label="Account menu"
            onClick={() => setMenu((m) => !m)}
          >
            {viewer.initials}
          </button>
          {menu && (
            <div className="menu" role="menu">
              <div className="who">
                Signed in as
                <br />
                <b style={{ color: "var(--ink)" }}>{viewer.name ?? viewer.email}</b>
              </div>
              <Link href="/admin/meetings" role="menuitem" onClick={() => setMenu(false)}>Meeting notes</Link>
              <Link href="/admin/inbox" role="menuitem" onClick={() => setMenu(false)}>Requests &amp; subscribers</Link>
              <Link href="/" role="menuitem" onClick={() => setMenu(false)}>Public view</Link>
              <form action={signOut}>
                <button type="submit" role="menuitem" style={{ width: "100%", color: "var(--tone-blocked-fg)" }}>Sign out</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
