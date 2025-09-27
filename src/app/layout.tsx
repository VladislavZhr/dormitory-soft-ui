import type { Metadata } from "next";

import "./globals.css";
import AppProviders from "./AppProviders";

export const metadata: Metadata = {
  title: "example-hostel-front",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className="light">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
