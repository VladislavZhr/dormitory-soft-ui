// TypeScript strict
import { z } from "zod";

// Валідація форми (UI)
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

// Валідація API-payload (бекенд очікує саме таку форму)
export const changePasswordApiReqSchema = z.object({
  username: z.string().min(1),
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
export type ChangePasswordApiReq = z.infer<typeof changePasswordApiReqSchema>;
