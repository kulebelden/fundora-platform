'use client';

import * as React from 'react';

export interface DeepLinkConfig {
  scheme: string;
  campaignId: string;
  appStoreUrl: string;
  playStoreUrl?: string;
  fallbackDelayMs: number;
}

export interface DeepLinkState {
  appInstalled: boolean | null;
  showGateway: boolean;
  deepLinkUrl: string | null;
  storeUrl: string | null;
}

const DEFAULT_CONFIG: DeepLinkConfig = {
  scheme: 'hopenest',
  campaignId: '',
  appStoreUrl: 'https://apps.apple.com/app/hopenest/id1234567890',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.hopenest.app',
  fallbackDelayMs: 2500,
};

function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof navigator === 'undefined') return 'web';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/Android/.test(ua)) return 'android';
  return 'web';
}

function buildDeepLinkUrl(config: DeepLinkConfig): string {
  return `${config.scheme}://campaign/${config.campaignId}`;
}

function buildFallbackUrl(config: DeepLinkConfig): string {
  const platform = getPlatform();
  if (platform === 'ios') return config.appStoreUrl;
  if (platform === 'android') return config.playStoreUrl ?? config.appStoreUrl;
  return config.appStoreUrl;
}

/**
 * Detects whether the native HopeNest app is installed by attempting to open
 * the universal link scheme. Uses a visibility/blur heuristic: if the page
 * loses focus within a short window after the scheme attempt, the app is
 * likely installed.
 */
function detectNativeApp(
  deepLinkUrl: string,
  timeoutMs: number,
): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    }, timeoutMs);

    const onVisibilityChange = () => {
      if (!resolved && document.visibilityState === 'hidden') {
        resolved = true;
        clearTimeout(timer);
        resolve(true);
      }
    };

    const onBlur = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(true);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);

    try {
      window.location.href = deepLinkUrl;
    } catch {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      resolve(false);
    }

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('blur', onBlur);
        resolve(false);
      }
    }, timeoutMs);
  });
}

export function useMobileDeepLink(
  campaignId: string | null | undefined,
  overrides?: Partial<DeepLinkConfig>,
) {
  const config = React.useMemo<DeepLinkConfig>(
    () => ({ ...DEFAULT_CONFIG, ...overrides, campaignId: campaignId ?? '' }),
    [campaignId, overrides],
  );

  const [state, setState] = React.useState<DeepLinkState>({
    appInstalled: null,
    showGateway: false,
    deepLinkUrl: null,
    storeUrl: null,
  });

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const gatewayShownRef = React.useRef(false);

  const openDeepLink = React.useCallback(async () => {
    if (!config.campaignId) return;

    const deepLinkUrl = buildDeepLinkUrl(config);
    const storeUrl = buildFallbackUrl(config);

    setState({
      appInstalled: null,
      showGateway: false,
      deepLinkUrl,
      storeUrl,
    });

    const platform = getPlatform();
    if (platform === 'web') {
      window.open(storeUrl, '_blank');
      return;
    }

    const installed = await detectNativeApp(deepLinkUrl, 1500);
    setState({
      appInstalled: installed,
      showGateway: false,
      deepLinkUrl,
      storeUrl,
    });

    if (!installed) {
      timerRef.current = setTimeout(() => {
        window.open(storeUrl, '_blank');
      }, config.fallbackDelayMs);
    }
  }, [config]);

  const showAppGateway = React.useCallback(() => {
    if (gatewayShownRef.current) return;
    gatewayShownRef.current = true;

    if (!config.campaignId) return;

    const deepLinkUrl = buildDeepLinkUrl(config);
    const storeUrl = buildFallbackUrl(config);

    setState({
      appInstalled: null,
      showGateway: true,
      deepLinkUrl,
      storeUrl,
    });
  }, [config]);

  const dismissGateway = React.useCallback(() => {
    setState((prev) => ({ ...prev, showGateway: false }));
  }, []);

  const proceedToStore = React.useCallback(() => {
    if (state.storeUrl) {
      window.open(state.storeUrl, '_blank');
    }
    setState((prev) => ({ ...prev, showGateway: false }));
  }, [state.storeUrl]);

  const proceedToApp = React.useCallback(async () => {
    if (state.deepLinkUrl) {
      const platform = getPlatform();
      if (platform === 'web') {
        window.open(state.storeUrl ?? state.deepLinkUrl, '_blank');
      } else {
        window.location.href = state.deepLinkUrl;
      }
    }
  }, [state.deepLinkUrl, state.storeUrl]);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    ...state,
    openDeepLink,
    showAppGateway,
    dismissGateway,
    proceedToStore,
    proceedToApp,
    config,
  };
}
