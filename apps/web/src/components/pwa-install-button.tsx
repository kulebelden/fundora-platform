'use client';

import * as React from 'react';
import { Check, Smartphone } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IosInstallSteps, IosOpenInSafariSteps } from '@/components/ios-install-prompt';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PwaInstallButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  label?: string;
  /**
   * When true the button stays mounted even if the browser cannot install, rendering
   * a disabled hint instead. Defaults to false so it disappears once installed.
   */
  keepWhenUnavailable?: boolean;
}

/**
 * "Download App" entry point. Chromium gets a real one-tap install via the captured
 * beforeinstallprompt event; iOS Safari never fires that event, so it gets the
 * Share -> Add to Home Screen walkthrough instead of a dead button.
 */
export function PwaInstallButton({
  label = 'Download App',
  keepWhenUnavailable = false,
  className,
  variant = 'warm',
  ...props
}: PwaInstallButtonProps) {
  const { mode, isStandalone, install } = usePwaInstall();
  const [showIosHelp, setShowIosHelp] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  if (mode === 'unavailable' && !keepWhenUnavailable) return null;

  if (isStandalone) {
    return keepWhenUnavailable ? (
      <Button variant="ghost" className={cn('cursor-default', className)} disabled {...props}>
        <Check className="h-4 w-4" />
        App installed
      </Button>
    ) : null;
  }

  const handleClick = async () => {
    if (mode === 'ios-manual' || mode === 'ios-open-in-safari') {
      setShowIosHelp(true);
      return;
    }

    setBusy(true);
    try {
      const accepted = await install();
      if (accepted) {
        toast({
          variant: 'success',
          title: 'HopeNest is installing',
          description: 'Look for the HopeNest icon on your home screen.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Install failed',
        description: 'Your browser could not complete the installation.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        className={cn('font-bold shadow-sm', className)}
        onClick={handleClick}
        disabled={busy || (mode === 'unavailable' && keepWhenUnavailable)}
        {...props}
      >
        <Smartphone className="h-4 w-4" />
        <span aria-hidden="true">📲</span> {label}
      </Button>

      <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add HopeNest to your Home Screen</DialogTitle>
            <DialogDescription>
              {mode === 'ios-open-in-safari'
                ? 'This in-app browser cannot install apps. Open the page in Safari first.'
                : 'iOS installs web apps from the Share menu. It takes three taps.'}
            </DialogDescription>
          </DialogHeader>

          {mode === 'ios-open-in-safari' ? <IosOpenInSafariSteps /> : <IosInstallSteps />}

          <p className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
            HopeNest then opens full screen, with no browser bars, just like a native app.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
