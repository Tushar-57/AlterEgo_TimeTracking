import { ArrowRight, Layers3, Link2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative bg-gradient-to-r from-amber-100 via-orange-50 to-rose-100 px-6 py-8 sm:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
              <Sparkles className="h-3.5 w-3.5" />
              {badge}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-700 sm:text-base">{subtitle}</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600">
              <Link2 className="h-4 w-4" />
              Linked Workflows
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                      <p className="mt-1 text-xs text-slate-600">{item.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600">
              <Layers3 className="h-4 w-4" />
              What You Can Do Here
            </div>
            <ul className="space-y-3 text-sm text-slate-700">
              {highlights.map((highlight) => (
                <li key={highlight} className="rounded-lg bg-slate-50 px-3 py-2">
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
