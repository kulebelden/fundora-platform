'use client';

import * as React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useLogin } from '@/lib/queries';
import { cn } from '@/lib/utils';

export function CampaignSuccessView({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { mutate: login, isPending } = useLogin();
  const [pulse, setPulse] = React.useState(false);

  React.useEffect(() => {
    const id = setInterval(() => setPulse((p) => !p), 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <SiteHeader />
      <main id="main" className="container pb-16 pt-8 sm:pb-24 sm:pt-12">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Campaign published!
          </h1>
          <p className="mt-3 text-muted-foreground">
            Your campaign is now live. Share it with your network and start
            receiving donations.
          </p>

          <Card className="mt-8 p-5 text-left">
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Campaign ID</dt>
                <dd className="tabular font-mono font-semibold">{campaignId}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-semibold text-success">Live</dd>
              </div>
            </dl>
          </Card>

          <div className="mt-8 space-y-3">
            <Button size="lg" className="w-full" asChild>
              <a href="/dashboard/campaigns">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
