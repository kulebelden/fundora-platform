'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, Loader2, Plus, Target } from 'lucide-react';
import { PwaInstallButton } from '@/components/pwa-install-button';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { CampaignStatusBadge, KycStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/currency';
import { useKycStatus, useMe, useMyCampaigns } from '@/lib/queries';

export function MyCampaignsClient() {
  const { data: me, isLoading: meLoading } = useMe();
  const { data: campaigns, isLoading, error } = useMyCampaigns();
  const { data: kyc } = useKycStatus();

  return (
    <>
      <SiteHeader />

      <main id="main" className="container pb-10 pt-6 sm:pt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Your campaigns</h1>
            <p className="mt-1.5 text-muted-foreground">
              Track funds, post updates and withdraw to your bank.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <PwaInstallButton />
            <Button variant="success" asChild>
              <Link href="/dashboard/campaigns/create">
                <Plus className="h-4 w-4" />
                New campaign
              </Link>
            </Button>
          </div>
        </div>

        {me ? (
          <Card className="mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <BadgeCheck className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-bold">Identity verification</p>
                <p className="text-xs text-muted-foreground">
                  Required before any withdrawal is released.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <KycStatusBadge status={kyc?.status ?? 'NOT_STARTED'} />
              {kyc?.status !== 'VERIFIED' && kyc?.status !== 'SUBMITTED' ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/verification">
                    Verify now
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </Card>
        ) : null}

        {meLoading || isLoading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your campaigns…
          </div>
        ) : !me ? (
          <Card className="mt-8 p-16 text-center">
            <h2 className="text-xl font-bold">Sign in to see your campaigns</h2>
            <Button className="mt-6" asChild>
              <Link href="/login?next=/dashboard/campaigns">Log in</Link>
            </Button>
          </Card>
        ) : error ? (
          <Card className="mt-8 p-16 text-center">
            <h2 className="text-xl font-bold">Could not load your campaigns</h2>
            <p className="mt-2 text-sm text-muted-foreground">{apiErrorMessage(error)}</p>
          </Card>
        ) : !campaigns?.length ? (
          <Card className="mt-8 p-16 text-center">
            <Target className="mx-auto h-9 w-9 text-muted-foreground/50" />
            <h2 className="mt-5 text-xl font-bold">No campaigns yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Start a campaign to begin raising funds for your cause.
            </p>
          </Card>
        ) : (
          <div className="mt-8 grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="flex flex-wrap items-center gap-5 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CampaignStatusBadge status={campaign.status} />
                    <span className="text-xs text-muted-foreground">
                      {campaign.category?.name} · Created {formatDate(campaign.createdAt)}
                    </span>
                  </div>
                  <h2 className="mt-2 truncate text-lg font-bold">{campaign.title}</h2>
                  <p className="tabular mt-0.5 text-sm text-muted-foreground">
                    Goal {formatMoney(campaign.targetAmount, campaign.currency, { hideFraction: true })}
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/dashboard/campaigns/${campaign.id}`}>
                    Open dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
