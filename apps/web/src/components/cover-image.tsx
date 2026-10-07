import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Covers uploaded to HopeNest (served under /api/v1/uploads/covers/). Only
 * these go through Next's image optimizer: it resizes them to the width
 * actually shown and re-encodes as WebP, so a phone downloads tens of KB
 * instead of the original upload. Remote cover URLs keep a plain <img>:
 * letting the optimizer fetch arbitrary hosts would be an SSRF risk.
 */
const LOCAL_COVER = /^\/api\/v1\/uploads\/covers\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/i;

export function CoverImage({
  src,
  alt = '',
  sizes,
  priority,
  className,
}: {
  src: string;
  alt?: string;
  /** Rendered width per breakpoint, as for next/image. */
  sizes: string;
  /** For the cover that is the page's main image (above the fold). */
  priority?: boolean;
  className?: string;
}) {
  if (LOCAL_COVER.test(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={72}
        className={cn('object-cover', className)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote cover; see the note above
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={cn('absolute inset-0 h-full w-full object-cover', className)}
    />
  );
}
