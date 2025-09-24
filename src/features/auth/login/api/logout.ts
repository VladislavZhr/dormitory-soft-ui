import { ACCESS_TOKEN_KEY } from "../config/constants";
import { tokenStorage } from "../lib/tokenStorage";

/**
 * Простий клієнтський логаут: видаляємо cookie локально.
 * (За потреби — зробити серверний /api/auth/logout, що очищає httpOnly cookie.)
 */
export function logout(): void {
  tokenStorage.remove(ACCESS_TOKEN_KEY);
}
