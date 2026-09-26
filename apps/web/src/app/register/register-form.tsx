'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertCircle, Check, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { AuthSplitLayout } from '@/components/auth-split-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiErrorMessage } from '@/lib/api';
import { useRegister } from '@/lib/queries';
import { cn } from '@/lib/utils';

/** Mirrors RegisterDto in apps/api so the user sees failures before a round trip. */
const RULES = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'A lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'An uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'A number', test: (value: string) => /\d/.test(value) },
  { label: 'A special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

const schema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address').max(255),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, 'Use international format, for example +256700000000'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
      'Password must include upper and lower case, a number and a special character',
    ),
});

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const registerUser = useRegister();

  const [showPassword, setShowPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onBlur' });

  const password = watch('password') ?? '';

  const onSubmit = (values: FormValues) => {
    setFormError(null);
    registerUser.mutate(values, {
      onSuccess: () => router.push('/dashboard/campaigns'),
      onError: (error) =>
        setFormError(apiErrorMessage(error, 'Could not create your account.')),
    });
  };

  return (
    <AuthSplitLayout
      title="Create your account"
      subtitle="Start a campaign or give to one. It takes a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-accent hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {formError ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <span>{formError}</span>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              autoComplete="given-name"
              placeholder="Amara"
              aria-invalid={Boolean(errors.firstName)}
              {...register('firstName')}
            />
            {errors.firstName ? (
              <p className="text-xs font-medium text-destructive">{errors.firstName.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              autoComplete="family-name"
              placeholder="Okello"
              aria-invalid={Boolean(errors.lastName)}
              {...register('lastName')}
            />
            {errors.lastName ? (
              <p className="text-xs font-medium text-destructive">{errors.lastName.message}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          {errors.email ? (
            <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phoneNumber">Phone number</Label>
          <Input
            id="phoneNumber"
            type="tel"
            autoComplete="tel"
            placeholder="+256700000000"
            aria-invalid={Boolean(errors.phoneNumber)}
            {...register('phoneNumber')}
          />
          {errors.phoneNumber ? (
            <p className="text-xs font-medium text-destructive">{errors.phoneNumber.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className="pr-11"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
            {RULES.map((rule) => {
              const met = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={cn(
                    'flex items-center gap-1.5 text-xs transition-colors',
                    met ? 'text-success' : 'text-muted-foreground',
                  )}
                >
                  <Check className={cn('h-3.5 w-3.5', !met && 'opacity-30')} />
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={registerUser.isPending}>
          {registerUser.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Create account
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to HopeNest&apos;s terms and privacy policy.
        </p>
      </form>
    </AuthSplitLayout>
  );
}
