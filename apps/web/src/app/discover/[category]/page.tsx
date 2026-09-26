import type { Metadata } from 'next';
import { CATEGORY_SLUGS, resolveCategory } from '@/lib/category-data';
import { CategoryHubClient } from './category-hub-client';

interface CategoryPageProps {
  params: { category: string };
}

/**
 * The listed categories are prerendered; anything else still renders on demand
 * through `resolveCategory`'s fallback, so a category added on the API side is
 * browsable without a deploy.
 */
export function generateStaticParams() {
  return CATEGORY_SLUGS.map((category) => ({ category }));
}

export function generateMetadata({ params }: CategoryPageProps): Metadata {
  const category = resolveCategory(params.category);
  const title = `${category.title} Fundraising`;

  return {
    title,
    description: category.description,
    alternates: { canonical: `/discover/${category.slug}` },
    openGraph: {
      title: `${title} · HopeNest`,
      description: category.description,
      type: 'website',
      url: `/discover/${category.slug}`,
    },
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const category = resolveCategory(params.category);

  // Search engines read the accordion contents from here; the accordion itself
  // starts collapsed, which hides the answers from a crawler that does not click.
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: category.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Content is authored in category-data.ts, never user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <CategoryHubClient slug={params.category.toLowerCase()} />
    </>
  );
}
