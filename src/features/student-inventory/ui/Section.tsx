// src/features/student-inventory/ui/StudentInventorySection.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Student } from "@/entities/student/model/types";
import type {
  InventoryKind, // рядковий юніон
  StudentInventoryItem, // має: id, kind, quantity, issuedAt, returnedAt|null
} from "@/entities/student-inventory/model/types";
import { listStudentItems, issueItem, returnItem } from "@/features/student-inventory/api/client";
import { exportInventoryExcel } from "@/features/student-inventory/lib/exportInventoryExcel";
import InventoryTable from "@/features/student-inventory/ui/InventoryTable";
import { IssueControls } from "@/features/student-inventory/ui/IssueControls";

// ───────────────────────── helpers ─────────────────────────
function isErrorWithMessage(e: unknown): e is { message: string } {
  return typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string";
}

// ───────────────────────── aggregation ─────────────────────────
export type AggregatedItem = {
  kind: InventoryKind;
  qty: number;
};

/** Агрегуємо лише активні видання (returnedAt === null). */
function aggregateByKind(raw: readonly StudentInventoryItem[]): AggregatedItem[] {
  const map = new Map<InventoryKind, number>();

  for (const it of raw) {
    if ((it as { returnedAt?: unknown }).returnedAt !== null) continue;

    const k = it.kind as InventoryKind;
    const inc = typeof (it as { quantity?: unknown }).quantity === "number" ? (it as { quantity: number }).quantity : Number((it as { quantity?: unknown }).quantity ?? 0);

    if (Number.isFinite(inc) && inc > 0) {
      map.set(k, (map.get(k) ?? 0) + inc);
    }
  }

  return Array.from(map.entries())
    .map(([kind, qty]) => ({ kind, qty }))
    .sort((a, b) => a.kind.localeCompare(b.kind));
}

/** Інкремент/декремент агрегату по виду (оптимістичні апдейти). */
function adjustKind(prev: ReadonlyArray<AggregatedItem>, kind: InventoryKind, delta: number): AggregatedItem[] {
  const idx = prev.findIndex((p) => p.kind === kind);

  if (idx < 0) {
    const q = Math.max(0, delta);
    return q > 0 ? [...prev, { kind, qty: q }].sort((a, b) => a.kind.localeCompare(b.kind)) : [...prev];
  }

  const next = prev.slice();
  const cur = next[idx]!;
  const newQty = Math.max(0, cur.qty + delta);

  if (newQty === 0) {
    next.splice(idx, 1);
    return next;
  }

  next[idx] = { kind: cur.kind, qty: newQty };
  return next;
}

// ───────────────────────── component ─────────────────────────
export default function StudentInventorySection(props: { student: Student; studentId: number | string; kinds?: InventoryKind[] }) {
  const { student, studentId, kinds = [] } = props;

  const studentIdNum = useMemo(() => {
    const n = typeof studentId === "string" ? Number(studentId) : studentId;
    if (!Number.isFinite(n)) throw new Error("Invalid studentId: must be a number");
    return n;
  }, [studentId]);

  const [items, setItems] = useState<AggregatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableKinds = useMemo(() => (Array.isArray(kinds) && kinds.length > 0 ? kinds : []), [kinds]);

  // Первинне завантаження
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const itemsArr = await listStudentItems(studentIdNum);
        if (!alive) return;

        const safeItems: StudentInventoryItem[] = Array.isArray(itemsArr) ? itemsArr : [];
        const aggregated = aggregateByKind(safeItems);
        setItems(aggregated);
      } catch (e: unknown) {
        if (!alive) return;
        setError(isErrorWithMessage(e) ? e.message : "Помилка завантаження");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [studentIdNum]);

  // ВИДАТИ
  const handleIssue = useCallback(
    async (kind: InventoryKind, qty: number) => {
      if (!Number.isFinite(qty) || qty <= 0) return;

      setOpLoading(true);
      setError(null);
      try {
        setItems((prev) => adjustKind(prev, kind, qty));
        await issueItem({ studentId: studentIdNum, kind, quantity: qty });
      } catch (e: unknown) {
        setItems((prev) => adjustKind(prev, kind, -qty));
        setError(isErrorWithMessage(e) ? e.message : "Помилка видачі");
      } finally {
        setOpLoading(false);
      }
    },
    [studentIdNum],
  );

  // ПОВЕРНУТИ
  const handleReturn = useCallback(
    async (kind: InventoryKind, qty: number) => {
      if (!Number.isFinite(qty) || qty <= 0) return;

      setOpLoading(true);
      setError(null);
      try {
        setItems((prev) => adjustKind(prev, kind, -qty));
        await returnItem({ studentId: studentIdNum, kind, quantity: qty });
      } catch (e: unknown) {
        setItems((prev) => adjustKind(prev, kind, qty));
        setError(isErrorWithMessage(e) ? e.message : "Помилка повернення");
      } finally {
        setOpLoading(false);
      }
    },
    [studentIdNum],
  );

  // Експорт Excel
  const handleExport = useCallback(async () => {
    exportInventoryExcel({ student, items });
  }, [student, items]);

  const controlsDisabled = opLoading || loading || availableKinds.length === 0;

  const returnableKinds = useMemo(() => items.filter((x) => x.qty > 0).map((x) => x.kind), [items]);

  return (
    <section className="flex w-full flex-col gap-4">
      <IssueControls kinds={availableKinds} returnableKinds={returnableKinds} onIssueAction={handleIssue} onReturnAction={handleReturn} onExportAction={handleExport} disabled={controlsDisabled} />

      {(loading || opLoading) && <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{loading ? "Завантаження…" : "Виконуємо операцію…"}</div>}

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <InventoryTable rows={items} />
    </section>
  );
}
