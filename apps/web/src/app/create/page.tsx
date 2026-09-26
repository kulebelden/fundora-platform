import { redirect } from 'next/navigation';

/**
 * Public shorthand for the creation wizard, so marketing links and the category hub
 * CTAs can point at `/create?category=medical` without knowing where the wizard
 * actually lives. The query string is carried through and pre-fills step 1.
 */
export default function CreateRedirectPage({
  searchParams,
}: {
  searchParams: { category?: string | string[] };
}) {
  const raw = searchParams.category;
  const category = (Array.isArray(raw) ? raw[0] : raw)?.trim().toLowerCase();

  redirect(
    category
      ? `/dashboard/campaigns/create?category=${encodeURIComponent(category)}`
      : '/dashboard/campaigns/create',
  );
}
