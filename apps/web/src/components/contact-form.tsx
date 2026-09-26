'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  ArrowRight,
  CheckCircle2,
  Handshake,
  HandCoins,
  LifeBuoy,
  Loader2,
  Lock,
  Megaphone,
  MessageCircle,
  Newspaper,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiErrorMessage } from '@/lib/api';
import { useMe, useSubmitContact } from '@/lib/queries';
import type { ContactTopic } from '@/lib/types';
import { cn } from '@/lib/utils';

const TOPICS: Array<{ value: ContactTopic; label: string; icon: LucideIcon }> = [
  { value: 'general', label: 'General question', icon: MessageCircle },
  { value: 'donation', label: 'A donation I made', icon: HandCoins },
  { value: 'campaign', label: 'My campaign', icon: Megaphone },
  { value: 'payout', label: 'Payouts & withdrawals', icon: Wallet },
  { value: 'trust_safety', label: 'Report a concern', icon: LifeBuoy },
  { value: 'press', label: 'Press & media', icon: Newspaper },
  { value: 'partnership', label: 'Partnerships', icon: Handshake },
];

/** Topics where a campaign link helps us find the record straight away. */
const LINK_TOPICS = new Set<ContactTopic>(['donation', 'campaign', 'payout', 'trust_safety']);

const MESSAGE_MAX = 5000;

const SCHEMA = z.object({
  name: z.string().trim().min(2, 'Please tell us your name').max(120),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === '' || /^\+?[0-9 ()-]{7,20}$/.test(v), 'Enter a valid phone number')
    .optional(),
  topic: z.enum(['general', 'donation', 'campaign', 'payout', 'trust_safety', 'press', 'partnership']),
  subject: z.string().trim().min(3, 'Add a short subject').max(200),
  message: z
    .string()
    .trim()
    .min(20, 'Please give us a little more detail (at least 20 characters)')
    .max(MESSAGE_MAX),
  campaignLink: z
    .string()
    .trim()
    .max(2048)
    .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'Paste the full link, starting with https://')
    .optional(),
  website: z.string().optional(),
});

type FormValues = z.infer<typeof SCHEMA>;

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs font-medium text-destructive">{message}</p> : null;
}

export function ContactForm() {
  const { data: me } = useMe();
  const submit = useSubmitContact();
  const [reference, setReference] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(SCHEMA),
    mode: 'onBlur',
    defaultValues: { topic: 'general', name: '', email: '', phone: '', subject: '', message: '', campaignLink: '' },
  });

  // Signed-in visitors don't need to retype who they are.
  React.useEffect(() => {
    if (!me) return;
    const name = `${me.firstName} ${me.lastName}`.trim();
    if (name) setValue('name', name);
    setValue('email', me.email);
  }, [me, setValue]);

  const topic = watch('topic');
  const messageLength = (watch('message') ?? '').length;

  const onSubmit = (values: FormValues) => {
    setFormError(null);
    submit.mutate(
      {
        name: values.name,
        email: values.email,
        topic: values.topic,
        subject: values.subject,
        message: values.message,
        ...(values.phone ? { phone: values.phone } : {}),
        ...(values.campaignLink && LINK_TOPICS.has(values.topic) ? { campaignLink: values.campaignLink } : {}),
        ...(values.website ? { website: values.website } : {}),
      },
      {
        onSuccess: (data) => setReference(data.reference),
        onError: (error) => setFormError(apiErrorMessage(error, 'Your message could not be sent.')),
      },
    );
  };

  if (reference) {
    return (
      <div className="flex flex-col items-center px-6 py-14 text-center sm:px-10">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h3 className="mt-5 text-2xl font-extrabold tracking-tight">Message received</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Thank you. A member of our team will reply to{' '}
          <span className="font-semibold text-foreground">{watch('email')}</span>, usually within a few
          hours.
        </p>
        <p className="mt-5 rounded-full border bg-secondary/60 px-4 py-1.5 text-xs font-semibold">
          Reference <span className="tabular font-mono">{reference}</span>
        </p>
        <Button
          variant="outline"
          className="mt-7"
          onClick={() => {
            reset({ topic: 'general', name: watch('name'), email: watch('email'), phone: watch('phone'), subject: '', message: '', campaignLink: '' });
            setReference(null);
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 p-6 sm:p-8">
      {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Full name</Label>
          <Input id="contact-name" autoComplete="name" aria-invalid={Boolean(errors.name)} {...register('name')} />
          <FieldError message={errors.name?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">Email address</Label>
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          <FieldError message={errors.email?.message} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-phone">
          Phone <span className="font-normal text-muted-foreground">(optional, for a call back)</span>
        </Label>
        <Input
          id="contact-phone"
          type="tel"
          autoComplete="tel"
          placeholder="+256 700 000000"
          aria-invalid={Boolean(errors.phone)}
          {...register('phone')}
        />
        <FieldError message={errors.phone?.message} />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">What is it about?</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TOPICS.map(({ value, label, icon: Icon }) => {
            const selected = topic === value;
            return (
              <label
                key={value}
                className={cn(
                  'flex cursor-pointer flex-col items-start gap-2 rounded-xl border p-3 text-xs font-semibold transition-colors',
                  'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                  selected ? 'border-success bg-success/10 text-foreground' : 'hover:border-success/50 hover:bg-secondary/60',
                )}
              >
                <input type="radio" value={value} className="sr-only" {...register('topic')} />
                <Icon className={cn('h-4 w-4', selected ? 'text-success' : 'text-muted-foreground')} />
                {label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="contact-subject">Subject</Label>
        <Input
          id="contact-subject"
          placeholder="A few words about your question"
          aria-invalid={Boolean(errors.subject)}
          {...register('subject')}
        />
        <FieldError message={errors.subject?.message} />
      </div>

      {LINK_TOPICS.has(topic) ? (
        <div className="space-y-1.5">
          <Label htmlFor="contact-link">
            Campaign link <span className="font-normal text-muted-foreground">(helps us find it faster)</span>
          </Label>
          <Input
            id="contact-link"
            type="url"
            inputMode="url"
            placeholder="https://hopenest.org/campaigns/…"
            aria-invalid={Boolean(errors.campaignLink)}
            {...register('campaignLink')}
          />
          <FieldError message={errors.campaignLink?.message} />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="contact-message">Message</Label>
          <span className={cn('tabular text-xs', messageLength > MESSAGE_MAX ? 'text-destructive' : 'text-muted-foreground')}>
            {messageLength.toLocaleString()} / {MESSAGE_MAX.toLocaleString()}
          </span>
        </div>
        <textarea
          id="contact-message"
          rows={6}
          placeholder="Tell us what happened, what you expected, and anything you've already tried."
          aria-invalid={Boolean(errors.message)}
          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive"
          {...register('message')}
        />
        <FieldError message={errors.message?.message} />
      </div>

      {formError ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse items-stretch gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Never include card numbers, passwords or ID documents. We will never ask for them here.
        </p>
        <Button type="submit" size="lg" variant="success" className="shrink-0" disabled={submit.isPending}>
          {submit.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              Send message
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
