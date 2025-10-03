// Мапінг англ -> укр
import { InventoryKindEnum, InventoryKindUA } from '@/entities/student-inventory/model/types';

export const INVENTORY_EN_TO_UA: Record<InventoryKindEnum, InventoryKindUA> = {
  [InventoryKindEnum.TULLE]: InventoryKindUA.TULLE,
  [InventoryKindEnum.CURTAINS]: InventoryKindUA.CURTAINS,
  [InventoryKindEnum.BLANKET]: InventoryKindUA.BLANKET,
  [InventoryKindEnum.MATTRESS]: InventoryKindUA.MATTRESS,
  [InventoryKindEnum.PILLOWCASE]: InventoryKindUA.PILLOWCASE,
  [InventoryKindEnum.MATTRESS_COVER]: InventoryKindUA.MATTRESS_COVER,
  [InventoryKindEnum.DUVET_COVER]: InventoryKindUA.DUVET_COVER,
  [InventoryKindEnum.TOWEL_WAFFLE]: InventoryKindUA.TOWEL_WAFFLE,
  [InventoryKindEnum.TOWEL_TERRY]: InventoryKindUA.TOWEL_TERRY,
  [InventoryKindEnum.SHEET]: InventoryKindUA.SHEET,
  [InventoryKindEnum.BEDSPREAD]: InventoryKindUA.BEDSPREAD,
  [InventoryKindEnum.PILLOW]: InventoryKindUA.PILLOW,
  [InventoryKindEnum.TABLECLOTH]: InventoryKindUA.TABLECLOTH,
  [InventoryKindEnum.BED_SET]: InventoryKindUA.BED_SET,
};

// Мапінг укр -> англ
export const INVENTORY_UA_TO_EN: Record<InventoryKindUA, InventoryKindEnum> = Object.fromEntries(
  Object.entries(INVENTORY_EN_TO_UA).map(([en, ua]) => [ua, en]),
) as Record<InventoryKindUA, InventoryKindEnum>;
