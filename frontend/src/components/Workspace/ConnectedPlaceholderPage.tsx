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
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader eyebrow={badge} title={title} icon={Compass} subtitle={subtitle} />

        <div className="flex items-start gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-surface-foreground">
          <Compass className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            This is a <span className="font-semibold">hub</span>, not the feature itself — it ties the
            related areas together. Jump into a linked workspace below to do the actual work.
          </p>
        </div>

        <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Link2 className="h-4 w-4" />
              Linked workflows
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group rounded-lg border border-border bg-muted px-4 py-4 transition-colors hover:border-input hover:bg-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Layers3 className="h-4 w-4" />
              What you can do here
            </div>
            <ul className="space-y-3 text-sm text-foreground">
              {highlights.map((highlight) => (
                <li key={highlight} className="rounded-lg bg-muted px-3 py-2">
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
