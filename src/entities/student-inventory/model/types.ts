// Доменно: перелік значень
export enum InventoryKindEnum {
  TULLE = "tulle",
  CURTAINS = "curtains",
  BLANKET = "blanket",
  MATTRESS = "mattress",
  PILLOWCASE = "pillowcase",
  MATTRESS_COVER = "mattressCover",
  DUVET_COVER = "duvetCover",
  TOWEL_WAFFLE = "waffleTowel",
  TOWEL_TERRY = "terryTowel",
  SHEET = "sheet",
  BEDSPREAD = "cover",
  PILLOW = "pillow",
  TABLECLOTH = "tablecloth",
  BED_SET = "bedSet",
}

export enum InventoryKindUA {
  TULLE = "Тюль",
  CURTAINS = "Штори",
  BLANKET = "Ковдра",
  MATTRESS = "Матрац",
  PILLOWCASE = "Наволочки",
  MATTRESS_COVER = "Чохол",
  DUVET_COVER = "Підковдра",
  TOWEL_WAFFLE = "Рушник вафельний",
  TOWEL_TERRY = "Рушник махровий",
  SHEET = "Простирадла",
  BEDSPREAD = "Покривала",
  PILLOW = "Подушка",
  TABLECLOTH = "Скатертина",
  BED_SET = "К-т білизни",
}

// Юніон
export type InventoryKind = `${InventoryKindEnum}`;

// Перелік для UI
export const INVENTORY_KINDS: InventoryKind[] = Object.values(InventoryKindEnum) as InventoryKind[];

// Type guard
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
