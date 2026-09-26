'use client';

import * as React from 'react';

/** Not in TypeScript's DOM lib: Chromium-only, and still non-standard. */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export type InstallMode =
  /** Chromium fired beforeinstallprompt: a real one-tap install is available. */
  | 'prompt'
  /** iOS Safari never fires that event; the user must use Share -> Add to Home Screen. */
  | 'ios-manual'
  /** Already running as an installed app, or the browser cannot install. */
  | 'unavailable';

export interface PwaInstall {
  mode: InstallMode;
  isStandalone: boolean;
  /** Resolves to true only when the user actually accepted the install. */
  install: () => Promise<boolean>;
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari's own flag, which predates display-mode.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIosDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as a Mac, so check for touch support to catch it.
  const isIpadOs = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return isIosDevice || isIpadOs;
}

export function usePwaInstall(): PwaInstall {
  const promptEvent = React.useRef<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = React.useState<InstallMode>('unavailable');
  const [isStandalone, setIsStandalone] = React.useState(false);

  React.useEffect(() => {
    // Runs only on the client, so server and first client render agree on 'unavailable'.
    const standalone = detectStandalone();
    setIsStandalone(standalone);

    if (standalone) {
      setMode('unavailable');
      return;
    }

    if (detectIos()) {
      setMode('ios-manual');
    }

    const onBeforeInstallPrompt = (event: Event) => {
      // Stop Chrome's own mini-infobar so our button is the single entry point.
      event.preventDefault();
      promptEvent.current = event as BeforeInstallPromptEvent;
      setMode('prompt');
    };

    const onInstalled = () => {
      promptEvent.current = null;
      setIsStandalone(true);
      setMode('unavailable');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = React.useCallback(async () => {
    const event = promptEvent.current;
    if (!event) return false;

    await event.prompt();
    const { outcome } = await event.userChoice;

    // The prompt is single-use; Chrome will fire a fresh event if it stays eligible.
    promptEvent.current = null;
    if (outcome === 'accepted') {
      setMode('unavailable');
    }
    return outcome === 'accepted';
  }, []);

  return { mode, isStandalone, install };
}
