import { useCallback } from 'react';

export function useToast() {
  const toast = useCallback((props: {
    title?: string
    description?: string
    variant?: 'default' | 'destructive'
    action?: React.ReactNode
  }) => {
    toast({
      title: props.title,
      description: props.description,
      variant: props.variant,
      action: props.action,
    });
  }, []);
  return { toast };
}