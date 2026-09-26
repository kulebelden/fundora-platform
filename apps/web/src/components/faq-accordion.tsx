'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Single-open accordion. Deliberately hand-rolled rather than pulling in
 * @radix-ui/react-accordion: the behaviour is a button plus a region, and the
 * disclosure pattern below is what a screen reader expects either way.
 */
export function FaqAccordion({
  items,
  className,
  idPrefix = 'faq',
}: {
  items: FaqItem[];
  className?: string;
  /** Keeps ids unique when more than one accordion shares a page. */
  idPrefix?: string;
}) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <div className={cn('divide-y rounded-xl border bg-card shadow-card', className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${idPrefix}-panel-${index}`;
        const buttonId = `${idPrefix}-button-${index}`;

        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-bold transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-6 sm:text-base"
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
