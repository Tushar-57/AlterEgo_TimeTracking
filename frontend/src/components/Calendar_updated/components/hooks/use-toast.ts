/**
 * Re-export of the canonical toast store.
 *
 * This file used to be a second, byte-for-byte copy of src/hooks/use-toast.ts.
 * Each copy owns its own module-level `memoryState` and `listeners`, so the
 * screens importing from here were pushing toasts into a store that nothing
 * rendered — the Toaster reads the other one. The path is kept so the existing
 * importers don't all have to change, but there is now exactly one store.
 */
export { useToast, toast } from '../../../../hooks/use-toast';
