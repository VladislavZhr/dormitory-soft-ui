// src/features/student-inventory/ui/StudentInventorySection.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Student } from '@/entities/student/model/types';
import type {
  InventoryHistoryRow,
  InventoryKind, // рядковий юніон
  StudentInventoryItem, // має: id, kind, quantity, issuedAt, returnedAt|null
} from '@/entities/student-inventory/model/types';
import {
  listStudentItems,
  issueItem,
  returnItem,
  listStudentLogs,
} from '@/features/student-inventory/api/client';
import { exportInventoryExcel } from '@/features/student-inventory/lib/exportInventoryExcel';
import InventoryHistoryTable from '@/features/student-inventory/ui/InventoryHistoryTable';
import InventoryTable from '@/features/student-inventory/ui/InventoryTable';
import { IssueControls } from '@/features/student-inventory/ui/IssueControls';

// ───────────────────────── helpers ─────────────────────────
function toTs(iso?: string): number {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

function isErrorWithMessage(e: unknown): e is { message: string } {
  return (
    typeof e === 'object' &&
    e !== null &&
    'message' in e &&
    typeof (e as { message: unknown }).message === 'string'
  );
}

// ───────────────────────── aggregation ─────────────────────────
export type AggregatedItem = {
  kind: InventoryKind;
  qty: number;
};

/** Агрегуємо лише АКТИВНІ видання (returnedAt === null). */
function aggregateByKind(raw: readonly StudentInventoryItem[]): AggregatedItem[] {
  const map = new Map<InventoryKind, number>();

  for (const it of raw) {
    if ((it as { returnedAt?: unknown }).returnedAt !== null) continue; // рахуємо тільки активні

    const k = it.kind as InventoryKind;
    const inc =
      typeof (it as { quantity?: unknown }).quantity === 'number'
        ? (it as { quantity: number }).quantity
        : Number((it as { quantity?: unknown }).quantity ?? 0);

    if (Number.isFinite(inc) && inc > 0) {
      map.set(k, (map.get(k) ?? 0) + inc);
    }
  }

  return Array.from(map.entries())
    .map<AggregatedItem>(([kind, qty]) => ({ kind, qty }))
    .sort((a, b) => a.kind.localeCompare(b.kind));
}

/** Інкремент/декремент агрегату по виду (оптимістичні апдейти). */
function adjustKind(
  prev: ReadonlyArray<AggregatedItem>,
  kind: InventoryKind,
  delta: number,
): AggregatedItem[] {
  const idx = prev.findIndex((p) => p.kind === kind);

  if (idx < 0) {
    const q = Math.max(0, delta);
    return q > 0
      ? [...prev, { kind, qty: q }].sort((a, b) => a.kind.localeCompare(b.kind))
      : [...prev];
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
export default function StudentInventorySection(props: {
  student: Student; // ⬅️ ДОДАНО: для друку в Excel
  studentId: number | string;
  kinds?: InventoryKind[];
}) {
  const { student, studentId, kinds = [] } = props;

  // приводимо до number
  const studentIdNum = useMemo<number>(() => {
    const n = typeof studentId === 'string' ? Number(studentId) : studentId;
    if (!Number.isFinite(n)) throw new Error('Invalid studentId: must be a number');
    return n;
  }, [studentId]);

  const [items, setItems] = useState<AggregatedItem[]>([]);
  const [logs, setLogs] = useState<InventoryHistoryRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [opLoading, setOpLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const availableKinds = useMemo<InventoryKind[]>(
    () => (Array.isArray(kinds) && kinds.length > 0 ? kinds : []),
    [kinds],
  );

  // первинне завантаження
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [itemsArr, logsArr] = await Promise.all([
          listStudentItems(studentIdNum),
          listStudentLogs(studentIdNum),
        ]);
        if (!alive) return;

        const safeItems: StudentInventoryItem[] = Array.isArray(itemsArr) ? itemsArr : [];
        const aggregated = aggregateByKind(safeItems);
        setItems(aggregated);

        const safeLogs: InventoryHistoryRow[] = Array.isArray(logsArr) ? logsArr : [];
        const sortedLogs = safeLogs.slice().sort((a, b) => toTs(b.date) - toTs(a.date));
        setLogs(sortedLogs);
      } catch (e: unknown) {
        if (!alive) return;
        setError(isErrorWithMessage(e) ? e.message : 'Помилка завантаження');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [studentIdNum]);

  const refreshLogs = useCallback(async (): Promise<void> => {
    try {
      const arr = await listStudentLogs(studentIdNum);
      const safeLogs: InventoryHistoryRow[] = Array.isArray(arr) ? arr : [];
      const sorted = safeLogs.slice().sort((a, b) => toTs(b.date) - toTs(a.date));
      setLogs(sorted);
    } catch (e: unknown) {
      console.error('Не вдалося оновити історію:', e);
    }
  }, [studentIdNum]);

  // ВИДАТИ (+qty)
  const handleIssue = useCallback(
    async (kind: InventoryKind, qty: number): Promise<void> => {
      if (!Number.isFinite(qty) || qty <= 0) return;

      setOpLoading(true);
      setError(null);
      try {
        setItems((prev) => adjustKind(prev, kind, qty)); // оптимістично
        await issueItem({ studentId: studentIdNum, kind, quantity: qty });
        await refreshLogs();
      } catch (e: unknown) {
        setItems((prev) => adjustKind(prev, kind, -qty)); // відкат
        setError(isErrorWithMessage(e) ? e.message : 'Помилка видачі');
      } finally {
        setOpLoading(false);
      }
    },
    [studentIdNum, refreshLogs],
  );

  // ПОВЕРНУТИ (-qty)
  const handleReturn = useCallback(
    async (kind: InventoryKind, qty: number): Promise<void> => {
      if (!Number.isFinite(qty) || qty <= 0) return;

      setOpLoading(true);
      setError(null);
      try {
        setItems((prev) => adjustKind(prev, kind, -qty)); // оптимістично
        await returnItem({ studentId: studentIdNum, kind, quantity: qty });
        await refreshLogs();
      } catch (e: unknown) {
        setItems((prev) => adjustKind(prev, kind, qty)); // відкат
        setError(isErrorWithMessage(e) ? e.message : 'Помилка повернення');
      } finally {
        setOpLoading(false);
      }
    },
    [studentIdNum, refreshLogs],
  );

  // Експорт Excel (локально, без бекенду)
  const handleExport = useCallback(async (): Promise<void> => {
    // Беремо актуальні значення зі стейту і дані студента з пропів:
    exportInventoryExcel({
      student,
      items,
      // filename: `Інвентар_${student.fullName.replace(/\s+/g, '_')}_кімн_${student.roomNumber}.xlsx`,
    });
  }, [student, items]);

  // Підсвічуємо UI як "disabled" під час операцій/завантаження (кнопки «Видати» не блокуємо фізично)
  const controlsDisabled = opLoading || loading || availableKinds.length === 0;

  // Види, які реально можна повернути (є в активних залишках)
  const returnableKinds = useMemo<InventoryKind[]>(
    () => items.filter((x) => x.qty > 0).map((x) => x.kind),
    [items],
  );

  return (
    <section className="flex w-full flex-col gap-4">
      <IssueControls
        kinds={availableKinds} // юніон рядків
        returnableKinds={returnableKinds} // тільки те, що реально можна повернути
        onIssueAction={handleIssue}
        onReturnAction={handleReturn}
        onExportAction={handleExport} // ⬅️ фронтовий Excel
        disabled={controlsDisabled}
      />

      {(loading || opLoading) && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          {loading ? 'Завантаження…' : 'Виконуємо операцію…'}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row">
        <InventoryTable rows={items} />
        <InventoryHistoryTable rows={logs} />
      </div>
    </section>
  );
}
