import { useEffect, useRef } from 'react';

// Global state to track scroll lock count across components
let scrollLockCount = 0;
let originalOverflow = '';

export function useBodyScrollLock(isLocked: boolean) {
  const isLockedRef = useRef(isLocked);

  useEffect(() => {
    isLockedRef.current = isLocked;

    if (typeof document === 'undefined') return;

    if (isLocked) {
      // Only set overflow on first lock
      if (scrollLockCount === 0) {
        originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
      scrollLockCount++;
    }

    return () => {
      if (isLockedRef.current) {
        scrollLockCount--;
        // Only restore overflow when all locks are released
        if (scrollLockCount === 0) {
          document.body.style.overflow = originalOverflow;
        }
      }
    };
  }, [isLocked]);
}

export default useBodyScrollLock;
