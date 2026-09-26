'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowRight, CheckCircle2, Clock3, Loader2, ShieldCheck, Smartphone } from 'lucide-react';
import { CoverPhotoPicker } from '@/components/cover-photo-picker';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api';
import {
  DISCOVER_CATEGORIES,
  campaignCategoryOptions,
  isSelectableCategory,
} from '@/lib/category-data';
import { useCategories, useCreateCampaign, useMe } from '@/lib/queries';
import type { CampaignSummary, CategorySummary } from '@/lib/types';
import { useMobileDeepLink } from '@/hooks/use-mobile-deep-link';
import { cn } from '@/lib/utils';

const CAMPAIGN_SCHEMA = z.object({
  title: z.string().trim().min(10, 'Title must be at least 10 characters').max(200),
  category: z.string().min(1, 'Select a category'),
  story: z.string().trim().min(50, 'Tell donors a little more (at least 50 characters)').max(10000),
  targetAmount: z.string().refine((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 1000;
  }, 'Target must be at least 1,000'),
  currency: z.string().default('USD'),
});

type FormValues = z.infer<typeof CAMPAIGN_SCHEMA>;

/**
 * Derived from the Discover catalogue so every `/discover/[category]` hub can hand
 * this wizard a `?category=` slug that matches a real option.
 */
const CATEGORY_GROUPS = campaignCategoryOptions();

/**
 * The wizard offers fine-grained options ("Dental", "Tuition"); the API stores a
 * smaller set of categories. Use the exact category when the API has it, else
 * the option's parent (Dental -> Medical), which always exists.
 */
function resolveCategoryId(slug: string, categories: CategorySummary[]): string | null {
  const bySlug = new Map(categories.map((category) => [category.slug, category.id]));
  const exact = bySlug.get(slug);
  if (exact) return exact;
  const parent = DISCOVER_CATEGORIES.find(
    (category) => category.slug === slug || category.subCategories.some((sub) => sub.slug === slug),
  );
  return parent ? bySlug.get(parent.slug) ?? null : null;
}

const CATEGORY_LABELS = new Map(
  CATEGORY_GROUPS.flatMap((group) => group.options).map((option) => [option.value, option.label]),
);

export function CampaignCreationFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: me } = useMe();

  // `/create?category=medical` (and every category hub CTA) lands here pre-filled.
  // An unrecognised slug is ignored rather than selected, so the field stays valid.
  const requestedCategory = (searchParams.get('category') ?? '').trim().toLowerCase();
  const presetCategory = isSelectableCategory(requestedCategory) ? requestedCategory : '';

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [draft, setDraft] = React.useState<Partial<FormValues>>({
    currency: 'USD',
    category: presetCategory,
  });
  const [showGateway, setShowGateway] = React.useState(false);
  const [campaignId, setCampaignId] = React.useState<string | null>(null);
  const [coverUrl, setCoverUrl] = React.useState<string | null>(null);
  const [coverBusy, setCoverBusy] = React.useState(false);
  const [created, setCreated] = React.useState<CampaignSummary | null>(null);
  const { data: categories } = useCategories();
  const createCampaign = useCreateCampaign();
  const isPublishing = createCampaign.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(CAMPAIGN_SCHEMA),
    defaultValues: {
      title: '',
      category: presetCategory,
      story: '',
      targetAmount: '',
      currency: 'USD',
    },
    mode: 'onBlur',
  });

  const selectedCategory = watch('category');
  const selectedCurrency = watch('currency');

  // The wizard is not remounted when the query string changes (soft navigation from
  // one hub CTA to another), so the preset has to be re-applied here.
  React.useEffect(() => {
    if (!presetCategory) return;
    setValue('category', presetCategory, { shouldValidate: true });
    setDraft((current) => ({ ...current, category: presetCategory }));
  }, [presetCategory, setValue]);

  const {
    deepLinkUrl,
    storeUrl,
    showGateway: gatewayState,
    appInstalled,
    showAppGateway,
    dismissGateway,
    proceedToApp,
    proceedToStore,
  } = useMobileDeepLink(campaignId, { scheme: 'hopenest' });

  const onSubmit = (values: FormValues) => {
    // The review and success screens read from `draft`, so capture the whole form.
    setDraft(values);
    if (!me) {
      router.push('/login?next=/dashboard/campaigns/create');
      return;
    }
    publishCampaign(values);
  };

  const publishCampaign = (values: FormValues) => {
    const categoryId = resolveCategoryId(values.category, categories ?? []);
    if (!categoryId) {
      toast({
        variant: 'destructive',
        title: 'Categories are still loading',
        description: 'Give it a moment and press Submit again.',
      });
      return;
    }

    createCampaign.mutate(
      {
        title: values.title.trim(),
        categoryId,
        story: values.story.trim(),
        targetAmount: Number(values.targetAmount),
        currency: values.currency,
        ...(coverUrl ? { coverImageUrl: coverUrl } : {}),
      },
      {
        onSuccess: (campaign) => {
          setCreated(campaign);
          setCampaignId(campaign.id);
          setStep(3);
          setTimeout(() => setShowGateway(true), 800);
        },
        onError: (error) => {
          toast({
            variant: 'destructive',
            title: 'Campaign could not be created',
            description: apiErrorMessage(error, 'Please try again.'),
          });
        },
      },
    );
  };

  if (step === 3 && campaignId) {
    return (
      <>
        <SiteHeader />
        <main id="main" className="container py-16 sm:py-24">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Campaign submitted!
            </h1>
            <p className="mt-3 text-muted-foreground">
              Our team reviews every campaign before it goes live, usually within a
              day. It will be published as soon as it is approved.
            </p>

            <Card className="mt-8 overflow-hidden text-left">
              {created?.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- uploaded cover
                <img
                  src={created.coverImageUrl}
                  alt=""
                  className="aspect-[16/9] w-full object-cover"
                />
              ) : null}
              <div className="p-5">
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="inline-flex items-center gap-1.5 font-semibold text-[#8a5200]">
                    <Clock3 className="h-3.5 w-3.5" />
                    Awaiting review
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Title</dt>
                  <dd className="font-semibold">{draft.title}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-semibold">
                    {CATEGORY_LABELS.get(draft.category ?? '') ?? draft.category}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Goal</dt>
                  <dd className="tabular font-semibold">
                    {draft.targetAmount} {draft.currency}
                  </dd>
                </div>
              </dl>
              </div>
            </Card>

            <div className="mt-8 space-y-3">
              <Button size="lg" className="w-full" asChild>
                <Link href="/dashboard/campaigns">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </main>
        <SiteFooter />

        <MobileDeepLinkGateway
          campaignId={campaignId}
          open={showGateway}
          onClose={() => setShowGateway(false)}
        />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main id="main" className="container pb-16 pt-6 sm:pt-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {step === 1 && 'Draft your campaign'}
            {step === 2 && 'Sign in to publish'}
            {step === 3 && 'Publishing…'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {step === 1 &&
              (me
                ? 'Tell the world about your cause. Add a photo, then submit it for review.'
                : 'Tell the world about your cause. You can submit it once you sign in.')}
            {step === 2 && 'Confirm your identity to publish this campaign.'}
            {step === 3 && 'Saving your campaign and syncing to the database…'}
          </p>

          {/* Progress bar */}
          <div className="mt-8 flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-1 items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                    s <= step
                      ? 'bg-success text-white'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      'h-1 flex-1 rounded-full',
                      s < step ? 'bg-success' : 'bg-muted',
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="title">Campaign title</Label>
                <Input
                  id="title"
                  placeholder="Help Sarah Recover from Surgery"
                  aria-invalid={Boolean(errors.title)}
                  {...register('title')}
                />
                {errors.title ? (
                  <p className="text-xs font-medium text-destructive">{errors.title.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Select
                  id="category"
                  value={selectedCategory ?? ''}
                  aria-invalid={Boolean(errors.category)}
                  onChange={(e) => {
                    setValue('category', e.target.value, { shouldValidate: true });
                    setDraft((current) => ({ ...current, category: e.target.value }));
                  }}
                >
                  <option value="">Select a category</option>
                  {CATEGORY_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
                {errors.category ? (
                  <p className="text-xs font-medium text-destructive">{errors.category.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="story">Your story</Label>
                <textarea
                  id="story"
                  rows={8}
                  placeholder="Tell donors why this cause matters..."
                  aria-invalid={Boolean(errors.story)}
                  className={cn(
                    'flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors',
                    'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
                    'aria-[invalid=true]:border-destructive',
                  )}
                  {...register('story')}
                />
                {errors.story ? (
                  <p className="text-xs font-medium text-destructive">{errors.story.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="coverPhoto">
                  Cover photo <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <CoverPhotoPicker
                  value={coverUrl}
                  onChange={setCoverUrl}
                  onBusyChange={setCoverBusy}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="targetAmount">Target amount</Label>
                  <Input
                    id="targetAmount"
                    inputMode="decimal"
                    placeholder="5000"
                    aria-invalid={Boolean(errors.targetAmount)}
                    {...register('targetAmount')}
                  />
                  {errors.targetAmount ? (
                    <p className="text-xs font-medium text-destructive">{errors.targetAmount.message}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    id="currency"
                    value={selectedCurrency ?? 'USD'}
                    onChange={(e) => {
                      setValue('currency', e.target.value, { shouldValidate: true });
                      setDraft((current) => ({ ...current, currency: e.target.value }));
                    }}
                  >
                    {['USD', 'EUR', 'GBP', 'UGX', 'KES', 'NGN'].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isPublishing || coverBusy}>
                {coverBusy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Waiting for the photo…
                  </>
                ) : isPublishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing…
                  </>
                ) : (
                  <>
                    Submit for review
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {me
                  ? 'Every campaign is checked by our team before it goes live.'
                  : 'You will be asked to sign in before your campaign is submitted.'}
              </p>
            </form>
          )}

          {step === 2 && (
            <div className="mt-8 space-y-6">
              <Card className="p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <div>
                    <h3 className="font-bold">Sign in to publish</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your campaign draft is saved. Sign in with your account to
                      publish and receive donations.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid gap-4">
                <Button size="lg" className="w-full" variant="success" onClick={() => router.push('/login?next=/dashboard/campaigns')}>
                  Log in to existing account
                </Button>
                <Button size="lg" className="w-full" variant="outline" onClick={() => router.push('/register')}>
                  Create a new account
                </Button>
              </div>

            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function MobileDeepLinkGateway({
  campaignId,
  open,
  onClose,
}: {
  campaignId: string;
  open: boolean;
  onClose: () => void;
}) {
  const {
    showGateway,
    appInstalled,
    deepLinkUrl,
    storeUrl,
    dismissGateway,
    proceedToApp,
    proceedToStore,
  } = useMobileDeepLink(campaignId, { scheme: 'hopenest' });

  const [pulse, setPulse] = React.useState(false);

  React.useEffect(() => {
    if (!showGateway) return;
    const id = setInterval(() => setPulse((p) => !p), 1200);
    return () => clearInterval(id);
  }, [showGateway]);

  return (
    <Dialog open={open && showGateway} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className={cn('h-5 w-5 text-emerald-500', pulse && 'animate-pulse')} />
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
              <strong>HopeNest app not found.</strong> You will be redirected
              to the app store to download it.
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
            <Button variant="ghost" size="icon" onClick={dismissGateway} aria-label="Dismiss">
              <span className="sr-only">Dismiss</span>
              ✕
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
