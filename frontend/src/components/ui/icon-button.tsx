import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";
import { buttonVariants } from "../Calendar_updated/components/ui/button";

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  /** Required — icon-only controls must carry an accessible name. */
  "aria-label": string;
  variant?: ButtonVariant;
  size?: "sm" | "default" | "lg";
  isLoading?: boolean;
  asChild?: boolean;
}

const SIZE_CLASS: Record<NonNullable<IconButtonProps["size"]>, string> = {
  sm: "h-8 w-8",
  default: "h-9 w-9",
  lg: "h-10 w-10",
};

/**
 * Square, icon-only button. Same visual language as <Button> but the type
 * system forces an `aria-label` so these never ship nameless.
 */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { className, variant = "ghost", size = "default", isLoading = false, asChild = false, disabled, children, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          buttonVariants({ variant, size: "icon" }),
          SIZE_CLASS[size],
          "shrink-0 p-0",
          className,
        )}
        {...props}
      >
        {isLoading && !asChild ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
      </Comp>
    );
  },
);
IconButton.displayName = "IconButton";

export { IconButton };
