'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { RichTextEditor } from '~/components/rich-text-editor';
import { Button } from '~/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldSet,
} from '~/components/ui/field';
import { Input } from '~/components/ui/input';
import { trpc } from '~/lib/trpc';

const MAX_CHARS = 280;

/**
 * Extract plain text from HTML string for character counting
 */
function getPlainText(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: basic HTML tag removal
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

const formSchema = z.object({
  title: z
    .string()
    .max(100, 'Title must be at most 100 characters.')
    .optional(),
  content: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const plainText = getPlainText(val);
        return plainText.length <= MAX_CHARS;
      },
      {
        message: `Content must be at most ${MAX_CHARS} characters.`,
      }
    )
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function NoteForm() {
  const queryClient = useQueryClient();
  const createNote = useMutation(trpc.note.create.mutationOptions());

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const contentValue = form.watch('content') || '';
  const plainTextContent = getPlainText(contentValue);
  const remaining = MAX_CHARS - plainTextContent.length;
  const hasContent = form.watch('title')?.trim() || plainTextContent.trim();

  async function onSubmit(data: FormValues) {
    try {
      const plainText = getPlainText(data.content || '');
      if (plainText.length > MAX_CHARS) {
        toast.error(`Content exceeds ${MAX_CHARS} characters.`);
        return;
      }

      await createNote.mutateAsync({
        title: data.title?.trim() || 'Untitled',
        content: data.content?.trim() || '',
      });
      toast.success('Note saved successfully!');
      form.reset();
      // Invalidate and refetch notes list
      const listQueryOptions = trpc.note.list.queryOptions();
      await queryClient.invalidateQueries({
        queryKey: listQueryOptions.queryKey,
      });
    } catch (error) {
      toast.error('Failed to save note. Please try again.');
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <form
        id="note-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="group"
      >
        <FieldSet className="gap-0">
          <div className="rounded-lg border border-transparent bg-transparent transition-colors focus-within:border-border/50 focus-within:bg-card/50">
            <FieldGroup className="gap-0">
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field className="gap-0" data-invalid={fieldState.invalid}>
                    <FieldContent className="gap-0">
                      <Input
                        {...field}
                        placeholder="Untitled"
                        className="border-0 bg-transparent px-0 text-2xl font-semibold shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </FieldContent>
                  </Field>
                )}
              />
              <Controller
                name="content"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field className="gap-0" data-invalid={fieldState.invalid}>
                    <FieldContent className="gap-0">
                      <RichTextEditor
                        initialContent={field.value}
                        placeholder="Start writing..."
                        onChange={(html) => {
                          field.onChange(html);
                          // Validate plain text length
                          const plainText = getPlainText(html);
                          if (plainText.length > MAX_CHARS) {
                            form.setError('content', {
                              type: 'manual',
                              message: `Content must be at most ${MAX_CHARS} characters.`,
                            });
                          } else {
                            form.clearErrors('content');
                          }
                        }}
                        onSubmit={(html) => {
                          const plainText = getPlainText(html);
                          if (plainText.length <= MAX_CHARS && hasContent) {
                            form.handleSubmit(onSubmit)();
                          }
                        }}
                        className="border-0 shadow-none"
                        maxHeight="300px"
                        minHeight="200px"
                        showTopToolbar={true}
                        showSubmitButton={false}
                        disabled={createNote.isPending}
                        loading={createNote.isPending}
                      />
                      <FieldDescription className="mt-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                        {remaining} character{remaining === 1 ? '' : 's'}{' '}
                        remaining
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </FieldContent>
                  </Field>
                )}
              />
            </FieldGroup>
          </div>
        </FieldSet>
        <div className="mt-4 flex items-center justify-end gap-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => form.reset()}
            disabled={!hasContent || createNote.isPending}
            className="h-8"
          >
            Clear
          </Button>
          <Button
            type="submit"
            form="note-form"
            size="sm"
            disabled={!hasContent || createNote.isPending}
            className="h-8"
          >
            {createNote.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  );
}
