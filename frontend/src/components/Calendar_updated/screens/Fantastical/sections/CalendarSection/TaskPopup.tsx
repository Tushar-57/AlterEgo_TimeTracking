// import { useState, useEffect, useRef } from 'react';
// import { Button } from '../../../../components/ui/button';
// import { Input } from '../../../../components/ui/input';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '../../../../../ui/select';
// import { useToast } from '../../../../components/hooks/use-toast';
// import { X, Clock } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { fetchWithToken } from '../../../../../../utils/auth';

// interface TaskPopupProps {
//   isOpen: boolean;
//   onClose: () => void;
//   defaultStartTime?: Date;
//   onSave: () => Promise<void>;
// }

// interface Project {
//   id: number;
//   name: string;
// }

// interface Tag {
//   id: number;
//   name: string;
// }

// export function TaskPopup({ isOpen, onClose, defaultStartTime, onSave }: TaskPopupProps) {
//   const [description, setDescription] = useState('');
//   const [startHour, setStartHour] = useState('');
//   const [startMinute, setStartMinute] = useState('');
//   const [endHour, setEndHour] = useState('');
//   const [endMinute, setEndMinute] = useState('');
//   const [projectId, setProjectId] = useState<string | null>(null);
//   const [tagId, setTagId] = useState<string | null>(null);
//   const [duration, setDuration] = useState('');
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [tags, setTags] = useState<Tag[]>([]);
//   const [loading, setLoading] = useState(false);
//   const { toast } = useToast();
//   const popupRef = useRef<HTMLDivElement>(null);

//   // Initialize default start time
//   useEffect(() => {
//     if (defaultStartTime) {
//       const hours = defaultStartTime.getHours().toString().padStart(2, '0');
//       const minutes = defaultStartTime.getMinutes().toString().padStart(2, '0');
//       setStartHour(hours);
//       setStartMinute(minutes);
//       // Set default end time (e.g., 1 hour later)
//       const endTime = new Date(defaultStartTime);
//       endTime.setHours(endTime.getHours() + 1);
//       setEndHour(endTime.getHours().toString().padStart(2, '0'));
//       setEndMinute(endTime.getMinutes().toString().padStart(2, '0'));
//     }
//   }, [defaultStartTime]);

//   // Fetch projects and tags
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const token = sessionStorage.getItem('auth_session');
//         console.log('JWT Token:', token); // Debug token
//         if (!token) {
//           toast({
//             title: 'Authentication Error',
//             description: 'Please log in to load data.',
//             variant: 'destructive',
//           });
//           window.location.href = '/login';
//           return;
//         }

//         // Fetch projects
//         const projectsRes = await fetchWithToken<Project[]>('http://localhost:8080/api/projects/userProjects');
//         setProjects(projectsRes);

//         // Fetch tags
//         const tagsData = await fetchWithToken<Tag[]>('http://localhost:8080/api/tags');
//         setTags(tagsData);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//         toast({
//           title: 'Error',
//           description: 'Failed to load projects or tags. Using fallback options.',
//           variant: 'destructive',
//         });
//         // Fallback options
//         setProjects([
//           { id: 1, name: 'Project A' },
//           { id: 2, name: 'Project B' },
//         ]);
//         setTags([
//           { id: 1, name: 'Development' },
//           { id: 2, name: 'Design' },
//         ]);
//       }
//     };

//     if (isOpen) {
//       fetchData();
//     }
//   }, [isOpen, toast]);

//   // Calculate duration
//   useEffect(() => {
//     if (startHour && startMinute && endHour && endMinute) {
//       const start = new Date();
//       start.setHours(parseInt(startHour), parseInt(startMinute));
//       const end = new Date();
//       end.setHours(parseInt(endHour), parseInt(endMinute));
//       const diffMs = end.getTime() - start.getTime();
//       if (diffMs > 0) {
//         const hours = Math.floor(diffMs / (1000 * 60 * 60));
//         const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
//         setDuration(`${hours}h ${minutes}m`);
//       } else {
//         setDuration('');
//       }
//     } else {
//       setDuration('');
//     }
//   }, [startHour, startMinute, endHour, endMinute]);

//   // Handle outside click and Escape key
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
//         onClose();
//       }
//     };

//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (event.key === 'Escape') {
//         onClose();
//       }
//     };

//     if (isOpen) {
//       document.addEventListener('mousedown', handleClickOutside);
//       document.addEventListener('keydown', handleKeyDown);
//     }

//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//       document.removeEventListener('keydown', handleKeyDown);
//     };
//   }, [isOpen, onClose]);

//   const handleSave = async () => {
//     if (!description || !startHour || !startMinute || !endHour || !endMinute) {
//       toast({
//         title: 'Validation Error',
//         description: 'Please fill in all required fields.',
//         variant: 'destructive',
//       });
//       return;
//     }

//     try {
//       setLoading(true);
//       const token = sessionStorage.getItem('auth_session');
//       if (!token) {
//         toast({
//           title: 'Authentication Error',
//           description: 'Please log in to save the task.',
//           variant: 'destructive',
//         });
//         window.location.href = '/login';
//         return;
//       }

//       const startDateTime = new Date();
//       startDateTime.setHours(parseInt(startHour), parseInt(startMinute));
//       const endDateTime = new Date();
//       endDateTime.setHours(parseInt(endHour), parseInt(endMinute));

//       if (endDateTime <= startDateTime) {
//         toast({
//           title: 'Validation Error',
//           description: 'End time must be after start time.',
//           variant: 'destructive',
//         });
//         return;
//       }

//       // Calculate position
//       const dayOfWeek = startDateTime.getDay();
//       const positionLeft = `${dayOfWeek * 143}px`;
//       const positionTop = `${startDateTime.getHours() * 72 + startDateTime.getMinutes() * 1.2}px`;

//       // Save time entry
//       const response = await fetch('http://localhost:8080/api/addTimer', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           description,
//           projectId: projectId ? parseInt(projectId) : null,
//           tagIds: tagId ? [parseInt(tagId)] : [],
//         }),
//       });

//       if (response.status === 401) {
//         toast({
//           title: 'Session Expired',
//           description: 'Your session has expired. Please log in again.',
//           variant: 'destructive',
//         });
//         // sessionStorage.removeItem('auth_session');
//         // window.location.href = '/login';
//         return;
//       }

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to save time entry');
//       }

//       const data = await response.json();
//       const timerId = data.data.id;

//       // Save position (assuming backend supports this endpoint)
//       const positionResponse = await fetch(`http://localhost:8080/api/timers/${timerId}/position`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           positionTop,
//           positionLeft,
//         }),
//       });

//       if (!positionResponse.ok) {
//         console.warn('Failed to update timer position');
//       }

//       toast({
//         title: 'Task Saved',
//         description: 'Your task has been saved successfully.',
//       });
//       await onSave();
//       onClose();
//     } catch (error) {
//       console.error('Error saving task:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to save task. Please try again.',
//         variant: 'destructive',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Generate hour and minute options
//   const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
//   const minutes = ['00', '15', '30', '45'];

//   if (!isOpen) return null;

//   return (
//     <AnimatePresence>
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
//       >
//         <motion.div
//           ref={popupRef}
//           initial={{ scale: 0.9, y: 50 }}
//           animate={{ scale: 1, y: 0 }}
//           exit={{ scale: 0.9, y: 50 }}
//           transition={{ duration: 0.3, ease: 'easeOut' }}
//           className="bg-white dark:bg-gray-900 rounded-xl p-6 w-[700px] shadow-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-900"
//         >
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Add Task</h3>
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={onClose}
//               className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
//             >
//               <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
//             </Button>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div className="col-span-2">
//               <label
//                 htmlFor="description"
//                 className="text-sm font-medium text-gray-700 dark:text-gray-200"
//               >
//                 Description
//               </label>
//               <Input
//                 id="description"
//                 value={description}
//                 onChange={(e) => setDescription(e.target.value)}
//                 placeholder="Enter task description"
//                 className="mt-1 h-20 text-base bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:shadow-sm"
//               />
//             </div>
//             <div className="col-span-2">
//               <label
//                 htmlFor="time"
//                 className="text-sm font-medium text-gray-700 dark:text-gray-200"
//               >
//                 Time
//               </label>
//               <div className="flex gap-2 mt-1">
//                 <Select value={startHour} onValueChange={(value) => { console.log('Start Hour:', value); setStartHour(value); }}>
//                   <SelectTrigger className="w-24 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
//                     <SelectValue placeholder="HH" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {hours.map((hour) => (
//                       <SelectItem key={hour} value={hour}>
//                         {hour}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 <Select value={startMinute} onValueChange={(value) => { console.log('Start Minute:', value); setStartMinute(value); }}>
//                   <SelectTrigger className="w-24 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
//                     <SelectValue placeholder="MM" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {minutes.map((minute) => (
//                       <SelectItem key={minute} value={minute}>
//                         {minute}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 <span className="flex items-center text-gray-500 dark:text-gray-400">to</span>
//                 <Select value={endHour} onValueChange={(value) => { console.log('End Hour:', value); setEndHour(value); }}>
//                   <SelectTrigger className="w-24 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
//                     <SelectValue placeholder="HH" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {hours.map((hour) => (
//                       <SelectItem key={hour} value={hour}>
//                         {hour}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 <Select value={endMinute} onValueChange={(value) => { console.log('End Minute:', value); setEndMinute(value); }}>
//                   <SelectTrigger className="w-24 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
//                     <SelectValue placeholder="MM" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {minutes.map((minute) => (
//                       <SelectItem key={minute} value={minute}>
//                         {minute}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//             <div>
//               <label
//                 htmlFor="project"
//                 className="text-sm font-medium text-gray-700 dark:text-gray-200"
//               >
//                 Project
//               </label>
//               <Select value={projectId || ''} onValueChange={(value) => { console.log('Project:', value); setProjectId(value); }}>
//                 <SelectTrigger className="mt-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
//                   <SelectValue placeholder="Select project" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {projects.length > 0 ? (
//                     projects.map((project) => (
//                       <SelectItem key={project.id} value={project.id.toString()}>
//                         {project.name}
//                       </SelectItem>
//                     ))
//                   ) : (
//                     <SelectItem value="0">No projects available</SelectItem>
//                   )}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div>
//               <label
//                 htmlFor="tag"
//                 className="text-sm font-medium text-gray-700 dark:text-gray-200"
//               >
//                 Tag
//               </label>
//               <Select value={tagId || ''} onValueChange={(value) => { console.log('Tag:', value); setTagId(value); }}>
//                 <SelectTrigger className="mt-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
//                   <SelectValue placeholder="Select tag" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {tags.length > 0 ? (
//                     tags.map((tag) => (
//                       <SelectItem key={tag.id} value={tag.id.toString()}>
//                         {tag.name}
//                       </SelectItem>
//                     ))
//                   ) : (
//                     <SelectItem value="0">No tags available</SelectItem>
//                   )}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="col-span-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
//               <Clock className="h-4 w-4 text-indigo-500" />
//               <span>Duration: {duration || 'Not set'}</span>
//             </div>
//           </div>

//           <div className="flex justify-end gap-2 mt-4">
//             <Button
//               variant="outline"
//               onClick={onClose}
//               className="border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-4 py-1"
//             >
//               Cancel
//             </Button>
//             <motion.div
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               animate={loading ? { opacity: 0.7 } : { opacity: 1 }}
//             >
//               <Button
//                 onClick={handleSave}
//                 disabled={loading}
//                 className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-1 shadow-sm hover:shadow-md transition-all duration-200"
//               >
//                 {loading ? 'Saving...' : 'Save'}
//               </Button>
//             </motion.div>
//           </div>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }
import { useState, useEffect, useRef } from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../ui/select';
import { useToast } from '../../../../components/hooks/use-toast';
import { X, Clock, ChevronDown, ChevronUp, Sparkles, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '../../../../components/ui/switch';
import { calculatePosition } from '../../../../../Dashboard';
import type { CalendarEvent } from '../../../../components/DraggableEvent';
import { formatMinutesAsHoursMinutes } from '../../../../../../utils/utils';
// import { Label } from '../../../../components/ui/label';

interface TaskPopupProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStartTime?: Date;
  initialEntry?: CalendarEvent | null;
  onSave: () => Promise<void>;
  onDelete?: (entryId: number) => Promise<void> | void;
  onContinue?: (entryId: number) => Promise<void> | void;
}

interface Project {
  id: number;
  name: string;
}

interface Tag {
  id: number;
  name: string;
}

interface OnboardingGoal {
  title?: string;
}

const toLocalDateTimeString = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const roundToNextMinute = (date: Date) => {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  rounded.setMinutes(rounded.getMinutes() + 1);
  return rounded;
};

const formatDateInput = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export function TaskPopup({ isOpen, onClose, defaultStartTime, initialEntry, onSave, onDelete, onContinue }: TaskPopupProps) {
  const [description, setDescription] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [billable, setBillable] = useState(false);
  const [linkedGoal, setLinkedGoal] = useState<string | null>(null);
  const [focusScore, setFocusScore] = useState<string>('');
  const [energyScore, setEnergyScore] = useState<string>('');
  const [contextNotes, setContextNotes] = useState('');
  const [blockers, setBlockers] = useState('');
  const [aiDetail, setAiDetail] = useState('');
  const [duration, setDuration] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [goalOptions, setGoalOptions] = useState<string[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const { toast } = useToast();
  const popupRef = useRef<HTMLDivElement>(null);

  const formatTimeInput = (date: Date) =>
    `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  const resetForm = () => {
    setDescription('');
    setEntryDate('');
    setStartTime('');
    setEndTime('');
    setProjectId(null);
    setSelectedTagIds([]);
    setBillable(false);
    setLinkedGoal(null);
    setFocusScore('');
    setEnergyScore('');
    setContextNotes('');
    setBlockers('');
    setAiDetail('');
  };

  const initializeCreateForm = (baseDate?: Date) => {
    resetForm();

    const start = baseDate ? new Date(baseDate) : roundToNextMinute(new Date());
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    setEntryDate(formatDateInput(start));
    setStartTime(formatTimeInput(start));
    setEndTime(formatTimeInput(end));
  };

  const initializeEditForm = (entry: CalendarEvent) => {
    resetForm();

    const start = new Date(entry.startTime);
    const fallbackDurationSeconds = Number.isFinite(entry.durationSeconds)
      ? (entry.durationSeconds as number)
      : Math.max(900, Math.round((Number.parseFloat(entry.height) / 60) * 3600));
    const end = new Date(start.getTime() + fallbackDurationSeconds * 1000);

    setDescription(entry.title ?? '');
    setEntryDate(formatDateInput(start));
    setStartTime(formatTimeInput(start));
    setEndTime(formatTimeInput(end));
    setProjectId(entry.projectId !== null && entry.projectId !== undefined ? entry.projectId.toString() : null);
    setSelectedTagIds((entry.tagIds ?? []).map((id) => id.toString()));
    setBillable(entry.billable ?? false);
    setLinkedGoal(entry.linkedGoal ?? null);
    setFocusScore(entry.focusScore !== null && entry.focusScore !== undefined ? String(entry.focusScore) : '');
    setEnergyScore(entry.energyScore !== null && entry.energyScore !== undefined ? String(entry.energyScore) : '');
    setBlockers(entry.blockers ?? '');
    setContextNotes(entry.contextNotes ?? '');
    setAiDetail(entry.aiDetail ?? '');
  };

  const toggleTagSelection = (tagValue: string) => {
    setSelectedTagIds((previous) =>
      previous.includes(tagValue)
        ? previous.filter((currentTag) => currentTag !== tagValue)
        : [...previous, tagValue]
    );
  };

  // Initialize form state whenever popup opens in create or edit mode.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setShowAdvancedFields(Boolean(initialEntry));

    if (initialEntry) {
      initializeEditForm(initialEntry);
      return;
    }

    initializeCreateForm(defaultStartTime);
  }, [isOpen, defaultStartTime, initialEntry]);

  // Fetch projects and tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem('auth_session');
        if (!token) {
          toast({
            title: 'Authentication Error',
            description: 'Please log in to load data.',
            variant: 'destructive',
            className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
          });
          window.location.href = '/login';
          return;
        }

        const [projectsRes, tagsRes, onboardingRes] = await Promise.all([
          fetch('/api/projects/userProjects', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/tags', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/onboarding/getOnboardingData', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (projectsRes.status === 401 || tagsRes.status === 401 || onboardingRes.status === 401) {
          throw new Error('Unauthorized');
        }

        const projectsData = await projectsRes.json();
        const tagsData = await tagsRes.json();
        const onboardingData = await onboardingRes.json();

        setProjects(Array.isArray(projectsData) ? projectsData : []);
        setTags(Array.isArray(tagsData) ? tagsData : []);

        const goals = Array.isArray(onboardingData?.goals) ? onboardingData.goals as OnboardingGoal[] : [];
        const goalTitles = goals
          .map((goal) => goal?.title?.trim())
          .filter((title): title is string => Boolean(title));
        setGoalOptions(goalTitles);
        setCatalogLoaded(true);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load projects or tags. Using fallback options.',
          variant: 'destructive',
          className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
        });
      }
    };

    if (isOpen && !catalogLoaded) {
      fetchData();
    }
  }, [catalogLoaded, isOpen, toast]);

  // Calculate duration
  useEffect(() => {
    if (entryDate && startTime && endTime) {
      const [yearRaw, monthRaw, dayRaw] = entryDate.split('-').map(Number);
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);

      if (
        !Number.isFinite(yearRaw)
        || !Number.isFinite(monthRaw)
        || !Number.isFinite(dayRaw)
        || !Number.isFinite(startHours)
        || !Number.isFinite(startMinutes)
        || !Number.isFinite(endHours)
        || !Number.isFinite(endMinutes)
      ) {
        setDuration('');
        return;
      }

      const start = new Date(yearRaw, monthRaw - 1, dayRaw, startHours, startMinutes, 0, 0);
      const end = new Date(yearRaw, monthRaw - 1, dayRaw, endHours, endMinutes, 0, 0);
      const diffMs = end.getTime() - start.getTime();
      if (diffMs > 0) {
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        setDuration(formatMinutesAsHoursMinutes(totalMinutes));
      } else {
        setDuration('');
      }
    } else {
      setDuration('');
    }
  }, [entryDate, startTime, endTime]);

  // Handle outside click, ignoring dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.radix-select-content')
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isOpen]);

  const handleSave = async () => {
    if (!description || !entryDate || !startTime || !endTime) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
      });
      return;
    }

    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth_session');
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to save the task.',
          variant: 'destructive',
          className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
        });
        window.location.href = '/login';
        return;
      }

      // Construct start and end times in local datetime format expected by backend
      const [yearRaw, monthRaw, dayRaw] = entryDate.split('-').map(Number);
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);

      if (
        !Number.isFinite(yearRaw)
        || !Number.isFinite(monthRaw)
        || !Number.isFinite(dayRaw)
        || !Number.isFinite(startHours)
        || !Number.isFinite(startMinutes)
        || !Number.isFinite(endHours)
        || !Number.isFinite(endMinutes)
      ) {
        toast({
          title: 'Validation Error',
          description: 'Please pick a valid date and time range.',
          variant: 'destructive',
          className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
        });
        return;
      }

      const startDate = new Date(yearRaw, monthRaw - 1, dayRaw, startHours, startMinutes, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(endHours, endMinutes, 0, 0);

      if (endDate <= startDate) {
        toast({
          title: 'Validation Error',
          description: 'End time must be after start time.',
          variant: 'destructive',
          className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
        });
        return;
      }

      const startTimeLocal = toLocalDateTimeString(startDate);
      const endTimeLocal = toLocalDateTimeString(endDate);
      const { top, left } = calculatePosition(startTimeLocal);

      const payload = {
        description,
        startTime: startTimeLocal,
        endTime: endTimeLocal,
        projectId: projectId ? parseInt(projectId) : null,
        tagIds: selectedTagIds.map((tagValue) => parseInt(tagValue, 10)).filter((id) => Number.isInteger(id)),
        billable,
        positionTop: top,
        positionLeft: left,
        linkedGoal: linkedGoal || null,
        focusScore: focusScore.trim() ? Number(focusScore) : null,
        energyScore: energyScore.trim() ? Number(energyScore) : null,
        blockers: blockers.trim() || null,
        contextNotes: contextNotes.trim() || null,
        aiDetail: aiDetail.trim() || null,
      };

      const endpoint = initialEntry ? `/api/timers/${initialEntry.id}` : '/api/timers/addTimer';
      const method = initialEntry ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Time entry response:', data);
      if (!data.success) {
        throw new Error(data.message || 'Failed to save time entry');
      }

      toast({
        title: initialEntry ? 'Task Updated' : 'Task Saved',
        description: initialEntry
          ? 'Your task has been updated successfully.'
          : 'Your task has been saved successfully.',
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
      });
      await onSave();
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      toast({
        title: 'Error',
        description: 'Failed to save task. Please try again.',
        variant: 'destructive',
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialEntry || !onDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete(initialEntry.id);
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Delete Failed',
        description: 'Unable to delete this task right now.',
        variant: 'destructive',
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleContinue = async () => {
    if (!initialEntry || !onContinue) {
      return;
    }

    try {
      setIsContinuing(true);
      await onContinue(initialEntry.id);
      onClose();
    } catch (error) {
      console.error('Error continuing task as timer:', error);
      toast({
        title: 'Continue Failed',
        description: 'Unable to continue this entry right now.',
        variant: 'destructive',
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
      });
    } finally {
      setIsContinuing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 backdrop-blur-sm sm:p-4"
      >
        <motion.div
          ref={popupRef}
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full max-h-[95dvh] overflow-y-auto rounded-2xl border border-[#D8BFD8]/45 bg-gradient-to-br from-[#FCFBFF] via-[#F8F5FF] to-[#F1F7FF] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:text-slate-100 sm:max-h-[92vh] sm:max-w-[680px] sm:p-6"
        >
          <div className="sticky top-0 z-10 mb-4 flex items-center justify-between border-b border-[#D8BFD8]/40 bg-[#FCFBFF]/95 pb-3 pt-1 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {initialEntry ? 'Edit Task' : 'Add Task'}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full text-slate-600 hover:bg-[#EFE8FF] dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="col-span-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Description
              </label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                className="mt-1 h-12 rounded-xl border-[#D8BFD8]/50 bg-white/95 text-base text-slate-900 shadow-sm transition-all duration-200 hover:shadow-md focus:border-[#A795C9] focus:ring-[#A795C9] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="entryDate" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Date
              </label>
              <Input
                id="entryDate"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="mt-1 rounded-xl border-[#D8BFD8]/50 bg-white/95 text-slate-900 shadow-sm transition-all duration-200 hover:shadow-md focus:border-[#A795C9] focus:ring-[#A795C9] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              
              <label htmlFor="startTime" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Start Time
              </label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 rounded-xl border-[#D8BFD8]/50 bg-white/95 text-slate-900 shadow-sm transition-all duration-200 hover:shadow-md focus:border-[#A795C9] focus:ring-[#A795C9] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="endTime" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                End Time
              </label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 rounded-xl border-[#D8BFD8]/50 bg-white/95 text-slate-900 shadow-sm transition-all duration-200 hover:shadow-md focus:border-[#A795C9] focus:ring-[#A795C9] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="project" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Project
              </label>
              <Select
                value={projectId || ''}
                onValueChange={(value) => {
                  console.log('Project:', value);
                  setProjectId(value === '0' ? null : value);
                }}
              >
                <SelectTrigger className="z-10 mt-1 rounded-xl border-[#D8BFD8]/50 bg-white/95 text-slate-900 shadow-sm focus:border-[#A795C9] focus:ring-[#A795C9] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent className="radix-select-content z-50 border-[#D8BFD8]/50 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                  <SelectItem value="0">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="tags" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Tags
              </label>
              <div
                id="tags"
                className="mt-1 flex min-h-[44px] flex-wrap gap-2 rounded-xl border border-[#D8BFD8]/50 bg-white/95 p-2 shadow-sm dark:border-slate-600 dark:bg-slate-800"
              >
                <button
                  type="button"
                  onClick={() => setSelectedTagIds([])}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    selectedTagIds.length === 0
                      ? 'border-[#A795C9] bg-[#EDE4FF] text-[#5A4E84] dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100'
                      : 'border-[#D8BFD8]/60 text-slate-600 hover:bg-[#F3EEFF] dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  No tags
                </button>
                {tags.map((tag) => {
                  const tagValue = tag.id.toString();
                  const isSelected = selectedTagIds.includes(tagValue);

                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTagSelection(tagValue)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        isSelected
                          ? 'border-[#A795C9] bg-[#EDE4FF] text-[#5A4E84] dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100'
                          : 'border-[#D8BFD8]/60 text-slate-600 hover:bg-[#F3EEFF] dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Switch
                id="billable"
                checked={billable}
                onCheckedChange={setBillable}
                className="data-[state=checked]:bg-[#A795C9]"
              />
              <label htmlFor="billable" className="text-sm text-slate-600 dark:text-slate-300">
                Billable
              </label>
            </div>
            <div className="col-span-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Clock className="h-4 w-4 text-[#7C7AA6] dark:text-[#B0C4DE]" />
              <span>Duration: {duration || 'Not set'}</span>
            </div>

            <div className="col-span-2 rounded-xl border border-[#D8BFD8]/45 bg-[#F8F5FF]/80 p-3 dark:border-slate-700 dark:bg-slate-800/70">
              <button
                type="button"
                onClick={() => setShowAdvancedFields((previous) => !previous)}
                className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left"
              >
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-[#6B6697] dark:text-slate-200">
                    <Sparkles className="h-4 w-4" />
                    Advanced AI Context
                  </p>
                  <p className="mt-1 text-xs text-[#6B6697]/80 dark:text-slate-300">
                    {showAdvancedFields
                      ? 'Hide detailed fields'
                      : 'Expand to add goals, focus, energy, blockers, and detailed notes'}
                  </p>
                </div>
                {showAdvancedFields ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showAdvancedFields && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Linked Goal</label>
                  <Select
                    value={linkedGoal || ''}
                    onValueChange={(value) => setLinkedGoal(value === 'none' ? null : value)}
                  >
                    <SelectTrigger className="mt-1 rounded-xl border-[#D8BFD8]/50 bg-white/95 text-slate-900 shadow-sm focus:border-[#A795C9] focus:ring-[#A795C9] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                      <SelectValue placeholder="Select a goal" />
                    </SelectTrigger>
                    <SelectContent className="radix-select-content z-50 border-[#D8BFD8]/50 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                      <SelectItem value="none">No linked goal</SelectItem>
                      {goalOptions.map((goal) => (
                        <SelectItem key={goal} value={goal}>
                          {goal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Focus (1-10)</label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={focusScore}
                    onChange={(event) => setFocusScore(event.target.value)}
                    className="mt-1 rounded-xl border-[#D8BFD8]/50 bg-white/95 text-slate-900 shadow-sm focus:border-[#A795C9] focus:ring-[#A795C9] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Energy (1-10)</label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={energyScore}
                    onChange={(event) => setEnergyScore(event.target.value)}
                    className="mt-1 rounded-xl border-[#D8BFD8]/50 bg-white/95 text-slate-900 shadow-sm focus:border-[#A795C9] focus:ring-[#A795C9] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Blockers</label>
                  <Input
                    value={blockers}
                    onChange={(event) => setBlockers(event.target.value)}
                    placeholder="Context switch, dependency, distraction..."
                    className="mt-1 rounded-xl border-[#D8BFD8]/50 bg-white/95 text-slate-900 shadow-sm focus:border-[#A795C9] focus:ring-[#A795C9] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Context Notes</label>
                  <textarea
                    value={contextNotes}
                    onChange={(event) => setContextNotes(event.target.value)}
                    placeholder="What made this session productive or difficult?"
                    className="mt-1 min-h-[88px] w-full rounded-xl border border-[#D8BFD8]/50 bg-white/95 p-2 text-sm text-slate-800 focus:border-[#A795C9] focus:outline-none focus:ring-1 focus:ring-[#A795C9] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Detailed AI Notes</label>
                  <textarea
                    value={aiDetail}
                    onChange={(event) => setAiDetail(event.target.value)}
                    placeholder="Add rich details that should be included in AI memory and embeddings"
                    className="mt-1 min-h-[112px] w-full rounded-xl border border-[#D8BFD8]/50 bg-white/95 p-2 text-sm text-slate-800 focus:border-[#A795C9] focus:outline-none focus:ring-1 focus:ring-[#A795C9] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 mt-4 flex flex-col-reverse gap-2 border-t border-[#D8BFD8]/40 bg-white/90 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:flex-row sm:justify-end dark:border-slate-700 dark:bg-slate-900/88">
            {initialEntry && onDelete && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={loading || isDeleting}
                className="w-full rounded-xl border-rose-200 px-4 py-2 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-200 dark:hover:bg-rose-900/30 sm:mr-auto sm:w-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete Entry'}
              </Button>
            )}
            {initialEntry && onContinue && (
              <Button
                variant="outline"
                onClick={handleContinue}
                disabled={loading || isContinuing}
                className="w-full rounded-xl border-emerald-200 px-4 py-2 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/30 sm:w-auto"
              >
                <Clock className="mr-2 h-4 w-4" />
                {isContinuing ? 'Continuing...' : 'Continue As Timer'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full rounded-xl border-[#D8BFD8]/50 px-4 py-2 text-slate-700 hover:bg-[#F3EEFF] dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 sm:w-auto"
            >
              Cancel
            </Button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={loading ? { opacity: 0.7 } : { opacity: 1 }}
            >
              <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#D8BFD8] to-[#B0C4DE] px-5 py-2 text-slate-900 shadow-sm transition-all duration-200 hover:from-[#CFAEE4] hover:to-[#9DB7D8] hover:shadow-md dark:from-slate-700 dark:to-slate-600 dark:text-slate-100 sm:w-auto"
              >
                {loading ? 'Saving...' : initialEntry ? 'Save Changes' : 'Save'}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}