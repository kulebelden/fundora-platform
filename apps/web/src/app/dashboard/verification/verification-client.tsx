'use client';

import * as React from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { AlertCircle, ArrowLeft, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { KycStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { api, apiErrorMessage } from '@/lib/api';
import { queryKeys, useKycStatus, useMe } from '@/lib/queries';
import type { KycStatusView } from '@/lib/types';

const schema = z.object({
  nationalIdOrPassport: z
    .string()
    .trim()
    .min(4, 'Enter the document number')
    .max(64, 'That document number is too long'),
  documentUrl: z
    .string()
    .trim()
    .url('Enter a valid link')
    .refine((value) => value.startsWith('https://'), 'The link must use https'),
});

type FormValues = z.infer<typeof schema>;

export function VerificationClient() {
  const { data: me, isLoading: meLoading } = useMe();
  const { data: kyc, isLoading } = useKycStatus();
  const queryClient = useQueryClient();

  const submitKyc = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data } = await api.post<KycStatusView>('/kyc/submit', values);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.kyc, data);
      toast({
        variant: 'success',
        title: 'Documents submitted',
        description: 'Our compliance team will review them shortly.',
      });
    },
    onError: (error) =>
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: apiErrorMessage(error),
      }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onBlur' });

  const status = kyc?.status ?? 'NOT_STARTED';
  const locked = status === 'VERIFIED' || status === 'SUBMITTED';

  return (
    <>
      <SiteHeader />

      <main id="main" className="container max-w-2xl pb-10 pt-6 sm:pt-8">
        <Link
          href="/dashboard/campaigns"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Your campaigns
        </Link>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Identity verification</h1>
            <p className="mt-1.5 text-muted-foreground">
              Verification unlocks bank withdrawals and shows donors your cause is genuine.
            </p>
          </div>
          {!isLoading ? <KycStatusBadge status={status} /> : null}
        </div>

        {meLoading || isLoading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading verification status…
          </div>
        ) : !me ? (
          <Card className="mt-8 p-14 text-center">
            <h2 className="text-xl font-bold">Sign in to verify your identity</h2>
            <Button className="mt-6" asChild>
              <Link href="/login?next=/dashboard/verification">Log in</Link>
            </Button>
          </Card>
        ) : (
          <>
            {kyc?.rejectionReason ? (
              <div
                role="alert"
                className="mt-6 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div>
                  <p className="font-semibold">Your last submission was rejected</p>
                  <p className="mt-0.5 text-muted-foreground">{kyc.rejectionReason}</p>
                </div>
              </div>
            ) : null}

            <Card className="mt-6 p-6">
              {locked ? (
                <div className="py-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/12">
                    <ShieldCheck className="h-7 w-7 text-success" />
                  </div>
                  <h2 className="mt-4 text-lg font-bold">
                    {status === 'VERIFIED' ? 'You are verified' : 'Review in progress'}
                  </h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    {status === 'VERIFIED'
                      ? 'You can request withdrawals to your bank account.'
                      : 'We are checking your documents. This usually takes one business day.'}
                  </p>
                  {kyc?.nationalIdOrPassport ? (
                    <p className="mt-4 font-mono text-xs text-muted-foreground">
                      Document on file: {kyc.nationalIdOrPassport}
                    </p>
                  ) : null}
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit((values) => submitKyc.mutate(values))}
                  className="space-y-5"
                  noValidate
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="nationalIdOrPassport">National ID or passport number</Label>
                    <Input
                      id="nationalIdOrPassport"
                      placeholder="CM90012345ABCD"
                      autoComplete="off"
                      aria-invalid={Boolean(errors.nationalIdOrPassport)}
                      {...register('nationalIdOrPassport')}
                    />
                    {errors.nationalIdOrPassport ? (
                      <p className="text-xs font-medium text-destructive">
                        {errors.nationalIdOrPassport.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="documentUrl">Link to a scan of the document</Label>
                    <Input
                      id="documentUrl"
                      type="url"
                      placeholder="https://storage.example.com/my-id.jpg"
                      aria-invalid={Boolean(errors.documentUrl)}
                      {...register('documentUrl')}
                    />
                    {errors.documentUrl ? (
                      <p className="text-xs font-medium text-destructive">
                        {errors.documentUrl.message}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        The API stores a link, not the file. Direct upload arrives with the
                        media service.
                      </p>
                    )}
                  </div>

                  <p className="flex items-start gap-2 rounded-lg bg-secondary/60 p-3.5 text-xs text-muted-foreground">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                    Your document number is stored securely and only ever shown back to you
                    masked to its last four characters.
                  </p>

                  <Button type="submit" size="lg" className="w-full" disabled={submitKyc.isPending}>
                    {submitKyc.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      'Submit for verification'
                    )}
                  </Button>
                </form>
              )}
            </Card>
          </>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
