// strict: true
// src/features/student-inventory/lib/exportInventoryExcel.ts
import ExcelJS from 'exceljs';

import type { Student } from '@/entities/student/model/types';
import { type InventoryKind, InventoryKindEnum } from '@/entities/student-inventory/model/types';
import { INVENTORY_KIND_LABELS } from '@/features/student-inventory/model/mappers';

export type InventoryRow = {
  kind: InventoryKind;
  qty: number;
};

// —————— налаштовувані довідники під шаблон ——————
const ITEM_ORDER: string[] = [
  'Матрац',
  'Чохол',
  'Подушка',
  'Ковдра',
  'Наволочки',
  'Простирадла',
  'Покривала',
  'Підковдра',
  'К-т білизни',
  'Штори',
  'Рушник',
  'Тюль',
];

// Якщо твої InventoryKind → мають інші “технічні” значення — замап будь-як:
const LABEL_BY_KIND: Record<string, string> = {
  Матрац: 'Матрац',
  Чохол: 'Чохол',
  Подушка: 'Подушка',
  Ковдра: 'Ковдра',
  Наволочки: 'Наволочки',
  Простирадла: 'Простирадла',
  Покривала: 'Покривала',
  Підковдра: 'Підковдра',
  'К-т білизни': 'К-т білизни',
  Штори: 'Штори',
  Рушник: 'Рушник',
  Тюль: 'Тюль',
};

// —————— головна функція експорту ——————
export async function exportInventoryExcel(args: {
  student: Student;
  items: ReadonlyArray<InventoryRow>;
  dormitoryNo?: string | number; // “Гуртожиток №”
  roomNoOverride?: string | number; // якщо хочеш перекрити student.roomNumber
  filename?: string;
}): Promise<void> {
  const { student, items, dormitoryNo = 8, roomNoOverride, filename } = args;

  // побудуємо швидкий lookup кількості по людських назвах рядків
  const qtyByLabel = new Map<string, number>();
  for (const r of items) {
    const label = INVENTORY_KIND_LABELS[r.kind as InventoryKindEnum] ?? String(r.kind);
    qtyByLabel.set(label, (qtyByLabel.get(label) ?? 0) + Number(r.qty || 0));
  }

  // ——— створення книги / листа ———
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Арматурний список №2', {
    properties: { defaultRowHeight: 18 },
    pageSetup: {
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      orientation: 'portrait',
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    },
    //views: [{ state: 'frozen', ySplit: 8 }], // фіксуємо шапку таблиці
  });

  // 14 колонок: A..N
  ws.columns = [
    { key: 'colA', width: 6 }, // № п/п
    { key: 'colB', width: 24 }, // Найменування речей
    { key: 'colC', width: 6 }, // Блок 1: Одержано К-ть
    { key: 'colD', width: 18 }, // Блок 1: Підпис про одержання
    { key: 'colE', width: 6 }, // Блок 1: Повернуто К-ть
    { key: 'colF', width: 14 }, // Блок 1: Підпис
    { key: 'colG', width: 6 }, // Блок 2: Одержано К-ть
    { key: 'colH', width: 18 }, // Блок 2: Підпис про одержання
    { key: 'colI', width: 6 }, // Блок 2: Повернуто К-ть
    { key: 'colJ', width: 14 }, // Блок 2: Підпис
    { key: 'colK', width: 6 }, // Блок 3: Одержано К-ть
    { key: 'colL', width: 18 }, // Блок 3: Підпис про одержання
    { key: 'colM', width: 6 }, // Блок 3: Повернуто К-ть
    { key: 'colN', width: 14 }, // Блок 3: Підпис
  ];

  const borderThin = { style: 'thin' as const, color: { argb: 'FF000000' } };
  const cellBorder = { top: borderThin, left: borderThin, bottom: borderThin, right: borderThin };

  // товста нижня лінія
  const mediumBottom = { style: 'medium' as const, color: { argb: 'FF000000' } };

  /** Перетворює A1-адресу (наприклад "C3") у {row, col} */
  function a1ToRC(a1: string): { row: number; col: number } {
    const m = /^([A-Z]+)(\d+)$/.exec(a1.toUpperCase());
    if (!m) throw new Error(`Invalid A1 address: ${a1}`);

    const colLetters = m[1]!; // тепер точно string
    const rowStr = m[2]!; // теж string

    let col = 0;
    for (let i = 0; i < colLetters.length; i++) {
      col = col * 26 + (colLetters.charCodeAt(i) - 64); // 'A' = 65
    }
    return { row: parseInt(rowStr, 10), col };
  }

  /** Підкреслює (bottom border) клітинки у діапазоні A1 (наприклад "C3:F3"). */
  function underlineRange(rangeA1: string) {
    const [fromRaw, toRaw] = rangeA1.split(':');
    const from = fromRaw!; // завжди є
    const to = toRaw ?? from; // якщо немає ':', беремо одну комірку

    const s = a1ToRC(from);
    const e = a1ToRC(to);

    for (let r = s.row; r <= e.row; r++) {
      for (let c = s.col; c <= e.col; c++) {
        const cell = ws.getRow(r).getCell(c); // тут точно number
        cell.border = { ...(cell.border ?? {}), bottom: mediumBottom };
      }
    }
  }

  // ─── 1) Заголовки ───
  ws.mergeCells('A1:N1');
  ws.getCell('A1').value = 'АРМАТУРНИЙ СПИСОК №2';
  ws.getCell('A1').font = { bold: true, size: 18, underline: true };
  ws.getCell('A1').alignment = { horizontal: 'center' };

  ws.mergeCells('A2:N2');
  ws.getCell('A2').value = 'речей, виданих студенту КПІ ім. Ігоря Сікорського';
  ws.getCell('A2').font = { bold: true, size: 14, underline: true };
  ws.getCell('A2').alignment = { horizontal: 'center' };

  // ─── ПРОПУСК після підзаголовка ───
  ws.spliceRows(3, 0, []);
  ws.getRow(3).height = 9;

  // ─── 2) Рядок 4: «Гуртожиток № 8   Кімната № 103» ───
  // Лівий блок (лейбл праворуч, підкреслений)
  ws.mergeCells('A4:C4');
  ws.getCell('A4').value = 'Гуртожиток №';
  ws.getCell('A4').font = { bold: true, size: 14, underline: true };
  ws.getCell('A4').alignment = { horizontal: 'right', vertical: 'bottom' };

  // Значення гуртожитку (підкреслений блок, число по центру)
  ws.mergeCells('D4:F4');
  ws.getCell('D4').value = String(dormitoryNo ?? '');
  ws.getCell('D4').font = { bold: true, size: 16 };
  ws.getCell('D4').alignment = { horizontal: 'center', vertical: 'bottom' };
  underlineRange('D4:F4');

  // Правий блок (лейбл)
  ws.mergeCells('G4:I4');
  ws.getCell('G4').value = 'Кімната №';
  ws.getCell('G4').font = { bold: true, size: 14, underline: true };
  ws.getCell('G4').alignment = { horizontal: 'right', vertical: 'bottom' };

  // Значення кімнати
  ws.mergeCells('J4:N4');
  ws.getCell('J4').value = String(roomNoOverride ?? student?.roomNumber ?? '');
  ws.getCell('J4').font = { bold: true, size: 14 };
  ws.getCell('J4').alignment = { horizontal: 'center', vertical: 'bottom' };
  underlineRange('J4:N4');

  ws.getRow(4).height = 18;

  // ─── ПРОПУСК після «Кімната № …» ───
  ws.spliceRows(5, 0, []);
  ws.getRow(5).height = 9;

  // ─── 3) Рядок 6: ПІБ — лейбл праворуч, значення ліворуч ───
  ws.mergeCells('A6:D6');
  ws.getCell('A6').value = "Прізвище, ім'я , по батькові: ";
  ws.getCell('A6').font = { bold: true, size: 16, underline: true };
  ws.getCell('A6').alignment = { horizontal: 'right', vertical: 'bottom' };

  ws.mergeCells('E6:N6');
  ws.getCell('E6').value = String(student?.fullName ?? '');
  ws.getCell('E6').font = { bold: true, size: 16 };
  ws.getCell('E6').alignment = { horizontal: 'center', vertical: 'bottom' };
  underlineRange('E6:N6');

  ws.getRow(6).height = 18;

  // ─── ПРОПУСК після ПІБу ───
  ws.spliceRows(7, 0, []);
  ws.getRow(7).height = 9;

  // ─── 4) Рядок 8: Факультет / курс / група ───
  ws.mergeCells('A8:B8');
  ws.getCell('A8').value = 'Факультет:';
  ws.getCell('A8').font = { bold: true, size: 14, underline: true };
  ws.getCell('A8').alignment = { horizontal: 'right', vertical: 'bottom' };

  ws.mergeCells('C8:E8');
  ws.getCell('C8').value = String(student?.faculty ?? '');
  ws.getCell('C8').font = { bold: true, size: 16 };
  ws.getCell('C8').alignment = { horizontal: 'center', vertical: 'bottom' };
  underlineRange('C8:E8');

  // «курс»
  ws.getCell('F8').value = 'курс:';
  ws.getCell('F8').font = { bold: true, size: 14 };
  ws.getCell('F8').alignment = { horizontal: 'right', vertical: 'bottom' };

  ws.mergeCells('G8:H8');
  ws.getCell('G8').value = ''; // ручний ввід
  ws.getCell('G8').alignment = { horizontal: 'center', vertical: 'bottom' };
  underlineRange('G8:H8');

  // «група»
  ws.mergeCells('I8:J8');
  ws.getCell('I8').value = 'група:';
  ws.getCell('I8').font = { bold: true, size: 14 };
  ws.getCell('I8').alignment = { horizontal: 'right', vertical: 'bottom' };

  ws.mergeCells('K8:N8');
  ws.getCell('K8').value = String(student?.studyGroup ?? '');
  ws.getCell('K8').font = { bold: true, size: 16 };
  ws.getCell('K8').alignment = { horizontal: 'center', vertical: 'bottom' };
  underlineRange('K8:N8');

  ws.getRow(8).height = 18;

  // ─── ПРОПУСК після «група» ───
  ws.spliceRows(9, 0, []);
  ws.getRow(9).height = 9;

  // ─── ШАПКА ТАБЛИЦІ ─────────────────────────────────────────
  const headerTopRow = 10; // рядок з "Одержано"/"Повернуто"
  const headerBottomRow = 11; // рядок з "К-ть"/"Підпис ..."

  // 1) Перші дві колонки (№ п/п, Найменування речей) — вертикально злиті
  ws.mergeCells(`A${headerTopRow}:A${headerBottomRow}`);
  ws.mergeCells(`B${headerTopRow}:B${headerBottomRow}`);
  ws.getCell(`A${headerTopRow}`).value = '№ п/п';
  ws.getCell(`B${headerTopRow}`).value = 'Найменування речей';

  // 2) Три повторювані блоки по 4 колонки: [C..F], [G..J], [K..N]
  //    Кожен блок має два злиття у верхньому рядку:
  //    (1) Одержано → 2 колонки, (2) Повернуто → 2 колонки
  type Quad = { start: string; cols: [string, string, string, string] }; // [qty, sign, qty, sign]
  const quads: Quad[] = [
    { start: 'C', cols: ['C', 'D', 'E', 'F'] },
    { start: 'G', cols: ['G', 'H', 'I', 'J'] },
    { start: 'K', cols: ['K', 'L', 'M', 'N'] },
  ];

  function colShift(letter: string, shift: number) {
    return String.fromCharCode(letter.charCodeAt(0) + shift);
  }

  for (const q of quads) {
    // верхній рядок: два окремі злиття по 2 колонки
    ws.mergeCells(`${q.cols[0]}${headerTopRow}:${q.cols[1]}${headerTopRow}`); // C7:D7
    ws.getCell(`${q.cols[0]}${headerTopRow}`).value = 'Одержано';

    ws.mergeCells(`${q.cols[2]}${headerTopRow}:${q.cols[3]}${headerTopRow}`); // E7:F7
    ws.getCell(`${q.cols[2]}${headerTopRow}`).value = 'Повернуто';

    // нижній рядок підписів
    ws.getCell(`${q.cols[0]}${headerBottomRow}`).value = 'К-ть';
    ws.getCell(`${q.cols[1]}${headerBottomRow}`).value = 'Підпис про одержання';
    ws.getCell(`${q.cols[2]}${headerBottomRow}`).value = 'К-ть';
    ws.getCell(`${q.cols[3]}${headerBottomRow}`).value = 'Підпис';
  }

  // 3) Стилі для обох рядків шапки
  for (const r of [headerTopRow, headerBottomRow]) {
    const row = ws.getRow(r);
    for (let col = 1; col <= 14; col++) {
      const cell = row.getCell(col);
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.font = { bold: true };
      cell.border = cellBorder;
    }
  }
  ws.getRow(headerTopRow).height = 22;
  ws.getRow(headerBottomRow).height = 36;

  // ——— дані рядків (1..ITEM_ORDER.length) ———
  let rowIdx = headerBottomRow + 1;
  for (let i = 0; i < ITEM_ORDER.length; i++) {
    const name = ITEM_ORDER[i]!;
    const r = ws.getRow(rowIdx);

    r.getCell(1).value = i + 1; // №
    r.getCell(2).value = name; // Назва

    // Автозаповнення тільки першого блоку "Одержано/К-ть" (C)
    const qty = qtyByLabel.get(name) ?? 0;
    r.getCell(3).value = qty > 0 ? qty : ''; // C = кількість одержано
    // інші клітинки лишаємо порожні для ручного вводу

    // стилі рядка
    for (let c = 1; c <= 14; c++) {
      const cell = r.getCell(c);
      cell.border = cellBorder;
      cell.alignment =
        c === 2
          ? { vertical: 'middle', horizontal: 'left' }
          : { vertical: 'middle', horizontal: 'center' };
    }
    r.height = 20;
    rowIdx++;
  }

  // ——— кілька порожніх “запасних” рядків (як у бланку) ———
  for (let extra = 0; extra < 3; extra++) {
    const r = ws.getRow(rowIdx++);
    for (let c = 1; c <= 14; c++) {
      const cell = r.getCell(c);
      cell.border = cellBorder;
      cell.alignment =
        c === 2
          ? { vertical: 'middle', horizontal: 'left' }
          : { vertical: 'middle', horizontal: 'center' };
    }
    r.height = 20;
  }

  // ——— нижні примітки/підписи за потреби (можеш додати) ———
  ws.addRow([]);

  // ——— збереження ———
  const outName =
    filename ??
    `Арматурний_список_№2_${(student.fullName || '').replace(/\s+/g, '_')}_кімн_${String(
      roomNoOverride ?? student.roomNumber ?? '',
    )}.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = outName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

// —————— утиліта для зсуву літери колонки (C→D→E→F) ——————
function nextCol(col: string): string {
  const code = col.toUpperCase().charCodeAt(0);
  return String.fromCharCode(code + 1);
}
