// Доменно: суворо фіксуємо перелік значень, але зручні як звичайні рядки
export enum InventoryKindEnum {
  TULLE = 'tulle',
  CURTAINS = 'curtains',
  BLANKET = 'blanket',
  MATTRESS = 'mattress',
  PILLOWCASE = 'pillowcase',
  MATTRESS_COVER = 'mattressCover',
  DUVET_COVER = 'duvetCover',
  TOWEL = 'towel',
  SHEET = 'sheet',
  BEDSPREAD = 'cover',
  PILLOW = 'pillow',
}

// Юніон зі значень енаму (рядкові літерали):
export type InventoryKind = `${InventoryKindEnum}`;

// Корисне: перелік для UI (select, підказки тощо)
export const INVENTORY_KINDS: InventoryKind[] = Object.values(InventoryKindEnum) as InventoryKind[];

// Type guard (на випадок зовнішніх/несподіваних значень)
export function isInventoryKind(x: string): x is InventoryKind {
  return (INVENTORY_KINDS as string[]).includes(x);
}

export type StudentInventoryItem = {
  id: string; // uuid
  kind: InventoryKind; // суворо controlований рядок
  quantity: number;
  issuedAt: string; // ISO
  returnedAt: string | null;
};

export type InventoryOp = 'issued' | 'returned';

export type InventoryHistoryRow = {
  id: string;
  date: string; // ISO (issuedAt / returnedAt)
  op: InventoryOp;
  kind: InventoryKind;
  quantity: number;
};
