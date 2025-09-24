"use client";

import { memo } from "react";

type AlertProps = {
  type: "success" | "error";
  children: string;
};

function AlertImpl({ type, children }: AlertProps) {
  const cls = type === "success" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200";

  return (
    <div className={`mb-4 rounded-lg px-3 py-2 text-sm ring-1 ${cls}`} role="status" aria-live="polite">
      {children}
    </div>
  );
}

const Alert = memo(AlertImpl);
export default Alert;
