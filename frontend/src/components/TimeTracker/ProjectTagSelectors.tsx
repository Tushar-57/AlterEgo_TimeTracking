import { useRef, useState } from 'react';
import { Button } from '../Calendar_updated/components/ui/button';
import { Input } from '../Calendar_updated/components/ui/input';
import { motion } from 'framer-motion';
import { X, ChevronDown, Briefcase, TagsIcon, DollarSign } from 'lucide-react';
import { Project, Tag, CurrentTask } from './types';
import { useClickOutside } from '../../utils/useClickOutside';
import { Switch } from '../Calendar_updated/components/ui/switch';
import { getProjectNameById, getRandomColor } from './utility';

export const ProjectTagSelectors = ({
  projects,
  tags,
  currentTask,
  setCurrentTask,
  handleAddTag,
  handleSelectTag,
  timerState,
}: {
  projects: Project[];
  tags: Tag[];
  currentTask: CurrentTask;
  setCurrentTask: (task: CurrentTask | ((prev: CurrentTask) => CurrentTask)) => void;
  handleAddTag: () => void;
  handleSelectTag: (tag: Tag) => void;
  timerState: { status: 'stopped' | 'running' | 'paused' };
}) => {
  const [showProjectSelect, setShowProjectSelect] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);

  const projectRef = useClickOutside(() => setShowProjectSelect(false));
  const tagRef = useClickOutside(() => setShowTagInput(false));
  const tagInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowProjectSelect(!showProjectSelect);
          }}
          disabled={timerState.status === 'running'}
          className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F4] dark:bg-[#3A3A3A] border-[#F8C8DC]/50 text-[#A3BFFA] hover:bg-[#F8C8DC]/20 transition-colors"
        >
          <Briefcase className="h-4 w-4" />
          {getProjectNameById(currentTask.projectId, projects)}
          <ChevronDown className="h-4 w-4" />
        </Button>
        {showProjectSelect && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 mt-1 w-56 rounded-md bg-[#FAF9F6] dark:bg-[#2D2D2D] shadow-lg ring-1 ring-[#F8C8DC]/50 focus:outline-none"
            ref={projectRef}
          >
            <div className="py-1 max-h-60 overflow-auto">
              <button
                onClick={() => {
                  setCurrentTask((prev: CurrentTask) => ({ ...prev, projectId: 'noproject' }));
                  setShowProjectSelect(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm font-inter ${
                  currentTask.projectId === 'noproject'
                    ? 'bg-[#A8D5BA]/20 text-[#1A202C] dark:text-[#E2E8F0]'
                    : 'text-[#A3BFFA] hover:bg-[#F8C8DC]/20'
                }`}
              >
                No Project
              </button>
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setCurrentTask((prev: CurrentTask) => ({ ...prev, projectId: project.id.toString() }));
                    setShowProjectSelect(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm font-inter ${
                    currentTask.projectId === project.id.toString()
                      ? 'bg-[#A8D5BA]/20 text-[#1A202C] dark:text-[#E2E8F0]'
                      : 'text-[#A3BFFA] hover:bg-[#F8C8DC]/20'
                  }`}
                >
                  {project.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowTagInput(!showTagInput);
          }}
          disabled={timerState.status === 'running'}
          className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F4] dark:bg-[#3A3A3A] border-[#F8C8DC]/50 text-[#A3BFFA] hover:bg-[#F8C8DC]/20 transition-colors"
        >
          <TagsIcon className="h-4 w-4" />
          Tags
          <ChevronDown className="h-4 w-4" />
        </Button>
        {showTagInput && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 mt-1 w-64 rounded-md bg-[#FAF9F6] dark:bg-[#2D2D2D] shadow-lg ring-1 ring-[#F8C8DC]/50 focus:outline-none"
            ref={tagRef}
          >
            <div className="p-3">
              <div className="flex gap-2 mb-3">
                <Input
                  ref={tagInputRef}
                  placeholder="Add new tag"
                  value={currentTask.newTag}
                  onChange={(e) =>
                    setCurrentTask((prev: CurrentTask) => ({ ...prev, newTag: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 bg-[#F5F5F4] dark:bg-[#3A3A3A] border-[#F8C8DC]/50"
                />
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: getRandomColor() }} />
                <Button
                  size="sm"
                  onClick={handleAddTag}
                  className="px-4 bg-[#A8D5BA] text-white hover:bg-[#A8D5BA]/80"
                >
                  Add
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto py-1">
                {tags.map((tag: Tag) => (
                  <div
                    key={tag.id}
                    onClick={() => handleSelectTag(tag)}
                    className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-[#F8C8DC]/20 cursor-pointer"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: tag.color || '#ccc' }}
                      />
                      <span className="text-sm text-[#A3BFFA] font-inter">{tag.name}</span>
                    </div>
                  </div>
                ))}
                {tags.length === 0 && (
                  <div className="text-sm text-[#A3BFFA] text-center py-2 font-inter">
                    No tags yet. Create one above.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={currentTask.billable}
          onCheckedChange={(checked) =>
            setCurrentTask((prev: CurrentTask) => ({ ...prev, billable: checked }))
          }
          disabled={timerState.status === 'running'}
          className="data-[state=checked]:bg-[#A8D5BA]"
        />
        <DollarSign
          className={`h-4 w-4 ${currentTask.billable ? 'text-[#A8D5BA]' : 'text-[#A3BFFA]'}`}
        />
        <span className="text-sm text-[#A3BFFA] font-inter">Billable</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {currentTask.tags.map((tag: Tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-1 pl-1 pr-2 py-1 bg-[#F5F5F4] dark:bg-[#3A3A3A] rounded-md"
            style={{ backgroundColor: `${tag.color}20` }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
            <span className="text-[#A3BFFA] font-inter">{tag.name}</span>
            <button
              onClick={() =>
                setCurrentTask((prev: CurrentTask) => ({
                  ...prev,
                  tags: prev.tags.filter((t: Tag) => t.id !== tag.id),
                }))
              }
              disabled={timerState.status === 'running'}
              className="ml-1 text-[#A3BFFA] hover:text-[#FF6B6B]"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};