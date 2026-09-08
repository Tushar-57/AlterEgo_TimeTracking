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
        {/* The mobile app bar already names the section, so the eyebrow is
            desktop-only to avoid saying the same thing twice. */}
        {eyebrow && (
          <p className="mb-1 hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-primary md:block">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface text-primary md:h-9 md:w-9">
              <Icon className="h-4 w-4 md:h-5 md:w-5" />
            </span>
          )}
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground md:text-2xl">{title}</h1>
        </div>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
