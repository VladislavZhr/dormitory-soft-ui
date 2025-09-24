import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'example-hostel-front',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className="light">
      <body>{children}</body>
    </html>
  );
}
