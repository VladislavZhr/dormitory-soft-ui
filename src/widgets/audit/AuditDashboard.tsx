"use client";

import * as React from "react";

// 1) Фіча “audit” уже вміє все (контейнер + модалки + експорт)
import AuditContainer from "@/features/audit/ui/AuditContainer";

// 2) Віджет — це тонка оболонка без бізнес-логіки.
//    Якщо захочеш, сюди можна додати хедер, хлебні кришки, wrapper-стилі тощо.
export default function AuditDashboard() {
  return (
    <section className="w-full">
      <AuditContainer />
    </section>
  );
}
