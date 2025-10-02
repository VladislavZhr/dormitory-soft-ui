import {
  type StudentInventoryItem,
  type InventoryHistoryRow,
  type InventoryOp,
  type InventoryKind,
  InventoryKindEnum,
} from '@/entities/student-inventory/model/types';
import { isInventoryKind } from '@/entities/student-inventory/model/types';

import type { StudentInventoryDto } from './contracts';

// DTO → Домен
export function mapDtoToItem(dto: StudentInventoryDto): StudentInventoryItem {
  // Не змінюємо поведінку: якщо бек повернув щось невідоме — зберігаємо, але типово звужуємо.
  const kind = isInventoryKind(dto.kind) ? dto.kind : (dto.kind as InventoryKind);

  return {
    id: dto.id,
    kind,
    quantity: dto.quantity,
    issuedAt: dto.issuedAt,
    returnedAt: dto.returnedAt,
  };
}

// Домен → рядки історії (поки немає окремого ендпоїнта history)
export function itemToHistoryRows(item: StudentInventoryItem): InventoryHistoryRow[] {
  const out: InventoryHistoryRow[] = [];

  out.push({
    id: `${item.id}#issued`,
    date: item.issuedAt,
    op: 'issued' satisfies InventoryOp,
    kind: item.kind,
    quantity: item.quantity,
  });

  if (item.returnedAt) {
    out.push({
      id: `${item.id}#returned`,
      date: item.returnedAt,
      op: 'returned' satisfies InventoryOp,
      kind: item.kind,
      quantity: item.quantity,
    });
  }

  return out;
}

export const INVENTORY_KIND_LABELS: Record<InventoryKindEnum, string> = {
  [InventoryKindEnum.MATTRESS]: 'Матрац',
  [InventoryKindEnum.PILLOW]: 'Подушка',
  [InventoryKindEnum.BLANKET]: 'Ковдра',
  [InventoryKindEnum.PILLOWCASE]: 'Наволочки',
  [InventoryKindEnum.SHEET]: 'Простирадла',
  [InventoryKindEnum.BEDSPREAD]: 'Покривала',
  [InventoryKindEnum.MATTRESS_COVER]: 'Підковдра',
  [InventoryKindEnum.DUVET_COVER]: 'К-т білизни',
  [InventoryKindEnum.CURTAINS]: 'Штори',
  [InventoryKindEnum.TOWEL]: 'Рушник',
  [InventoryKindEnum.TULLE]: 'Тюль',
};
