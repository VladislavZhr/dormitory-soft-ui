import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "example-hostel-front",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className="light">
      <body className="min-h-screen bg-slate-50 antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}
