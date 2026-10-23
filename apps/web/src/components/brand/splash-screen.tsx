'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function SplashScreen({
  onComplete,
  duration = 2200,
}: {
  onComplete?: () => void;
  duration?: number;
}) {
  const [phase, setPhase] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 150),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1100),
    ];

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onComplete?.();
      }, 600);
    }, duration);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(exitTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading HopeNest"
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#001a4d] via-[#002B66] to-[#003d80]',
        'transition-opacity duration-600',
        isExiting && 'opacity-0 pointer-events-none'
      )}
    >
      <div className="relative flex h-[280px] w-[280px] items-center justify-center sm:h-[340px] sm:w-[340px]">
        <div
          className={cn(
            'absolute inset-0 transition-all duration-700 ease-out',
            phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          )}
        >
          <Image
            src="/brand/animated/green-side.png"
            alt=""
            fill
            priority
            className="object-contain splash-float-left"
          />
        </div>

        <div
          className={cn(
            'absolute inset-0 transition-all duration-700 ease-out',
            phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          )}
        >
          <Image
            src="/brand/animated/bule-side.png"
            alt=""
            fill
            priority
            className="object-contain splash-float-right"
          />
        </div>

        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center transition-all duration-800 ease-out',
            phase >= 2 ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-12'
          )}
        >
          <div className="relative h-[120px] w-[120px] sm:h-[150px] sm:w-[150px]">
            <Image
              src="/brand/animated/three-icons-in the midde.png"
              alt=""
              fill
              priority
              className="object-contain splash-pulse"
            />
          </div>
        </div>

        <div
          className={cn(
            'absolute inset-0 transition-all duration-700 ease-out',
            phase >= 1 ? 'opacity-70' : 'opacity-0'
          )}
        >
          <div className="splash-orbit absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full sm:h-[240px] sm:w-[240px]" />
        </div>
      </div>

      <div
        className={cn(
          'mt-10 flex flex-col items-center gap-3 px-6 text-center transition-all duration-700 ease-out',
          phase >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        )}
      >
        <Image
          src="/brand/hopenest-tagline.png"
          alt="Real People. Real Causes. Greater Impact."
          width={520}
          height={80}
          priority
          className="h-auto w-[280px] sm:w-[340px]"
        />
        <div className="mt-2 flex items-center gap-2 text-white/70">
          <div className="splash-dot" />
          <div className="splash-dot" style={{ animationDelay: '0.15s' }} />
          <div className="splash-dot" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>

      <span className="sr-only">Loading HopeNest application</span>
    </div>
  );
}

export function AppSplash({ show = true }: { show?: boolean }) {
  const [visible, setVisible] = useState(show);

  if (!visible) return null;

  return <SplashScreen onComplete={() => setVisible(false)} />;
}
