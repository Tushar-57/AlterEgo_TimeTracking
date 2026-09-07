import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

type ThemeToggleProps = {
  className?: string;
  withLabel?: boolean;
};

const ThemeToggle = ({ className = '', withLabel = false }: ThemeToggleProps) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground ${className}`}
      aria-label={isDark ? 'Switch to day mode' : 'Switch to night mode'}
      title={isDark ? 'Switch to day mode' : 'Switch to night mode'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {withLabel ? <span>{isDark ? 'Day' : 'Night'}</span> : null}
    </button>
  );
};

export default ThemeToggle;
