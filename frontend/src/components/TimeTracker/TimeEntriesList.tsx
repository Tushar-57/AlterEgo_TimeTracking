import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Calendar, DollarSign, ArrowRight, Download, Tag, Trash2 } from 'lucide-react';
import { TimeEntry, Project } from './types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../Calendar_updated/components/ui/button';
import { useMemo, useState } from 'react';

const COLLAPSED_ENTRY_COUNT = 3;

const exportTimeEntries = (timeEntries: TimeEntry[]) => {
  const headers = ['Description', 'Project', 'Date', 'Duration', 'Billable', 'Tags'];
  const rows = timeEntries.map((entry) => [
    `"${entry.description || 'Untitled Task'}"`,
    entry.project ? entry.project.name : 'No project',
    new Date(entry.startTime).toLocaleDateString(),
    entry.duration ? `${Math.floor(entry.duration / 3600)}h ${Math.floor((entry.duration % 3600) / 60)}m` : '0m',
    entry.billable ? 'Yes' : 'No',
    entry.tags ? entry.tags.map((tag) => tag.name).join(', ') : '',
  ]);
  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `time_entries_${new Date().toISOString().split('T')[0]}.csv`);
  link.click();
  URL.revokeObjectURL(url);
};

const formatEntryTimeRange = (entry: TimeEntry) => {
  const start = new Date(entry.startTime);
  const end = entry.endTime ? new Date(entry.endTime) : null;
  const formatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

  if (Number.isNaN(start.getTime())) {
    return 'Time unavailable';
  }

  if (!end || Number.isNaN(end.getTime())) {
    return `From ${formatter.format(start)}`;
  }

  return `${formatter.format(start)} – ${formatter.format(end)}`;
};

const Meta = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
    {children}
  </span>
);

export const TimeEntriesList = ({
  timeEntries,
  loading,
  sortBy,
  setSortBy,
  formatTime,
  onDeleteEntry,
  deletingEntryId,
  projects = [],
}: {
  timeEntries: TimeEntry[];
  loading: boolean;
  sortBy: 'newest' | 'oldest' | 'duration';
  setSortBy: (value: 'newest' | 'oldest' | 'duration') => void;
  formatTime: (seconds: number) => string;
  onDeleteEntry?: (entryId: number) => Promise<void> | void;
  deletingEntryId?: number | null;
  /** Used to resolve a bare `projectId` when the API doesn't nest the project. */
  projects?: Project[];
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const projectsById = useMemo(() => {
    const map = new Map<number, Project>();
    projects.forEach((project) => map.set(Number(project.id), project));
    return map;
  }, [projects]);

  const sortedEntries = useMemo(() => {
    const entries = [...timeEntries];

    if (sortBy === 'oldest') {
      return entries.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }

    if (sortBy === 'duration') {
      return entries.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    }

    return entries.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [sortBy, timeEntries]);

  const visibleEntries = isExpanded ? sortedEntries : sortedEntries.slice(0, COLLAPSED_ENTRY_COUNT);
  const hiddenEntryCount = Math.max(0, sortedEntries.length - visibleEntries.length);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Recent entries</h2>
          <p className="text-xs text-muted-foreground">
            {sortedEntries.length} {sortedEntries.length === 1 ? 'entry' : 'entries'} tracked
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select onValueChange={setSortBy} value={sortBy}>
            <SelectTrigger className="h-9 w-full sm:w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="duration">Longest first</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => exportTimeEntries(timeEntries)}
            disabled={sortedEntries.length === 0}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : sortedEntries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center">
          <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No entries yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Name what you&apos;re working on above and hit Start — it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {visibleEntries.map((entry) => {
              const project = entry.project ?? projectsById.get(Number(entry.projectId));
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="group flex flex-col gap-3 rounded-xl border border-border bg-background p-3 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      {project && (
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: project.color || 'hsl(var(--muted-foreground))' }}
                          aria-hidden="true"
                        />
                      )}
                      <p className="truncate text-sm font-medium text-foreground">
                        {entry.description || 'Untitled entry'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {project && <Meta>{project.name}</Meta>}
                      <Meta>
                        <Calendar className="h-3 w-3" />
                        {new Date(entry.startTime).toLocaleDateString()}
                      </Meta>
                      <Meta>
                        <Clock className="h-3 w-3" />
                        {formatEntryTimeRange(entry)}
                      </Meta>
                      {entry.tags && entry.tags.length > 0 && (
                        <Meta>
                          <Tag className="h-3 w-3" />
                          {entry.tags.map((tag) => tag.name).join(', ')}
                        </Meta>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 sm:justify-end">
                    {entry.billable && (
                      <span title="Billable" className="text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                      </span>
                    )}
                    <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                      {formatTime(entry.duration)}
                    </span>
                    {onDeleteEntry && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete entry "${entry.description || 'Untitled entry'}"`}
                        onClick={() => onDeleteEntry(entry.id)}
                        disabled={deletingEntryId === entry.id}
                        isLoading={deletingEntryId === entry.id}
                        className="text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {sortedEntries.length > COLLAPSED_ENTRY_COUNT && (
            <div className="pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setIsExpanded((previous) => !previous)}
              >
                {isExpanded ? 'Show fewer' : `Show ${hiddenEntryCount} more`}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-border pt-3 text-center">
        <Button variant="link" size="sm" asChild>
          <a href="/reports" className="inline-flex items-center">
            View all entries
            <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
};
