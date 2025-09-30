// features/students/model/schema.ts
import { z } from "zod";

export const studentCreateSchema = z.object({
  fullName: z.string().min(1, "Вкажіть ПІБ"),
  roomNumber: z.string().min(1, "Вкажіть кімнату"),
  faculty: z.string().min(1, "Вкажіть факультет"),
  studyGroup: z.string().min(1, "Вкажіть групу"),
});

export type CreateStudentRequest = z.infer<typeof studentCreateSchema>;

export const studentSchema = z.object({
  id: z.number().int(),
  fullName: z.string(),
  roomNumber: z.string(),
  faculty: z.string(),
  studyGroup: z.string(),
});

export const dashboardResponseSchema = z.object({
  items: z.array(studentSchema),
  meta: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalPages: z.number().int().min(1),
  }),
});

// 1) Формальні типи для RHF з урахуванням z.coerce.number()
//    - FormInput  = те, що вводить користувач (до валідації/коерсії)
//    - FormOutput = те, що повертає Zod після парсингу (потрібно мутації)
export type FormInput = z.input<typeof studentCreateSchema>;
export type FormOutput = z.output<typeof studentCreateSchema>; // дорівнює твоєму CreateStudentRequest

// Нове: приймає або масив студентів, або {items,meta}, і завжди повертає Student[]
export const dashboardAsArraySchema = z.array(studentSchema).or(dashboardResponseSchema.transform((x) => x.items));

export const addStudentResponseSchema = studentSchema.or(
  z
    .object({
      message: z.string().optional(),
      data: studentSchema,
    })
    .transform((x) => x.data),
);

/** Типи з інференції Zod */
export type Student = z.infer<typeof studentSchema>;
export type AddStudentResponse = z.infer<typeof addStudentResponseSchema>;

// features/students/model/schema.ts

// Детальна форма, яку надсилає бек
export const importResultDetailedSchema = z.object({
  message: z.string().optional(),
  totalRows: z.number().int().nonnegative(),
  validRows: z.number().int().nonnegative(),
  inserted: z.number().int().nonnegative(),
  duplicatesSkipped: z.number().int().nonnegative(),
  invalidRows: z
    .array(
      z.object({
        rowIndex: z.number().int().nonnegative(),
        errors: z.array(z.string()).min(1),
      }),
    )
    .default([]),
});

// Back-compat: приймаємо і старий `{ imported }`, і новий детальний формат → зводимо до `{ imported }`
export const importResultSchema = z.object({ imported: z.number().int().nonnegative() }).or(importResultDetailedSchema.transform((x) => ({ imported: x.inserted })));

export const itemSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  serial: z.string().nullable().optional(), // може бути null/відсутній
  inventoryCode: z.string().nullable().optional(),
});

export const assignedRowSchema = z.object({
  student: studentSchema,
  item: itemSchema,
  assignedAt: z.string(), // ISO-дату не чіпаємо; лише форматнемо в XLSX
  returnedAt: z.string().nullable().optional(),
  status: z.enum(["assigned", "returned", "lost"]).optional().default("assigned"),
});

export const assignedListSchema = z.array(assignedRowSchema);

export type AssignedRow = z.infer<typeof assignedRowSchema>;
