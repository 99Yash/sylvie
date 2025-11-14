'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '~/components/ui/field';
import { Textarea } from '~/components/ui/textarea';

const MAX_CHARS = 280;

export function NoteForm() {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const remaining = MAX_CHARS - note.length;

  function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Note saved');
      setNote('');
    }, 700);
  }

  function handleClear() {
    setNote('');
  }

  return (
    <Card className="w-full max-w-2xl text-left">
      <CardHeader>
        <CardTitle className="text-2xl">Quick note</CardTitle>
        <CardDescription>
          Jot something down. It&apos;s just for you.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="note-textarea">Note</FieldLabel>
                <Textarea
                  id="note-textarea"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write a quick note..."
                  maxLength={MAX_CHARS}
                  className="min-h-32 resize-none text-base"
                />
                <FieldDescription>
                  {remaining} character{remaining === 1 ? '' : 's'} remaining
                  <span className="ml-2 inline-flex items-center gap-1 text-muted-foreground/70">
                    <span className="size-1.5 rounded-full bg-ring/70" />
                    Autosave coming soon
                  </span>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>
        <CardFooter className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={!note || isSaving}
          >
            Clear
          </Button>
          <Button type="submit" disabled={!note.trim() || isSaving}>
            {isSaving ? 'Saving…' : 'Save note'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

