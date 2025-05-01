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
//         const token = localStorage.getItem('jwtToken');
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
//       const token = localStorage.getItem('jwtToken');
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
//         // localStorage.removeItem('jwtToken');
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
import { X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '../../../../components/ui/switch';
import { calculatePosition } from '../../../../../Dashboard';
// import { Label } from '../../../../components/ui/label';

interface TaskPopupProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStartTime?: Date;
  onSave: () => Promise<void>;
}

interface Project {
  id: number;
  name: string;
}

interface Tag {
  id: number;
  name: string;
}

export function TaskPopup({ isOpen, onClose, defaultStartTime, onSave }: TaskPopupProps) {
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [tagId, setTagId] = useState<string | null>(null);
  const [billable, setBillable] = useState(false);
  const [duration, setDuration] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const popupRef = useRef<HTMLDivElement>(null);

  // Initialize default start and end times
  useEffect(() => {
    if (defaultStartTime) {
      const start = defaultStartTime;
      const end = new Date(defaultStartTime);
      end.setHours(end.getHours() + 1);
      setStartTime(
        `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
      );
      setEndTime(
        `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`
      );
    }
  }, [defaultStartTime]);

  // Fetch projects and tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        console.log('JWT Token:', token); // Debug token
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

        // Fetch projects
        const projectsRes = await fetch('http://localhost:8080/api/projects/userProjects', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (projectsRes.status === 401) {
          throw new Error('Unauthorized');
        }
        const projectsData = await projectsRes.json();
        setProjects(Array.isArray(projectsData) ? projectsData : []);

        // Fetch tags
        const tagsRes = await fetch('http://localhost:8080/api/tags', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (tagsRes.status === 401) {
          throw new Error('Unauthorized');
        }
        const tagsData = await tagsRes.json();
        setTags(Array.isArray(tagsData) ? tagsData : []);
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

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, toast]);

  // Calculate duration
  useEffect(() => {
    if (startTime && endTime) {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      const start = new Date();
      start.setHours(startHours, startMinutes);
      const end = new Date();
      end.setHours(endHours, endMinutes);
      const diffMs = end.getTime() - start.getTime();
      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setDuration(`${hours}h ${minutes}m`);
      } else {
        setDuration('');
      }
    } else {
      setDuration('');
    }
  }, [startTime, endTime]);

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

  const handleSave = async () => {
    if (!description || !startTime || !endTime) {
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
      const token = localStorage.getItem('jwtToken');
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

      // Construct start and end times as ISO strings
      const startDate = new Date(defaultStartTime || Date.now());
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  startDate.setHours(startHours, startMinutes, 0, 0);
  const endDate = new Date(startDate);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  endDate.setHours(endHours, endMinutes, 0, 0);

  const duration = (endDate.getTime() - startDate.getTime()) / 1000;
  const { top, left } = calculatePosition(startDate.toISOString(), duration);

  const payload = {
    description,
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
    projectId: projectId ? parseInt(projectId) : null,
    tagIds: tagId ? [parseInt(tagId)] : [],
    billable,
  };

  const response = await fetch("http://localhost:8080/api/timers/addTimer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  console.log("Time entry response:", data);
  if (!data.success) {
    throw new Error(data.message || "Failed to save time entry");
  }

  // Update position
  const positionResponse = await fetch(`http://localhost:8080/api/timers/${data.data.id}/position`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      positionTop: top,
      positionLeft: left,
    }),
  });

  if (!positionResponse.ok) {
    console.warn("Failed to update position:", await positionResponse.text());
  }

      if (!data.success) {
        throw new Error(data.message || 'Failed to save time entry');
      }

      toast({
        title: 'Task Saved',
        description: 'Your task has been saved successfully.',
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <motion.div
          ref={popupRef}
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-white dark:bg-gray-900 rounded-xl p-6 w-[600px] shadow-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-900"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Add Task</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
            >
              <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Description
              </label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                className="mt-1 h-12 text-base bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:shadow-sm"
              />
            </div>
            <div>
              
              <label htmlFor="startTime" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Start Time
              </label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="endTime" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                End Time
              </label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="project" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Project
              </label>
              <Select
                value={projectId || ''}
                onValueChange={(value) => {
                  console.log('Project:', value);
                  setProjectId(value === '0' ? null : value);
                }}
              >
                <SelectTrigger className="mt-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 z-10">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 radix-select-content">
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
              <label htmlFor="tag" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Tag
              </label>
              <Select
                value={tagId || ''}
                onValueChange={(value) => {
                  console.log('Tag:', value);
                  setTagId(value === '0' ? null : value);
                }}
              >
                <SelectTrigger className="mt-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 z-10">
                  <SelectValue placeholder="Select tag" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 radix-select-content">
                  <SelectItem value="0">No tag</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id.toString()}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Switch
                id="billable"
                checked={billable}
                onCheckedChange={setBillable}
                className="data-[state=checked]:bg-indigo-600"
              />
              <label htmlFor="billable" className="text-sm text-gray-600 dark:text-gray-300">
                Billable
              </label>
            </div>
            <div className="col-span-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Clock className="h-4 w-4 text-indigo-500" />
              <span>Duration: {duration || 'Not set'}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-4 py-1"
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
                className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg px-4 py-1 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}