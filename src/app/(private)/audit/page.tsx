"use client";

import * as React from "react";

import AuditDashboard from "@/widgets/audit/AuditDashboard";

export default function InventoryPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AuditDashboard />
      </div>
    </main>
  );
}
