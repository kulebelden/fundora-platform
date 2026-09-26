import Link from 'next/link';
import { Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage, initials } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatMoney, formatNumber, fundedPercent, daysRemaining } from '@/lib/currency';
import type { CampaignSummary } from '@/lib/types';

export function CampaignCard({ campaign }: { campaign: CampaignSummary }) {
  const { currency, targetAmount, raisedAmount } = campaign;
  const percent = fundedPercent(raisedAmount, targetAmount);
  const days = daysRemaining(campaign.endDate);

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lift">
      <Link
        href={`/campaigns/${campaign.slug}`}
        className="relative block aspect-[8/5] overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {campaign.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- covers are arbitrary remote URLs; see README note on the image optimizer.
          <img
            src={campaign.coverImageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="brand-gradient flex h-full w-full items-center justify-center">
            <span className="px-6 text-center text-sm font-semibold text-white/85">
              {campaign.title}
            </span>
          </div>
        )}

        <div className="absolute left-3 top-3 flex gap-2">
          <Badge className="bg-background/95 text-foreground shadow-sm">
            {campaign.category?.name ?? 'Cause'}
          </Badge>
        </div>

        <div className="absolute right-3 top-3">
          <Badge
            variant="outline"
            className="border-white/30 bg-[#001330]/70 font-semibold text-white"
            title={`This campaign raises funds in ${currency}`}
          >
            {currency}
          </Badge>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link href={`/campaigns/${campaign.slug}`} className="focus-visible:outline-none">
          <h3 className="line-clamp-2 text-base font-bold leading-snug transition-colors group-hover:text-accent">
            {campaign.title}
          </h3>
        </Link>

        <div className="mt-2.5 flex items-center gap-2">
          <Avatar className="h-6 w-6">
            {campaign.creator?.avatarUrl ? (
              <AvatarImage src={campaign.creator.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="text-[10px]">
              {initials(campaign.creator?.firstName, campaign.creator?.lastName)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-xs text-muted-foreground">
            by {campaign.creator?.firstName} {campaign.creator?.lastName}
          </span>
        </div>

        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{campaign.story}</p>

        <div className="mt-auto pt-5">
          <Progress value={percent} aria-label={`${Math.round(percent)} percent funded`} />

          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <p className="tabular text-sm">
              <span className="font-bold text-success">
                {formatMoney(raisedAmount, currency, { hideFraction: true })}
              </span>{' '}
              <span className="text-muted-foreground">
                raised of {formatMoney(targetAmount, currency, { hideFraction: true })}
              </span>
            </p>
            <span className="tabular shrink-0 text-xs font-bold text-success">
              {Math.round(percent)}%
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            {campaign.donorCount ? (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {formatNumber(campaign.donorCount)} donors
              </span>
            ) : null}
            {days !== null ? <span>{days === 0 ? 'Final day' : `${days} days left`}</span> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function CampaignCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <div className="aspect-[8/5] animate-pulse bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-2.5 w-full animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
      </div>
    </Card>
  );
}
