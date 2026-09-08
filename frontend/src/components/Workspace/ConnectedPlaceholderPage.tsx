import { ArrowRight, Compass, Layers3, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PageHeader } from '../ui/page-header';

type QuickLink = {
  label: string;
  to: string;
  description: string;
};

type ConnectedPlaceholderPageProps = {
  title: string;
  subtitle: string;
  badge: string;
  quickLinks: QuickLink[];
  highlights: string[];
};

const ConnectedPlaceholderPage = ({
  title,
  subtitle,
  badge,
  quickLinks,
  highlights,
}: ConnectedPlaceholderPageProps) => {
  return (
    <div className="min-h-full bg-background px-4 py-6 sm:px-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="relative border-b border-border bg-surface px-6 py-8 sm:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              {badge}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>
            <p className="mt-3 text-xs text-muted-foreground/80">
              This is a hub, not the feature itself — it links the workflows that feed into {title.toLowerCase()}.
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Link2 className="h-4 w-4" />
              Linked workflows
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group rounded-xl border border-border bg-surface px-4 py-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/60 transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Layers3 className="h-4 w-4" />
              What you can do here
            </div>
            <ul className="space-y-3 text-sm text-foreground">
              {highlights.map((highlight) => (
                <li key={highlight} className="rounded-lg bg-surface px-3 py-2">
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ConnectedPlaceholderPage;
