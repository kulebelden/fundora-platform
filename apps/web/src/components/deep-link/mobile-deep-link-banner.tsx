'use client';

import * as React from 'react';
import { ArrowRight, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMobileDeepLink } from '@/hooks/use-mobile-deep-link';
import { cn } from '@/lib/utils';

interface MobileDeepLinkBannerProps {
  campaignId: string;
  /** Override the default deep link scheme */
  scheme?: string;
  /** Override the default App Store URL */
  appStoreUrl?: string;
  /** Override the default Play Store URL */
  playStoreUrl?: string;
  /** Delay in ms before redirecting to store fallback */
  fallbackDelayMs?: number;
  /** Render as a full-screen banner instead of a dialog */
  variant?: 'banner' | 'dialog';
  className?: string;
}

export function MobileDeepLinkBanner({
  campaignId,
  scheme = 'hopenest',
  appStoreUrl,
  playStoreUrl,
  fallbackDelayMs = 2500,
  variant = 'dialog',
  className,
}: MobileDeepLinkBannerProps) {
  const {
    showGateway,
    appInstalled,
    deepLinkUrl,
    storeUrl,
    showAppGateway,
    dismissGateway,
    proceedToStore,
    proceedToApp,
  } = useMobileDeepLink(campaignId, { scheme, appStoreUrl, playStoreUrl, fallbackDelayMs });

  const [pulse, setPulse] = React.useState(false);

  React.useEffect(() => {
    if (!showGateway) return;
    const id = setInterval(() => setPulse((p) => !p), 1200);
    return () => clearInterval(id);
  }, [showGateway]);

  if (variant === 'banner') {
    return (
      <>
        <Button
          variant="success"
          className={cn(
            'fixed bottom-6 right-6 z-50 shadow-lg transition-all duration-300',
            pulse && 'animate-pulse',
            className,
          )}
          onClick={showAppGateway}
        >
          <Smartphone className="mr-2 h-4 w-4" />
          Open in HopeNest App
        </Button>

        <Dialog open={showGateway} onOpenChange={dismissGateway}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-emerald-500" />
                Open in HopeNest App
              </DialogTitle>
              <DialogDescription>
                Get the best experience managing this campaign on the HopeNest
                mobile app.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              {appInstalled === true ? (
                <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success">
                  <strong>App detected!</strong> Opening directly to your campaign
                  management view.
                </div>
              ) : null}

              {appInstalled === false ? (
                <div className="rounded-lg border border-warm/30 bg-warm/10 p-4 text-sm text-warm-foreground">
                  <strong>HopeNest app not found.</strong> You will be redirected to
                  the app store to download it.
                </div>
              ) : null}

              <div className="flex gap-2">
                <Button
                  variant="success"
                  className="flex-1"
                  onClick={proceedToApp}
                  disabled={appInstalled === false}
                >
                  {appInstalled === true ? (
                    <>
                      Open App
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    'Open App'
                  )}
                </Button>
                <Button variant="outline" onClick={proceedToStore}>
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={dismissGateway}
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button
        variant="success"
        className={cn(
          'w-full text-base shadow-lg shadow-emerald-500/20',
          pulse && 'animate-pulse',
          className,
        )}
        onClick={showAppGateway}
      >
        <Smartphone className="mr-2 h-5 w-5" />
        Open in HopeNest App
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      <Dialog open={showGateway} onOpenChange={dismissGateway}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-500" />
              Open in HopeNest App
            </DialogTitle>
            <DialogDescription>
              Manage this campaign on the go with the HopeNest mobile app.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            {appInstalled === true ? (
              <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success">
                <strong>App detected!</strong> Opening directly to your campaign
                management view.
              </div>
            ) : null}

            {appInstalled === false ? (
              <div className="rounded-lg border border-warm/30 bg-warm/10 p-4 text-sm text-warm-foreground">
                <strong>HopeNest app not found.</strong> You will be redirected to
                the app store to download it.
              </div>
            ) : null}

            <div className="flex gap-2">
              <Button
                variant="success"
                className="flex-1"
                onClick={proceedToApp}
                disabled={appInstalled === false}
              >
                {appInstalled === true ? (
                  <>
                    Open App
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  'Open App'
                )}
              </Button>
              <Button variant="outline" onClick={proceedToStore}>
                Download
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={dismissGateway}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
