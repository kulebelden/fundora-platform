'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarClock,
  CreditCard,
  Flag,
  Heart,
  Loader2,
  Megaphone,
  Share2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { DonateModal } from '@/components/donate-modal';
import { ImageCarousel } from '@/components/image-carousel';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { CampaignStatusBadge } from '@/components/status-badge';
import { Avatar, AvatarFallback, AvatarImage, initials } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { apiErrorMessage, isNotFound } from '@/lib/api';
import {
  daysRemaining,
  formatDate,
  formatMoney,
  formatNumber,
  fundedPercent,
  timeAgo,
} from '@/lib/currency';
import { useCampaign, useCampaignUpdates, useDonationFeed } from '@/lib/queries';
import type { CampaignUpdateView, DonationFeedItem } from '@/lib/types';

const CHANNEL_LABEL: Record<string, string> = {
  CARD: 'Card',
  BANK_TRANSFER: 'Bank transfer',
  MTN_MOMO: 'MTN MoMo',
  AIRTEL_MONEY: 'Airtel Money',
};

export function CampaignDetailClient({ slug }: { slug: string }) {
  const { data: campaign, isLoading, error } = useCampaign(slug);
  const { data: donations } = useDonationFeed(campaign?.id);
  const { data: updates } = useCampaignUpdates(campaign?.id);
  const [donateOpen, setDonateOpen] = React.useState(false);

  if (isLoading) return <DetailSkeleton />;

  if (error || !campaign) {
    return (
      <>
        <SiteHeader />
        <main id="main" className="container py-24 text-center">
          <h1 className="text-2xl font-extrabold">
            {isNotFound(error) ? 'Campaign not found' : 'Could not load this campaign'}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            {isNotFound(error)
              ? 'This campaign may have been removed, or the link is incorrect.'
              : apiErrorMessage(error)}
          </p>
          <Button variant="outline" className="mt-8" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to all causes
            </Link>
          </Button>
        </main>
        <SiteFooter />
      </>
    );
  }

  const { currency } = campaign;

  // Gross settled donations, straight from the API — not the fee-netted wallet balance.
  const raised = campaign.raisedAmount;
  const percent = fundedPercent(raised, campaign.targetAmount);
  const days = daysRemaining(campaign.endDate);
  const donorCount = campaign.donorCount;
  const images = campaign.coverImageUrl ? [campaign.coverImageUrl] : [];

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: campaign.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ variant: 'success', title: 'Link copied', description: 'Share it anywhere.' });
    } catch {
      // A cancelled share sheet is not an error worth reporting.
    }
  };

  return (
    <>
      <SiteHeader />

      <main id="main" className="container py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All causes
        </Link>

        <div className="mt-5 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* ------------------------------------------------ left column */}
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="accent">{campaign.category?.name ?? 'Cause'}</Badge>
              <CampaignStatusBadge status={campaign.status} />
              <Badge variant="outline" title="Funds are raised in this currency">
                {currency}
              </Badge>
            </div>

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              {campaign.title}
            </h1>

            <div className="mt-6">
              <ImageCarousel images={images} alt={campaign.title} fallbackLabel={campaign.title} />
            </div>

            {/* organiser */}
            <Card className="mt-6 flex flex-wrap items-center gap-4 p-5">
              <Avatar className="h-12 w-12">
                {campaign.creator?.avatarUrl ? (
                  <AvatarImage src={campaign.creator.avatarUrl} alt="" />
                ) : null}
                <AvatarFallback>
                  {initials(campaign.creator?.firstName, campaign.creator?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Organiser
                </p>
                <p className="flex items-center gap-1.5 font-bold">
                  {campaign.creator?.firstName} {campaign.creator?.lastName}
                  <BadgeCheck className="h-4 w-4 text-success" aria-label="Identity verified" />
                </p>
                <p className="text-xs text-muted-foreground">
                  Created {timeAgo(campaign.createdAt)}
                </p>
              </div>
              <Badge variant="success">
                <ShieldCheck className="h-3 w-3" />
                Verified beneficiary
              </Badge>
            </Card>

            <Tabs defaultValue="story" className="mt-8">
              <TabsList>
                <TabsTrigger value="story">Story</TabsTrigger>
                <TabsTrigger value="updates">
                  Updates {updates?.length ? `(${updates.length})` : ''}
                </TabsTrigger>
                <TabsTrigger value="donors">
                  Donors {donations?.length ? `(${donations.length})` : ''}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="story">
                <article className="prose-sm max-w-none space-y-4 text-[15px] leading-relaxed text-foreground/90">
                  {campaign.story.split(/\n{2,}/).map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </article>
                <button
                  type="button"
                  className="mt-8 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    toast({
                      title: 'Report received',
                      description: 'Our trust and safety team will review this campaign.',
                    })
                  }
                >
                  <Flag className="h-3.5 w-3.5" />
                  Report this campaign
                </button>
              </TabsContent>

              <TabsContent value="updates">
                <UpdatesFeed updates={updates} />
              </TabsContent>

              <TabsContent value="donors">
                <DonorFeed donations={donations} currency={currency} />
              </TabsContent>
            </Tabs>
          </div>

          {/* ----------------------------------------------- right column */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-6">
              <p className="tabular text-3xl font-extrabold text-success">
                {formatMoney(raised, currency, { hideFraction: true })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                raised of {formatMoney(campaign.targetAmount, currency, { hideFraction: true })} goal
              </p>

              <Progress
                value={percent}
                className="mt-4 h-3"
                aria-label={`${Math.round(percent)} percent funded`}
              />

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="tabular font-bold text-success">{Math.round(percent)}% funded</span>
                {donorCount !== null ? (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {formatNumber(donorCount)} donors
                  </span>
                ) : null}
              </div>

              {days !== null ? (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2.5 text-sm">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {days === 0 ? 'Final day to give' : `${days} days remaining`}
                  </span>
                </div>
              ) : null}

              <Button
                size="lg"
                variant="success"
                className="mt-5 w-full text-base"
                onClick={() => setDonateOpen(true)}
                disabled={campaign.status !== 'LIVE'}
              >
                <Heart className="h-5 w-5" />
                {campaign.status === 'LIVE' ? 'Donate now' : 'Not accepting donations'}
              </Button>

              <Button variant="outline" className="mt-2.5 w-full" onClick={share}>
                <Share2 className="h-4 w-4" />
                Share this cause
              </Button>

              <div className="mt-5 space-y-2.5 border-t pt-5 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 shrink-0" />
                  Visa, Mastercard and AMEX accepted
                </p>
                <p className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0" />
                  Direct bank transfer via SWIFT / IBAN
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
                  Every donation posted to an auditable ledger
                </p>
              </div>
            </Card>
          </aside>
        </div>
      </main>

      <SiteFooter />

      <DonateModal campaign={campaign} open={donateOpen} onOpenChange={setDonateOpen} />
    </>
  );
}

function UpdatesFeed({ updates }: { updates: CampaignUpdateView[] | undefined }) {
  if (!updates) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading updates…
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-14 text-center">
        <Megaphone className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-4 font-semibold">No updates yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          The organiser has not posted an update on this campaign.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-6 border-l pl-6">
      {updates.map((update) => (
        <li key={update.id} className="relative">
          <span className="absolute -left-[31px] top-1.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-background bg-success" />
          <p className="text-xs font-medium text-muted-foreground">
            {formatDate(update.createdAt)} · {timeAgo(update.createdAt)}
          </p>
          <h3 className="mt-1 font-bold">{update.title}</h3>
          <div className="mt-1.5 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {update.content.split(/\n{2,}/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

function DonorFeed({
  donations,
  currency,
}: {
  donations: DonationFeedItem[] | undefined;
  currency: string;
}) {
  if (!donations) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading donations…
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-14 text-center">
        <Heart className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-4 font-semibold">Be the first to give</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirmed donations appear here as they settle.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-xl border">
      {donations.map((donation, index) => (
        <li
          key={donation.providerReference ?? `${donation.createdAt}-${index}`}
          className="flex items-center gap-3 p-4"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {donation.isAnonymous ? '?' : initials(donation.donorName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            {/* The API already substitutes 'Anonymous' — a real name never reaches us. */}
            <p className="truncate text-sm font-semibold">{donation.donorName}</p>
            <p className="text-xs text-muted-foreground">
              {timeAgo(donation.createdAt)} · {CHANNEL_LABEL[donation.channel] ?? donation.channel}
            </p>
          </div>
          <span className="tabular shrink-0 text-sm font-bold text-success">
            {formatMoney(donation.amount, donation.currency || currency)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function DetailSkeleton() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </main>
    </>
  );
}
