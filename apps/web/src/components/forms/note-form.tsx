'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { trpc } from '~/lib/trpc';

const MAX_CHARS = 280;

export function NoteForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();
  const remaining = MAX_CHARS - content.length;

  const createNote = useMutation(trpc.note.create.mutationOptions());

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    try {
      await createNote.mutateAsync({
        title: title.trim() || 'Untitled',
        content: content.trim() || '',
      });
      toast.success('Note saved successfully!');
      setTitle('');
      setContent('');
      // Invalidate and refetch notes list
      const listQueryOptions = trpc.note.list.queryOptions();
      await queryClient.invalidateQueries({
        queryKey: listQueryOptions.queryKey,
      });
    } catch (error) {
      toast.error('Failed to save note. Please try again.');
    }
  }

  function handleClear() {
    setTitle('');
    setContent('');
  }

  const hasContent = title.trim() || content.trim();

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSave} className="group">
        <div className="rounded-lg border border-transparent bg-transparent transition-colors focus-within:border-border/50 focus-within:bg-card/50">
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="border-0 bg-transparent px-0 text-2xl font-semibold shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing..."
            maxLength={MAX_CHARS}
            className="min-h-[200px] border-0 bg-transparent px-0 text-base shadow-none resize-none placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
          />
        </div>
        <div className="mt-4 flex items-center justify-between opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <div className="text-xs text-muted-foreground">
            {remaining} character{remaining === 1 ? '' : 's'} remaining
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!hasContent || createNote.isPending}
              className="h-8"
            >
              Clear
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!hasContent || createNote.isPending}
              className="h-8"
            >
              {createNote.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
