// ⚠️ DTO-шар: тут залишаємо прості рядки від/до бекенду

// Один коректний StudentInventoryDto
export interface StudentInventoryDto {
  id: string;
  studentId: number; // ID студента
  kind: string; // тип інвентарю
  quantity: number; // кількість активна на цей момент
  issuedAt: string; // коли видали
  returnedAt: string | null; // коли повернули (null = ще активний)
}

// Видача
export interface IssueRequestDto {
  studentId: number;
  kind: string; // надсилаємо як рядок; на виклику краще підставляти InventoryKind
  quantity: number;
}

export type IssueResponseDto = StudentInventoryDto;

// Повернення
export interface ReturnRequestDto {
  studentId: number;
  kind: string; // рядок у проводці
  quantity?: number; // опційний параметр
}

export type ReturnResponseDto =
  | { closed: true } // повне повернення
  | StudentInventoryDto; // часткове → оновлений агрегат

// Логи
export interface InventoryLogDto {
  occurredAt: string; // ISO-строка дати
  operation: 'issue' | 'return'; // операція
  kind: string; // вид інвентарю
  quantity: number; // кількість саме у цій операції
}
