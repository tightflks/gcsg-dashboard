"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/app/actions";
import { Icon, type IconName } from "@/components/Icon";

const NAV: { href: string; label: string; icon: IconName; hash?: string }[] = [
  { href: "/admin", label: "Overview", icon: "home" },
  { href: "/admin#actions", label: "Action Items", icon: "check", hash: "actions" },
  { href: "/admin#budget", label: "Budget & Vendors", icon: "chart", hash: "budget" },
  { href: "/admin#timeline", label: "Timeline", icon: "calendar", hash: "timeline" },
  { href: "/admin/meetings", label: "Meeting Notes", icon: "book" },
  { href: "/admin/inbox", label: "Requests & Subscribers", icon: "mail" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(window.location.hash.slice(1));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  const isActive = (item: (typeof NAV)[number]) => {
    const base = item.href.split("#")[0]!;
    if (item.hash) return pathname === "/admin" && hash === item.hash;
    if (base === "/admin") return pathname === "/admin" && !hash;
    return pathname.startsWith(base);
  };

  return (
    <aside className="sidebar">
      <Link href="/admin" className="logo" aria-label="Dashboard home" onClick={() => setHash("")}>GC</Link>
      <nav aria-label="Dashboard">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`side-btn${isActive(item) ? " active" : ""}`}
            aria-label={item.label}
            onClick={() => setHash(item.hash ?? "")}
          >
            <Icon name={item.icon} />
            <span className="tip">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div style={{ flexGrow: 1 }} />
      <form action={signOut}>
        <button type="submit" className="side-btn" aria-label="Sign out">
          <Icon name="logout" />
          <span className="tip">Sign out</span>
        </button>
      </form>
    </aside>
  );
}
