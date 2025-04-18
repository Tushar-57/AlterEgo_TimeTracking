// ProjectPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Table } from '../ui/index';
import { Pencil, Trash2, Plus } from 'lucide-react';

type Project = {
  id: number;
  name: string;
  color: string;
  client: string;
};

const ProjectPage = () => {
  const { isAuthenticated } = useAuth();
  const COLORS = [
    '#4f46e5', '#10b981', '#ef4444', '#f59e0b', 
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
  ];
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState<Omit<Project, 'id'>>({
    name: '',
    color: '#4f46e5',
    client: ''
  });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      console.log(localStorage.getItem('jwtToken'))
      const res = await fetch('http://localhost:8080/api/projects', {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('jwtToken')}` 
        }
      });
      console.log(res.statusText)
  
      // if (res.status === 401) {
      //   localStorage.removeItem('jwtToken');
      //   window.location.href = '/login';
      //   return;
      // }
  
      if (!res.ok) throw new Error('Failed to fetch projects');
      
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProject 
        ? `http://localhost:8080/api/projects/${editingProject.id}`
        : 'http://localhost:8080/api/projects';
      
      const method = editingProject ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify(editingProject || newProject)
      });

      if (res.ok) {
        await fetchProjects();
        setNewProject({ name: '', color: '#4f46e5', client: '' });
        if (editingProject) setEditingProject(null);
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const deleteProject = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const res = await fetch(`http://localhost:8080/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      if (res.ok) await fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchProjects();
  }, [isAuthenticated]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Project Management</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Input
            label="Project Name"
            value={editingProject?.name || newProject.name}
            onChange={e => editingProject 
              ? setEditingProject({...editingProject, name: e.target.value})
              : setNewProject({...newProject, name: e.target.value})}
            required
          />
          
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Color</label>
            <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                <button
                    key={color}
                    type="button"
                    onClick={() => 
                    editingProject
                        ? setEditingProject({...editingProject, color})
                        : setNewProject({...newProject, color})
                    }
                    className={`w-8 h-8 rounded-full border-2 ${
                    (editingProject?.color === color || newProject.color === color) 
                        ? 'border-black' 
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                />
                ))}
                <label className="relative cursor-pointer">
                    <div 
                        className="w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center"
                        style={{ 
                        borderColor: editingProject?.color || newProject.color,
                        backgroundColor: (editingProject?.color === 'custom' || newProject.color === 'custom') 
                            ? 'transparent' 
                            : 'white'
                        }}
                    >
                        <Plus 
                        className="w-4 h-4" 
                        style={{ 
                            color: editingProject?.color || newProject.color 
                        }}
                        />
                    </div>
                    <input
                        type="color"
                        value={editingProject?.color || newProject.color}
                        onChange={(e) => {
                        const color = e.target.value;
                        if (editingProject) {
                            setEditingProject({...editingProject, color});
                        } else {
                            setNewProject({...newProject, color});
                        }
                        }}
                        className="absolute opacity-0 w-0 h-0"
                    />
                    </label>
                </div>
            </div>

          <Input
            label="Client"
            value={editingProject?.client || newProject.client}
            onChange={e => editingProject
              ? setEditingProject({...editingProject, client: e.target.value})
              : setNewProject({...newProject, client: e.target.value})}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            type="submit" 
            variant="primary"
            className="flex items-center gap-2"
          >
            {editingProject ? (
              <>
                <Pencil className="w-4 h-4" />
                Update Project
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Project
              </>
            )}
          </Button>
          {editingProject && (
            <Button 
              variant="ghost" 
              onClick={() => setEditingProject(null)}
              className="hover:bg-red-50 hover:text-red-600"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        </div>
        ) : (
            <Table className="bg-white rounded-lg shadow-md">
            <Table.Header>
                <Table.Row>
                <Table.Head>Name</Table.Head>
                <Table.Head>Color</Table.Head>
                <Table.Head>Client</Table.Head>
                <Table.Head>Actions</Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {projects.map((project) => (
                <Table.Row key={project.id} className="hover:bg-gray-50">
                    <Table.Cell className="font-medium">{project.name}</Table.Cell>
                    <Table.Cell>
                    <div 
                        className="w-6 h-6 rounded-full shadow-sm border"
                        style={{ backgroundColor: project.color || '#4f46e5' }}
                    />
                    </Table.Cell>
                    <Table.Cell>{project.client || '-'}</Table.Cell>
                    <Table.Cell>
                    <div className="flex gap-2">
                        <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setEditingProject(project)}
                        >
                        <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => deleteProject(project.id)}
                        >
                        <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                    </Table.Cell>
                </Table.Row>
                ))}
            </Table.Body>
            </Table>
        )}
    </div>
  );
};
export default ProjectPage;