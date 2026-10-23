'use client';

import { SplashProvider } from '@/components/brand/splash-provider';

export function SplashWrapper({ children }: { children: React.ReactNode }) {
  return <SplashProvider>{children}</SplashProvider>;
}
