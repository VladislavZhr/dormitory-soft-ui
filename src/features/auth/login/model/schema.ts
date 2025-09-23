import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, "Введіть ім'я користувача").trim(),
  password: z.string().min(6, 'Мінімум 6 символів'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
