// src/app/(private)/layout.tsx
// TypeScript strict
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import * as React from "react";

import RequireAuth from "@/features/auth/login/guards/RequireAuth";
import Sidebar from "@/shared/ui/Sidebar";

export default function PrivateLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Sidebar />
          {children}
        </main>
      </div>
    </RequireAuth>
  );
}
