// import { AnimatePresence, motion } from 'framer-motion';
// import { Clock, Calendar, Briefcase, DollarSign, ArrowRight, Download } from 'lucide-react';
// import { TimeEntry } from './types';
// import { Badge } from '../Calendar_updated/components/ui/badge';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// import { Button } from '../Calendar_updated/components/ui/button';

// const exportTimeEntries = (timeEntries: TimeEntry[]) => {
//   const headers = ['Description', 'Project', 'Date', 'Duration', 'Billable', 'Tags'];
//   const rows = timeEntries.map((entry) => [
//     `"${entry.description || 'Untitled Task'}"`,
//     entry.project ? entry.project.name : 'No Project',
//     new Date(entry.startTime).toLocaleDateString(),
//     entry.duration ? `${Math.floor(entry.duration / 3600)}h ${Math.floor((entry.duration % 3600) / 60)}m` : '0m',
//     entry.billable ? 'Yes' : 'No',
//     entry.tags ? entry.tags.map((tag) => tag.name).join(', ') : '',
//   ]);
//   const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
//   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//   const url = URL.createObjectURL(blob);
//   const link = document.createElement('a');
//   link.setAttribute('href', url);
//   link.setAttribute('download', `time_entries_${new Date().toISOString().split('T')[0]}.csv`);
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
//   URL.revokeObjectURL(url);
// };

// export const TimeEntriesList = ({
//   timeEntries,
//   loading,
//   sortBy,
//   setSortBy,
//   formatTime,
// }: {
//   timeEntries: TimeEntry[];
//   loading: boolean;
//   sortBy: 'newest' | 'oldest' | 'duration';
//   setSortBy: (value: 'newest' | 'oldest' | 'duration') => void;
//   formatTime: (seconds: number) => string;
// }) => (
//   <div className="mt-10 bg-[#FFFFFF] dark:bg-[#2D3748] rounded-2xl shadow-lg p-8 border border-[#D8BFD8]/30">
//     <div className="flex justify-between items-center mb-6">
//       <h2 className="text-xl font-serif font-semibold flex items-center text-[#2D3748] dark:text-[#E6E6FA]">
//         <Calendar className="mr-2 h-5 w-5 text-[#D8BFD8]" />
//         Recent Time Entries
//       </h2>
//       <div className="flex items-center gap-4">
//         <Select onValueChange={setSortBy} value={sortBy}>
//           <SelectTrigger className="w-44 bg-[#F7F7F7] dark:bg-[#3C4A5E] border-[#D8BFD8]/50 text-[#6B7280] dark:text-[#B0C4DE]">
//             <SelectValue placeholder="Sort by" />
//           </SelectTrigger>
//           <SelectContent className="bg-[#F7F7F7] dark:bg-[#3C4A5E] border-[#D8BFD8]/50">
//             <SelectItem value="newest">Newest First</SelectItem>
//             <SelectItem value="oldest">Oldest First</SelectItem>
//             <SelectItem value="duration">Longest First</SelectItem>
//           </SelectContent>
//         </Select>
//         <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//           <Button
//             variant="outline"
//             onClick={() => exportTimeEntries(timeEntries)}
//             className="bg-[#F7F7F7] dark:bg-[#3C4A5E] border-[#D8BFD8]/50 text-[#B0C4DE] hover:bg-[#D8BFD8]/20 shadow-sm"
//           >
//             <Download className="h-4 w-4 mr-2" />
//             Export Entries
//           </Button>
//         </motion.div>
//       </div>
//     </div>

//     {loading ? (
//       <div className="py-12 text-center text-[#B0C4DE]">
//         <motion.div
//           animate={{ rotate: 360 }}
//           transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
//         >
//           <Clock className="h-8 w-8 mx-auto mb-4" />
//         </motion.div>
//         Loading time entries...
//       </div>
//     ) : timeEntries.length === 0 ? (
//       <div className="py-12 text-center text-[#B0C4DE]">
//         <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
//         <p>No time entries yet. Start tracking your time!</p>
//       </div>
//     ) : (
//       <div className="space-y-4">
//         <AnimatePresence>
//           {timeEntries.map((entry) => (
//             <motion.div
//               key={entry.id}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               transition={{ duration: 0.4, ease: 'easeOut' }}
//             >
//               <div className="border border-[#D8BFD8]/30 rounded-xl p-5 bg-[#F7F7F7] dark:bg-[#3C4A5E] hover:bg-[#D8BFD8]/10 transition-all shadow-sm hover:shadow-md">
//                 <div className="grid grid-cols-3 gap-4 items-center">
//                   <div className="col-span-2">
//                     <h3 className="font-serif text-lg font-semibold mb-2 text-[#2D3748] dark:text-[#E6E6FA]">
//                       {entry.description || 'Untitled Task'}
//                     </h3>
//                     <div className="flex items-center gap-4 text-sm text-[#6B7280] dark:text-[#B0C4DE]">
//                       {entry.project && (
//                         <div className="flex items-center">
//                           <Briefcase className="h-4 w-4 mr-1" />
//                           {entry.project.name}
//                         </div>
//                       )}
//                       <div className="flex items-center">
//                         <Calendar className="h-4 w-4 mr-1" />
//                         {new Date(entry.startTime).toLocaleDateString()}
//                       </div>
//                     </div>
//                     {entry.tags && entry.tags.length > 0 && (
//                       <div className="flex flex-wrap gap-2 mt-3">
//                         {entry.tags.map((tag) => (
//                           <Badge
//                             key={tag.id}
//                             variant="outline"
//                             className="px-3 py-1 text-sm flex items-center gap-1 border-[#D8BFD8]/50 text-[#B0C4DE] bg-[#D8BFD8]/10"
//                           >
//                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
//                             {tag.name}
//                           </Badge>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                   <div className="flex items-center justify-end gap-3">
//                     {entry.billable && <DollarSign className="h-5 w-5 text-[#D8BFD8]" />}
//                     <span className="font-mono text-xl text-[#2D3748] dark:text-[#E6E6FA]">{formatTime(entry.duration)}</span>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           ))}
//         </AnimatePresence>
//       </div>
//     )}
//     <div className="mt-8 text-center">
//       <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//         <Button
//           variant="link"
//           asChild
//           className="text-[#B0C4DE] hover:text-[#D8BFD8] transition-colors"
//         >
//           <a href="/reports" className="flex items-center justify-center">
//             View all time entries
//             <ArrowRight className="ml-1 h-4 w-4" />
//           </a>
//         </Button>
//       </motion.div>
//     </div>
//   </div>
// );
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Calendar, Briefcase, DollarSign, ArrowRight, Download, Tag, Trash2 } from 'lucide-react';
import { TimeEntry } from './types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../Calendar_updated/components/ui/button';
import { useMemo, useState } from 'react';

const COLLAPSED_ENTRY_COUNT = 3;

const exportTimeEntries = (timeEntries: TimeEntry[]) => {
  const headers = ['Description', 'Project', 'Date', 'Duration', 'Billable', 'Tags'];
  const rows = timeEntries.map((entry) => [
    `"${entry.description || 'Untitled Task'}"`,
    entry.project ? entry.project.name : 'No Project',
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
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const formatEntryTimeRange = (entry: TimeEntry) => {
  const start = new Date(entry.startTime);
  const end = entry.endTime ? new Date(entry.endTime) : null;
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (Number.isNaN(start.getTime())) {
    return 'Time unavailable';
  }

  if (!end || Number.isNaN(end.getTime())) {
    return `From ${formatter.format(start)}`;
  }

  return `From ${formatter.format(start)} to ${formatter.format(end)}`;
};

export const TimeEntriesList = ({
  timeEntries,
  loading,
  sortBy,
  setSortBy,
  formatTime,
  onDeleteEntry,
  deletingEntryId,
}: {
  timeEntries: TimeEntry[];
  loading: boolean;
  sortBy: 'newest' | 'oldest' | 'duration';
  setSortBy: (value: 'newest' | 'oldest' | 'duration') => void;
  formatTime: (seconds: number) => string;
  onDeleteEntry?: (entryId: number) => Promise<void> | void;
  deletingEntryId?: number | null;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const visibleEntries = isExpanded
    ? sortedEntries
    : sortedEntries.slice(0, COLLAPSED_ENTRY_COUNT);

  const hiddenEntryCount = Math.max(0, sortedEntries.length - visibleEntries.length);

  return (
  <div className="mt-10 rounded-[1.5rem] border border-[#D8BFD8]/30 bg-[#FFFFFF]/95 p-4 shadow-[0_20px_45px_rgba(45,55,72,0.12)] backdrop-blur sm:p-6 md:p-8 dark:bg-[#1f2b3b]/92">
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="flex items-center text-xl font-serif font-semibold text-[#2D3748] dark:text-[#E6E6FA]">
        <Calendar className="mr-2 h-5 w-5 text-[#D8BFD8]" />
        Recent Time Entries
      </h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Select onValueChange={setSortBy} value={sortBy}>
          <SelectTrigger className="h-11 w-full rounded-2xl border-[#D8BFD8]/50 bg-[#F8FAFC] text-[#6B7280] dark:bg-[#2d3c52] dark:text-[#B0C4DE] sm:h-10 sm:w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-[#F7F7F7] dark:bg-[#3C4A5E] border-[#D8BFD8]/50">
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="duration">Longest First</SelectItem>
          </SelectContent>
        </Select>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            onClick={() => exportTimeEntries(timeEntries)}
            className="h-11 w-full rounded-2xl border-[#D8BFD8]/50 bg-[#F8FAFC] text-[#6B7280] shadow-sm hover:bg-[#D8BFD8]/20 dark:bg-[#2d3c52] dark:text-[#B0C4DE] sm:h-10 sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Entries
          </Button>
        </motion.div>
      </div>
    </div>

    {loading ? (
      <div className="py-12 text-center text-[#B0C4DE]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Clock className="h-8 w-8 mx-auto mb-4" />
        </motion.div>
        Loading time entries...
      </div>
    ) : sortedEntries.length === 0 ? (
      <div className="py-12 text-center text-[#B0C4DE]">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No time entries yet. Start tracking your time!</p>
      </div>
    ) : (
      <div className="space-y-4">
        <AnimatePresence>
          {visibleEntries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="rounded-2xl border border-[#D8BFD8]/30 bg-[#F8FAFC] p-4 shadow-sm transition-all hover:bg-[#D8BFD8]/10 hover:shadow-md dark:bg-[#2d3c52]">
                  <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-3 sm:items-center">
                    <div className="space-y-2 sm:col-span-2">
                      <h3 className="font-serif text-base font-semibold text-[#2D3748] sm:text-lg dark:text-[#E6E6FA]">
                      {entry.description || 'Untitled Task'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B7280] dark:text-[#B0C4DE] sm:text-sm">
                      <div className="inline-flex items-center rounded-full bg-[#E2E8F0]/80 px-2.5 py-1 dark:bg-[#1f2b3b]">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(entry.startTime).toLocaleDateString()}
                      </div>
                      <div className="inline-flex items-center rounded-full bg-[#E2E8F0]/80 px-2.5 py-1 dark:bg-[#1f2b3b]">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatEntryTimeRange(entry)}
                      </div>
                      {entry.project && (
                        <div className="inline-flex items-center rounded-full bg-[#E2E8F0]/80 px-2.5 py-1 dark:bg-[#1f2b3b]">
                          <Briefcase className="h-4 w-4 mr-1" />
                          {entry.project.name}
                        </div>
                      )}
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="inline-flex items-center gap-1 rounded-full bg-[#E2E8F0]/80 px-2.5 py-1 dark:bg-[#1f2b3b]">
                          <Tag className="h-4 w-4" />
                          {entry.tags.map((tag) => tag.name).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-start gap-3 sm:justify-end">
                    {entry.billable && <DollarSign className="h-5 w-5 text-[#D8BFD8]" />}
                    <span className="font-mono text-xl text-[#2D3748] dark:text-[#E6E6FA]">{formatTime(entry.duration)}</span>
                    {onDeleteEntry && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onDeleteEntry(entry.id)}
                        disabled={deletingEntryId === entry.id}
                        className="h-9 rounded-xl border-rose-200 bg-rose-50 px-3 text-rose-700 hover:bg-rose-100 dark:border-rose-700/60 dark:bg-rose-900/20 dark:text-rose-200"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="ml-1 text-xs font-semibold">{deletingEntryId === entry.id ? 'Deleting' : 'Delete'}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sortedEntries.length > COLLAPSED_ENTRY_COUNT && (
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsExpanded((previous) => !previous)}
              className="rounded-xl border-[#D8BFD8]/50 bg-[#F8FAFC] text-[#6B7280] hover:bg-[#D8BFD8]/20 dark:bg-[#2d3c52] dark:text-[#B0C4DE]"
            >
              {isExpanded ? 'Show less entries' : `Show ${hiddenEntryCount} more entries`}
            </Button>
          </div>
        )}
      </div>
    )}
    <div className="mt-8 text-center">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="link"
          asChild
          className="text-[#B0C4DE] hover:text-[#D8BFD8] transition-colors"
        >
          <a href="/reports" className="flex items-center justify-center">
            View all time entries
            <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </Button>
      </motion.div>
    </div>
  </div>
  );
};