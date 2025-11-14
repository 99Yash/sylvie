'use client';

import Link from 'next/link';
import { NoteForm } from '~/components/forms/note-form';
import { Button } from '~/components/ui/button';
import { GitHub, LinkedIn, Mail, X } from '~/components/ui/icons';
import { authClient } from '~/lib/auth/client';
import { siteConfig } from '~/lib/site';

export default function Home() {
  const { data: session } = authClient.useSession();

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-background">
      <main className="relative z-10 flex w-full max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
        {session ? (
          <NoteForm />
        ) : (
          <>
            <div className="mb-12">
              <h1 className="heading-xl mb-6 text-balance text-foreground">
                {siteConfig.name}
              </h1>
            </div>

            <div className="mb-12 max-w-2xl">
              <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
                {siteConfig.description}
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="group px-8 py-4 text-lg font-semibold tracking-tight shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                <Link href="/signin">
                  Get Started
                  <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </Button>
            </div>

            <div className="mt-16 flex flex-wrap items-center justify-center gap-6">
              <a
                href={siteConfig.links.x}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-5 w-5 transition-transform group-hover:scale-110" />
              </a>

              <a
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <GitHub className="h-5 w-5 transition-transform group-hover:scale-110" />
              </a>

              <a
                href={siteConfig.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <LinkedIn className="h-5 w-5 transition-transform group-hover:scale-110" />
              </a>

              <a
                href={`mailto:${siteConfig.links.mail}`}
                className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-5 w-5 transition-transform group-hover:scale-110" />
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
