'use client';

import * as React from 'react';
import { FolderTree, Loader2, Plus } from 'lucide-react';
import { BarList, EmptyState, PageHeading, Panel } from '@/components/admin/admin-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api';
import { useAdminOverview, useCategories, useCreateCategory } from '@/lib/queries';

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const { data: categories, isLoading } = useCategories();
  const { data: overview } = useAdminOverview();
  const create = useCreateCategory();
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  const usage = new Map((overview?.categories ?? []).map((row) => [row.slug, row]));
  const items = (categories ?? [])
    .map((category) => {
      const row = usage.get(category.slug);
      return {
        key: category.id,
        label: category.name,
        value: row?.campaigns ?? 0,
        note: row?.live ? `${row.live} live` : undefined,
      };
    })
    .sort((a, b) => b.value - a.value);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    create.mutate(
      { name: trimmed, ...(description.trim() ? { description: description.trim() } : {}) },
      {
        onSuccess: (category) => {
          toast({ title: 'Category added', description: category.name });
          setName('');
          setDescription('');
        },
        onError: (err) =>
          toast({ variant: 'destructive', title: 'Category not added', description: apiErrorMessage(err) }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Categories"
        description="What fundraisers can file their campaigns under, and how many campaigns each one holds."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Panel title="Campaigns per category" description={`${categories?.length ?? 0} categories`}>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-8 rounded-lg" />
              ))}
            </div>
          ) : items.length ? (
            <BarList items={items} />
          ) : (
            <EmptyState icon={FolderTree} title="No categories yet" />
          )}
        </Panel>

        <Panel title="Add a category">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={name}
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Sports & Recreation"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category-description">
                Description <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <textarea
                id="category-description"
                rows={3}
                value={description}
                maxLength={500}
                onChange={(event) => setDescription(event.target.value)}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" className="w-full" disabled={create.isPending || name.trim().length < 2}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add category
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
