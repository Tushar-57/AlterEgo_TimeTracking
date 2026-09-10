import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';
import { useToast } from '../../hooks/use-toast';

/**
 * Renders the live toast queue.
 *
 * This was missing entirely: App mounted <ToastProvider> and <ToastViewport>
 * but nothing ever mapped `useToast().toasts` into <Toast> elements, so every
 * toast(...) call in the app was a no-op — session-expired warnings, save
 * failures and delete confirmations all silently went nowhere.
 */
export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props} onOpenChange={(open) => !open && dismiss(id)}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      {/* On a phone this sat across the bottom, over the timer controls and
          the nav, and nothing could be tapped through it. Toasts now come from
          the top on small screens, clear of the safe area, and drop back to
          the bottom-right corner once there is room for them. */}
      <ToastViewport
        className="pointer-events-none fixed inset-x-0 top-0 z-[2147483647] m-0 flex w-full list-none flex-col gap-2 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))] outline-none sm:inset-x-auto sm:bottom-0 sm:right-0 sm:top-auto sm:w-[390px] sm:max-w-[100vw] sm:flex-col-reverse sm:p-6 sm:pt-6"
      />
    </ToastProvider>
  );
}
