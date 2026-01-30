'use client';

import { QueryProvider } from '@/lib/react-query';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
