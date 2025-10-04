// src/features/audit/lib/exportXlsx.ts
"use client";

import type { Snapshot } from "../model/contracts";

// Опційно: можна передати кастомну назву файлу
export async function exportSnapshotToXLSX(s: Snapshot, fileName = `inventory_${s.date}.xlsx`) {
  // динамічний імпорт — щоб не роздувати бандл до першого натискання "Експорт"
  const ExcelJS = (await import("exceljs")).default;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Інвентаризація", {
    views: [{ state: "frozen", ySplit: 2 }], // фіксуємо заголовок + рядок шапки
    properties: { defaultRowHeight: 18 },
  });

  // 1) Титул (мерджимо A1:D1)
  ws.mergeCells("A1:D1");
  const title = ws.getCell("A1");
  title.value = `Інвентаризація від ${s.date} — Видано: ${s.sumIssued} · Доступно: ${s.sumAvailable} · Загалом: ${s.sumTotal}`;
  title.font = { bold: true, size: 14 };
  title.alignment = { vertical: "middle", horizontal: "left" };

  // 2) Шапка таблиці
  ws.addRow(["Предмет", "Видано", "Доступно", "Загалом"]);
  const header = ws.getRow(2);
  header.font = { bold: true };
  header.alignment = { vertical: "middle", horizontal: "center" };
  header.height = 22;
  header.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }; // slate-100
    c.border = {
      top: { style: "thin", color: { argb: "FFE2E8F0" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
  });

  // 3) Тіло
  for (const r of s.rows) {
    ws.addRow([r.name, r.issued, r.available, r.total]);
  }

  // 4) Підсумок (жирний рядок)
  const sumRow = ws.addRow(["Підсумок", s.sumIssued, s.sumAvailable, s.sumTotal]);
  sumRow.font = { bold: true };
  sumRow.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }; // легка підложка
    c.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });

  // 5) Колонки: ширини та формати
  ws.columns = [
    { key: "name", width: 36 }, // Предмет
    { key: "issued", width: 12, style: { alignment: { horizontal: "center" }, numFmt: "0" } },
    { key: "available", width: 12, style: { alignment: { horizontal: "center" }, numFmt: "0" } },
    { key: "total", width: 12, style: { alignment: { horizontal: "center" }, numFmt: "0" } },
  ];

  // 6) Легка "зебра" для читабельності (рядки з 3-го до передостаннього)
  for (let r = 3; r < ws.rowCount; r++) {
    if (r % 2 === 1) continue; // фарбуємо лише парні
    ws.getRow(r).eachCell((c) => {
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAFA" } };
    });
  }

  // 7) Центруємо числа, ліворуч назви, рамки по тілу
  for (let r = 3; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    for (let c = 1; c <= 4; c++) {
      const cell = row.getCell(c);
      cell.border = {
        top: { style: "thin", color: { argb: "FFF1F5F9" } },
        left: { style: "thin", color: { argb: "FFF1F5F9" } },
        bottom: { style: "thin", color: { argb: "FFF1F5F9" } },
        right: { style: "thin", color: { argb: "FFF1F5F9" } },
      };
    }
  }

  // 8) Генеруємо файл і завантажуємо
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
