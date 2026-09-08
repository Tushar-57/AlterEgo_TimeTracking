/**
 * Shared UI primitive barrel for the AlterEgo app.
 *
 * The canonical shadcn-style primitives currently live under
 * `components/Calendar_updated/components/ui/` (token-based: Button, Card, Input,
 * Badge, …). Re-exported here so app code can pull them from one place:
 *
 *   import { Button, Card, PageHeader } from '../ui';
 *
 * Existing deep relative imports keep working; new code should prefer this barrel.
 */
export { Button, buttonVariants } from '../Calendar_updated/components/ui/button';
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '../Calendar_updated/components/ui/card';
export { Input } from '../Calendar_updated/components/ui/input';
export { Badge, badgeVariants } from '../Calendar_updated/components/ui/badge';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from './select';
export { Skeleton } from './Skeleton';
export { PageHeader } from './PageHeader';
export { EmptyState } from './EmptyState';
