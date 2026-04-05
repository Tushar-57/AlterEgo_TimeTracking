import { Project } from "./types";

export const formatTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(safeSeconds / 3600);
  const m = Math.floor((safeSeconds % 3600) / 60);
  const s = safeSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  export const getRandomColor = () => {
    const colors = [
      '#4f46e5', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', 
      '#10b981', '#3b82f6', '#6366f1',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  export const getProjectNameById = (
    id: string | number | null | undefined,
    projects: Project[]
  ) => {
    if (!id || id === 'noproject') {
      return 'No Project';
    }

    const numericId = typeof id === 'string' ? Number.parseInt(id, 10) : id;
    if (!Number.isFinite(numericId)) {
      return 'No Project';
    }

    const project = projects.find((p) => p.id === numericId);
    return project ? project.name : 'No Project';
  };
  // const getProjectNameById = (id: string | undefined, projects: Project[]) => {
  //   if (!id || id === 'noproject') return 'No Project';
  //   const project = projects.find(p => p.id === parseInt(id));
  //   return project ? project.name : 'No Project';
  // };
