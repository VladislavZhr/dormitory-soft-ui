import type { StockItem } from "../model/contracts";

export function sumInventory(stock: StockItem[]) {
  const sumIssued = stock.reduce((s, i) => s + i.issued, 0);
  const sumTotal = stock.reduce((s, i) => s + i.total, 0);
  const sumAvailable = sumTotal - sumIssued;
  return { sumIssued, sumAvailable, sumTotal };
}

export function availabilityBadge(available: number) {
  if (available === 0) return "zero";
  if (available <= 5) return "low";
  return "ok";
}
