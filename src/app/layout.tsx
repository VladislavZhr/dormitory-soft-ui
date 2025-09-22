import type { Metadata } from 'next';

import './globals.css';
import Providers from '../shared/providers/Providers';

export const metadata: Metadata = {
  title: 'example-hostel-front',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className="light">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
