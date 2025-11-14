'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty';
import { Skeleton } from '~/components/ui/skeleton';
import { trpc } from '~/lib/trpc';

/**
 * Extract plain text from HTML string for content preview
 */
function getPlainText(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: basic HTML tag removal and entity decoding
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * Format content preview with character limit and ellipsis
 */
function formatContentPreview(html: string, maxLength: number = 150): string {
  const plainText = getPlainText(html);
  if (plainText.length <= maxLength) {
    return plainText;
  }
  // Truncate at word boundary if possible
  const truncated = plainText.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + '...';
  }
  return truncated + '...';
}

export function NotesList() {
  const {
    data: notes,
    isLoading,
    error,
  } = useQuery(trpc.note.list.queryOptions());

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText className="size-6" />
              </EmptyMedia>
              <EmptyTitle>Failed to load notes</EmptyTitle>
              <EmptyDescription>
                There was an error loading your notes. Please try again later.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText className="size-6" />
              </EmptyMedia>
              <EmptyTitle>No notes yet</EmptyTitle>
              <EmptyDescription>
                Get started by creating your first note above. Your notes will
                appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      {notes.map((note) => (
        <Card key={note.id} className="text-left">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-lg font-semibold line-clamp-2">
                {note.title}
              </CardTitle>
              {note.createdAt &&
                (() => {
                  const createdAtDate =
                    typeof note.createdAt === 'string'
                      ? new Date(note.createdAt)
                      : note.createdAt;
                  return (
                    <time
                      className="text-xs text-muted-foreground whitespace-nowrap shrink-0"
                      dateTime={createdAtDate.toISOString()}
                      title={createdAtDate.toLocaleString()}
                    >
                      {formatDistanceToNow(createdAtDate, {
                        addSuffix: true,
                      })}
                    </time>
                  );
                })()}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3 wrap-break-word">
              {formatContentPreview(note.content)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
