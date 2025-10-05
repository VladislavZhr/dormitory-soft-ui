
import { type StudentInventoryItem, type InventoryKind, InventoryKindEnum, InventoryKindUA } from "@/entities/student-inventory/model/types";
import { isInventoryKind } from "@/entities/student-inventory/model/types";

import type { StudentInventoryDto } from "./contracts";

// DTO → Домен
export function mapDtoToItem(dto: StudentInventoryDto): StudentInventoryItem {
  const kind = isInventoryKind(dto.kind) ? dto.kind : (dto.kind as InventoryKind);

  return {
    id: dto.id,
    kind,
    quantity: dto.quantity,
    issuedAt: dto.issuedAt,
    returnedAt: dto.returnedAt,
  };
}
// Англ. → Укр.
export const INVENTORY_KIND_LABELS: Record<InventoryKindEnum, InventoryKindUA> = {
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

export const INVENTORY_LABEL_TO_KIND: Record<InventoryKindUA, InventoryKindEnum> = Object.fromEntries(Object.entries(INVENTORY_KIND_LABELS).map(([k, v]) => [v, k as InventoryKindEnum])) as Record<
  InventoryKindUA,
  InventoryKindEnum
>;
