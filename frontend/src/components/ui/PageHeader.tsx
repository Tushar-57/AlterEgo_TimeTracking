import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  /** Right-aligned controls (buttons, filters). */
  actions?: ReactNode;
  className?: string;
};

/**
 * Consistent top-of-page header used across every tab under the sidebar.
 * Pure token styling so it themes correctly in light and dark.
 */
export const PageHeader = ({ title, description, icon: Icon, actions, className }: PageHeaderProps) => (
  <div
    className={cn(
      'flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between',
      className,
    )}
  >
    <div className="flex items-start gap-3">
      {Icon ? (
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);

export default PageHeader;
