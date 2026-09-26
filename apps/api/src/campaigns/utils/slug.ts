import { randomUUID } from 'crypto';

export function slugify(value: string): string {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function uniqueSlug(value: string, length = 6): string {
  return `${slugify(value)}-${randomUUID().slice(0, length)}`;
}
