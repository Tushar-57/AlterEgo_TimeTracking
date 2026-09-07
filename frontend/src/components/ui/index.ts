/**
 * Canonical UI primitive barrel. Import primitives from `@/components/ui`
 * (never reach into `Calendar_updated/components/ui/*` from new code).
 *
 * The shadcn-style set currently lives under Calendar_updated/ for historical
 * reasons; this barrel is the stable public path. Physical consolidation into
 * this folder is a Phase 5 cleanup — see DESIGN_SYSTEM.md.
 */

// shadcn-style set (token-based)
export * from "../Calendar_updated/components/ui/badge";
export * from "../Calendar_updated/components/ui/button";
export * from "../Calendar_updated/components/ui/card";
export * from "../Calendar_updated/components/ui/dialog";
export * from "../Calendar_updated/components/ui/input";
export * from "../Calendar_updated/components/ui/scroll-area";
export * from "../Calendar_updated/components/ui/separator";
export * from "../Calendar_updated/components/ui/slider";
export * from "../Calendar_updated/components/ui/switch";
export * from "../Calendar_updated/components/ui/tabs";
export * from "../Calendar_updated/components/ui/toggle";
export * from "../Calendar_updated/components/ui/toggle-group";
export * from "../Calendar_updated/components/ui/tooltip";

// local primitives
export * from "./select";
export * from "./toast";
export * from "./textarea";
export * from "./icon-button";
export * from "./page-header";
export { Skeleton } from "./Skeleton";
