import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Calendar, Briefcase, DollarSign, ArrowRight, Download } from 'lucide-react';
import { TimeEntry } from './types';
import { Badge } from '../Calendar_updated/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../Calendar_updated/components/ui/button';

// Utility function to convert time entries to CSV
const exportTimeEntries = (timeEntries: TimeEntry[]) => {
  // Define CSV headers
  const headers = ['Description', 'Project', 'Date', 'Duration', 'Billable', 'Tags'];

  // Map time entries to CSV rows
  const rows = timeEntries.map((entry) => [
    `"${entry.description || 'Untitled Task'}"`, // Wrap in quotes to handle commas
    entry.project ? entry.project.name : 'No Project',
    new Date(entry.startTime).toLocaleDateString(),
    entry.duration ? `${Math.floor(entry.duration / 3600)}h ${Math.floor((entry.duration % 3600) / 60)}m` : '0m',
    entry.billable ? 'Yes' : 'No',
    entry.tags ? entry.tags.map((tag) => tag.name).join(', ') : '',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  // Create a Blob for the CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  // Create a temporary link to trigger the download
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `time_entries_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const TimeEntriesList = ({
  timeEntries,
  loading,
  sortBy,
  setSortBy,
  formatTime,
}: {
  timeEntries: TimeEntry[];
  loading: boolean;
  sortBy: 'newest' | 'oldest' | 'duration';
  setSortBy: (value: 'newest' | 'oldest' | 'duration') => void;
  formatTime: (seconds: number) => string;
}) => (
  <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold flex items-center">
        <Calendar className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        Recent Time Entries
      </h2>
      <div className="flex items-center gap-4">
        <Select onValueChange={setSortBy} value={sortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="duration">Longest First</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => exportTimeEntries(timeEntries)}>
          <Download className="h-4 w-4 mr-1" />
          Export Entries
        </Button>
      </div>
    </div>

    {/* Entries List */}
    {loading ? (
      <div className="py-10 text-center text-gray-500 dark:text-gray-400">
        Loading time entries...
      </div>
    ) : timeEntries.length === 0 ? (
      <div className="py-10 text-center text-gray-500 dark:text-gray-400">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>No time entries yet. Start tracking your time!</p>
      </div>
    ) : (
      <div className="space-y-4">
        <AnimatePresence>
          {timeEntries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="border dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm hover:shadow-md"
              >
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="col-span-2">
                    <h3 className="font-semibold text-lg mb-1">{entry.description || 'Untitled Task'}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {entry.project && (
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1" />
                          {entry.project.name}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(entry.startTime).toLocaleDateString()}
                      </div>
                    </div>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {entry.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="px-3 py-1 text-sm flex items-center gap-1"
                          >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {entry.billable && <DollarSign className="h-5 w-5 text-green-500" />}
                    <span className="font-mono text-xl">{formatTime(entry.duration)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    )}
    <div className="mt-6 text-center">
      <Button variant="link" asChild>
        <a href="/reports" className="flex items-center justify-center">
          View all time entries
          <ArrowRight className="ml-1 h-4 w-4" />
        </a>
      </Button>
    </div>
  </div>
);