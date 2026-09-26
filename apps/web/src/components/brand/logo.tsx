import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * The official HopeNest artwork, cut from the supplied logo into
 * `public/brand/`. The wordmark's navy "Hope" disappears on dark surfaces, so
 * on a dark background place the logo on a light chip rather than recolouring
 * it.
 */

/** The heart mark on its own: hands holding the three figures. */
export function LogoMark({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/hopenest-mark.png"
      alt=""
      width={512}
      height={450}
      priority={priority}
      className={cn('h-10 w-auto', className)}
    />
  );
}

export function Logo({
  className,
  variant = 'horizontal',
  priority,
}: {
  className?: string;
  /**
   * `horizontal` — mark beside the wordmark, for bars and compact spaces.
   * `stacked`    — the full logo as supplied: mark, wordmark and tagline.
   */
  variant?: 'horizontal' | 'stacked';
  priority?: boolean;
}) {
  if (variant === 'stacked') {
    return (
      <Image
        src="/brand/hopenest-logo.png"
        alt="HopeNest — Real People. Real Causes. Greater Impact."
        width={900}
        height={696}
        priority={priority}
        className={cn('h-auto w-44', className)}
      />
    );
  }

  return (
    <span className={cn('flex items-center gap-2', className)}>
      <LogoMark priority={priority} />
      <Image
        src="/brand/hopenest-wordmark.png"
        alt="HopeNest"
        width={900}
        height={178}
        priority={priority}
        className="h-[1.35rem] w-auto sm:h-6"
      />
    </span>
  );
}
