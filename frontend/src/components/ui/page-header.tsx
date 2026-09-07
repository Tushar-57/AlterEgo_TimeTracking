import type { LucideIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";

export interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  /** Small uppercase eyebrow above the title. */
  eyebrow?: string;
  icon?: LucideIcon;
  /** Right-aligned actions (buttons, filters). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Consistent top-of-page block: eyebrow / title / subtitle on the left,
 * an optional actions slot on the right. Token-styled.
 */
export function PageHeader({ title, subtitle, eyebrow, icon: Icon, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-primary">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        </div>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
