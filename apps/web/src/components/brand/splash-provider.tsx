'use client';

import { useEffect, useState } from 'react';
import { SplashScreen } from './splash-screen';

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hopenest-splash-seen');
    if (hasSeenSplash) {
      setShowSplash(false);
      return;
    }
    sessionStorage.setItem('hopenest-splash-seen', 'true');
  }, []);

  const handleComplete = () => {
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleComplete} duration={2400} />}
      <div className={showSplash ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
        {children}
      </div>
    </>
  );
}
