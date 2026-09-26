'use client';

import * as React from 'react';
import { ImagePlus, Loader2, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '@/lib/api';
import { useUploadCampaignCover } from '@/lib/queries';
import { cn } from '@/lib/utils';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Cover photo field for the campaign wizard. The file uploads as soon as it is
 * chosen, so publishing never waits on it; the parent only ever receives the
 * stored URL (or null). The server re-checks type and size, so these client
 * checks are for fast feedback, not security.
 */
export function CoverPhotoPicker({
  value,
  onChange,
  onBusyChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const upload = useUploadCampaignCover();
  const [preview, setPreview] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);

  // Free the object URL when it is replaced or the picker unmounts.
  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  React.useEffect(() => {
    onBusyChange?.(upload.isPending);
  }, [upload.isPending, onBusyChange]);

  const choose = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError('Choose a JPEG, PNG or WebP photo.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('That photo is over 5 MB. Choose a smaller one.');
      return;
    }

    setPreview(URL.createObjectURL(file));
    onChange(null);
    upload.mutate(file, {
      onSuccess: (url) => onChange(url),
      onError: (err) => {
        setPreview(null);
        setError(apiErrorMessage(err, 'The photo could not be uploaded. Try again.'));
      },
    });
  };

  const clear = () => {
    setPreview(null);
    setError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const shown = preview ?? value;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id="coverPhoto"
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        onChange={(event) => choose(event.target.files?.[0])}
      />

      {shown ? (
        <div className="relative overflow-hidden rounded-2xl border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview / uploaded file */}
          <img src={shown} alt="Campaign cover preview" className="aspect-[16/9] w-full object-cover" />

          {upload.isPending ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-card">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading photo…
              </span>
            </div>
          ) : (
            <div className="absolute bottom-3 right-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-card/95 backdrop-blur"
                onClick={() => inputRef.current?.click()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-card/95 text-destructive backdrop-blur hover:text-destructive"
                onClick={clear}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            choose(event.dataTransfer.files?.[0]);
          }}
          className={cn(
            'flex aspect-[16/9] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 text-center transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            dragging ? 'border-success bg-success/5' : 'border-border bg-secondary/40 hover:border-success/60 hover:bg-secondary/70',
          )}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card text-success shadow-card">
            {dragging ? <UploadCloud className="h-6 w-6" /> : <ImagePlus className="h-6 w-6" />}
          </span>
          <span>
            <span className="block text-sm font-bold text-foreground">
              {dragging ? 'Drop the photo here' : 'Add a cover photo'}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Drag and drop, or click to browse · JPEG, PNG or WebP · up to 5 MB
            </span>
          </span>
        </button>
      )}

      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Campaigns with a real photo of the person or place get noticeably more support.
        </p>
      )}
    </div>
  );
}
