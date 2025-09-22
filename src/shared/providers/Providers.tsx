'use client';

import { HeroUIProvider } from '@heroui/react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // navigate передаємо для коректної роботи посилань усередині компонентів
  return <HeroUIProvider navigate={router.push}>{children}</HeroUIProvider>;
}
