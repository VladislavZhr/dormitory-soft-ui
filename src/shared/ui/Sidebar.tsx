"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={rootRef} className="sb-root">
      <button
        type="button"
        className={`sb-burger md:hidden ${open ? "is-open" : ""}`}
        aria-label="Відкрити меню"
        aria-expanded={open}
        aria-controls="side-menu"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <span className="line" />
        <span className="line" />
        <span className="line" />
      </button>

      <div
        className={`menu-trigger desktop hidden md:flex ${open ? "is-open" : "is-closed"}`}
        role="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="side-menu"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
      >
        <div className="bars" aria-hidden>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p>MENU</p>
      </div>

      <nav id="side-menu" className={`menu ${open ? "is-open" : ""}`} aria-hidden={!open} onClick={(e) => e.stopPropagation()}>
        <ul>
          <li>
            <Link href="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link href="/profile">Profile</Link>
          </li>
          <li>
            <Link href="/audit">Audit</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
