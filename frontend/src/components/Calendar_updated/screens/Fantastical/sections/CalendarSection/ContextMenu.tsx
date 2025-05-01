import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../components/ui/button';
import { Checkbox, Checkbox as RadixCheckbox } from '@radix-ui/react-checkbox';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAddTimeEntry: () => void;
}

export const ContextMenu = ({ x, y, onClose, onAddTimeEntry }: ContextMenuProps) => {
  const [defaultAction, setDefaultAction] = useState<string>(
    localStorage.getItem('defaultCalendarAction') || 'addTimeEntry'
  );
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const { innerWidth, innerHeight } = window;
      const menuWidth = menu.offsetWidth;
      const menuHeight = menu.offsetHeight;
      let adjustedX = x;
      let adjustedY = y;

      if (x + menuWidth > innerWidth) {
        adjustedX = innerWidth - menuWidth - 10;
      }
      if (y + menuHeight > innerHeight) {
        adjustedY = innerHeight - menuHeight - 10;
      }

      menu.style.left = `${adjustedX}px`;
      menu.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  const handleDefaultChange = (action: string) => {
    setDefaultAction(action);
    localStorage.setItem('defaultCalendarAction', action);
  };

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50"
      role="menu"
      aria-label="Calendar context menu"
    >
      <div className="flex flex-col gap-1 w-48">
        <Button
          variant="ghost"
          className="px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex justify-start"
          onClick={() => {
            onAddTimeEntry();
            onClose();
          }}
          role="menuitem"
        >
          Add Time Entry
        </Button>
        <Button
          variant="ghost"
          className="px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex justify-start"
          onClick={() => {
            navigate('/aiplanner');
            onClose();
          }}
          role="menuitem"
        >
          Open Planner
        </Button>
        <div className="flex items-center gap-2 px-3 py-2">
          <Checkbox
            id="default-action"
            checked={defaultAction === 'addTimeEntry'}
            onCheckedChange={(checked) =>
              handleDefaultChange(checked ? 'addTimeEntry' : 'openPlanner')
            }
          />
          <label
            htmlFor="default-action"
            className="text-sm text-gray-600 dark:text-gray-300"
          >
            Set as default (left-click)
          </label>
        </div>
      </div>
    </motion.div>
  );
};