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
      <ToastViewport className="fixed bottom-0 right-0 z-[2147483647] m-0 flex w-[390px] max-w-[100vw] list-none flex-col gap-2 p-6 outline-none" />
    </ToastProvider>
  );
}
