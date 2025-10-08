// TypeScript strict
// Серверний компонент: підхоплює клієнтський контейнер фічі

import { Suspense } from "react";

import DashboardContainer from "@/features/dashboard/ui/DashboardContainer";

export const dynamic = "force-dynamic"; // щоб дані не кешувалися під час деву

export default function DashboardDetails() {
  return (
    <Suspense fallback={<div className="text-slate-600">Завантаження…</div>}>
      <DashboardContainer />
    </Suspense>
  );
}
