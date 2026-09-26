'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ImageCarousel({
  images,
  alt,
  fallbackLabel,
}: {
  images: string[];
  alt: string;
  fallbackLabel?: string;
}) {
  const [index, setIndex] = React.useState(0);
  const count = images.length;

  const go = React.useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  if (count === 0) {
    return (
      <div className="brand-gradient flex aspect-[16/9] w-full items-center justify-center rounded-2xl">
        <span className="px-8 text-center text-lg font-semibold text-white/85">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-muted"
      role="region"
      aria-roledescription="carousel"
      aria-label={alt}
    >
      <div className="aspect-[16/9] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote campaign media */}
        <img
          src={images[index]}
          alt={count > 1 ? `${alt} — image ${index + 1} of ${count}` : alt}
          className="h-full w-full object-cover"
        />
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-lift transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next image"
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-lift transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((image, dot) => (
              <button
                key={image}
                type="button"
                onClick={() => go(dot)}
                aria-label={`Go to image ${dot + 1}`}
                aria-current={dot === index}
                className={cn(
                  'h-2 rounded-full bg-white/60 transition-all',
                  dot === index ? 'w-6 bg-white' : 'w-2 hover:bg-white/80',
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
