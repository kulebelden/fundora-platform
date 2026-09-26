'use client';

/** Minimal toast store in the shadcn/ui shape, backed by a module-level subscription list. */
import * as React from 'react';
import type { ToastActionElement, ToastProps } from '@/components/ui/toast';

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 6000;

// `title` is omitted because ToastProps inherits the DOM's `title?: string` attribute,
// while a toast heading may be arbitrary React content.
export interface ToasterToast extends Omit<ToastProps, 'title'> {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
}

type State = { toasts: ToasterToast[] };

let count = 0;
function nextId(): string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

let memoryState: State = { toasts: [] };
const listeners: Array<(state: State) => void> = [];
const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

function setState(next: State): void {
  memoryState = next;
  listeners.forEach((listener) => listener(memoryState));
}

function scheduleRemove(id: string): void {
  if (timeouts.has(id)) return;
  timeouts.set(
    id,
    setTimeout(() => {
      timeouts.delete(id);
      setState({ toasts: memoryState.toasts.filter((t) => t.id !== id) });
    }, TOAST_REMOVE_DELAY),
  );
}

export function dismiss(id?: string): void {
  const targets = id ? [id] : memoryState.toasts.map((t) => t.id);
  targets.forEach(scheduleRemove);
  setState({
    toasts: memoryState.toasts.map((t) =>
      !id || t.id === id ? { ...t, open: false } : t,
    ),
  });
}

export function toast(props: Omit<ToasterToast, 'id'>): { id: string; dismiss: () => void } {
  const id = nextId();

  setState({
    toasts: [
      {
        ...props,
        id,
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) dismiss(id);
        },
      },
      ...memoryState.toasts,
    ].slice(0, TOAST_LIMIT),
  });

  return { id, dismiss: () => dismiss(id) };
}

export function useToast() {
  const [state, setLocalState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setLocalState);
    return () => {
      const index = listeners.indexOf(setLocalState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return { ...state, toast, dismiss };
}
