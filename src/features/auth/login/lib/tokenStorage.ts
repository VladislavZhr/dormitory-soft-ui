/**
 * Легка робота з cookie на клієнті.
 * На сервері cookie виставляються у route.ts.
 */
export const tokenStorage = {
  get(name: string): string | null {
    if (typeof document === "undefined") return null;
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    if (!m || m[1] === undefined) return null;
    return m ? decodeURIComponent(m[1]) : null;
  },
  remove(name: string) {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; Max-Age=0; path=/;`;
  },
};
