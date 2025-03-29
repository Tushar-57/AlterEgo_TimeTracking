import React, { useState } from 'react';
import { useTaskStore } from '../store/taskStore';
import { 
  Plus, 
  CheckSquare, 
  Clock, 
  Tag, 
  User,
  Calendar as CalendarIcon,
  AlertCircle,
  MoreVertical,
  Filter
} from 'lucide-react';
import type { TaskPriority, TaskStatus } from '../store/taskStore';

const priorityColors = {
  low: 'bg-blue-50 text-blue-700',
  medium: 'bg-yellow-50 text-yellow-700',
  high: 'bg-red-50 text-red-700'
};

const statusColors = {
  'todo': 'bg-gray-50 text-gray-700',
  'in-progress': 'bg-purple-50 text-purple-700',
  'completed': 'bg-green-50 text-green-700'
};

const TaskManager = () => {
  const { tasks, addTask, updateTask, deleteTask, updateTaskStatus } = useTaskStore();
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    status: 'todo' as TaskStatus,
    tags: [] as string[],
    estimatedDuration: 0,
    timeSpent: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTask({
      id: crypto.randomUUID(),
      ...newTask
    });
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      tags: [],
      estimatedDuration: 0,
      timeSpent: 0
    });
    setShowNewTaskForm(false);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-light mb-1">Task Manager</h1>
            <p className="text-gray-500">{tasks.length} tasks total</p>
          </div>
          <button
            onClick={() => setShowNewTaskForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Task</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 mb-6 flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter by:</span>
          </div>
          <select className="px-3 py-1.5 rounded-lg bg-gray-50 text-sm border-0">
            <option>All Statuses</option>
            <option>Todo</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
          <select className="px-3 py-1.5 rounded-lg bg-gray-50 text-sm border-0">
            <option>All Priorities</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>

        {/* Task List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 text-sm font-medium text-gray-500">
            <div className="col-span-5">Task</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-2">Time</div>
            <div className="col-span-1"></div>
          </div>
          
          {tasks.map(task => (
            <div key={task.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors">
              <div className="col-span-5">
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                )}
                {task.tags.length > 0 && (
                  <div className="flex items-center space-x-2 mt-2">
                    {task.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                  {task.status}
                </span>
              </div>
              <div className="col-span-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
              <div className="col-span-2 text-sm text-gray-500">
                {formatDuration(task.timeSpent)} / {formatDuration(task.estimatedDuration)}
              </div>
              <div className="col-span-1 text-right">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* New Task Modal */}
        {showNewTaskForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg">
              <h2 className="text-xl font-medium mb-4">New Task</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border-0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border-0"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={e => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                      className="w-full px-3 py-2 rounded-lg bg-gray-50 border-0"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={newTask.estimatedDuration}
                      onChange={e => setNewTask({ ...newTask, estimatedDuration: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-gray-50 border-0"
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewTaskForm(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;