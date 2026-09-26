'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api';
import { usePostUpdate } from '@/lib/queries';
import { cn } from '@/lib/utils';

/** Mirrors CreateCampaignUpdateDto in apps/api so failures surface before a round trip. */
const schema = z.object({
  title: z.string().trim().min(3, 'Give the update a short title').max(200),
  content: z
    .string()
    .trim()
    .min(10, 'Write at least a sentence')
    .max(10_000, 'Updates are limited to 10,000 characters'),
});

type FormValues = z.infer<typeof schema>;

export function PostUpdateModal({
  campaignId,
  open,
  onOpenChange,
}: {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const postUpdate = usePostUpdate();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', content: '' },
    mode: 'onBlur',
  });

  React.useEffect(() => {
    if (open) {
      reset();
      postUpdate.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const contentLength = watch('content')?.length ?? 0;

  const onSubmit = (values: FormValues) => {
    postUpdate.mutate(
      { campaignId, title: values.title, content: values.content },
      {
        onSuccess: () => {
          toast({
            variant: 'success',
            title: 'Update posted',
            description: 'Your supporters can see it on the campaign page.',
          });
          onOpenChange(false);
        },
        onError: (error) => {
          toast({
            variant: 'destructive',
            title: 'Could not post the update',
            description: apiErrorMessage(error),
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-muted-foreground" />
            Post an update
          </DialogTitle>
          <DialogDescription>
            Updates appear publicly on your campaign page. Donors are far more likely to
            give again when they can see progress.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="update-title">Title</Label>
            <Input
              id="update-title"
              placeholder="Surgery is scheduled for Tuesday"
              aria-invalid={Boolean(errors.title)}
              {...register('title')}
            />
            {errors.title ? (
              <p className="text-xs font-medium text-destructive">{errors.title.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="update-content">What has changed?</Label>
              <span
                className={cn(
                  'tabular text-xs',
                  contentLength > 10_000 ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {contentLength.toLocaleString('en-US')} / 10,000
              </span>
            </div>
            <textarea
              id="update-content"
              rows={7}
              placeholder="Thanks to your support we reached the deposit the hospital needed…"
              aria-invalid={Boolean(errors.content)}
              className={cn(
                'flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors',
                'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
                'aria-[invalid=true]:border-destructive',
              )}
              {...register('content')}
            />
            {errors.content ? (
              <p className="text-xs font-medium text-destructive">{errors.content.message}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" disabled={postUpdate.isPending}>
              {postUpdate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting…
                </>
              ) : (
                'Post update'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
