import { Check } from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/lib/utils';

/** Mirrors PASSWORD_RULE in apps/api so the user sees failures before a round trip. */
export const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'A lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'An uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'A number', test: (value: string) => /\d/.test(value) },
  { label: 'A special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
    'Password must include upper and lower case, a number and a special character',
  );

/** Live checklist under a new-password field. */
export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
      {PASSWORD_RULES.map((rule) => {
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
  );
}
