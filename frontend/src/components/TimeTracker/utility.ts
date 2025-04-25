import { Project } from "./types";

export const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  export const getRandomColor = () => {
    const colors = [
      '#4f46e5', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', 
      '#10b981', '#3b82f6', '#6366f1',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  export const getProjectNameById = (id: number | undefined, projects: Project[]) => {
    if (!id) return 'No Project';
    const project = projects.find(p => p.id === id);
    return project ? project.name : 'No Project';
  };
  // const getProjectNameById = (id: string | undefined, projects: Project[]) => {
  //   if (!id || id === 'noproject') return 'No Project';
  //   const project = projects.find(p => p.id === parseInt(id));
  //   return project ? project.name : 'No Project';
  // };
