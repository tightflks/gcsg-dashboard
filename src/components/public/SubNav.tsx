"use client";

import { useEffect, useState } from "react";

const LINKS = [
  ["status", "Vendor Status"],
  ["budget", "Budget"],
  ["serve", "Who We Serve"],
  ["works", "How Help Works"],
  ["team", "Board"],
  ["timeline-section", "Timeline"],
] as const;

export function SubNav() {
  const [active, setActive] = useState<string>("status");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );
    LINKS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="subnav" aria-label="Page sections">
      {LINKS.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          className={`tracked${active === id ? " active" : ""}`}
          onClick={() => setActive(id)}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
