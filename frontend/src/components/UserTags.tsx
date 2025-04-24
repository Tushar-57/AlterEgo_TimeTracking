// ProjectPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Table } from '../components/ui';
import { Pencil, Trash2, Plus } from 'lucide-react';

type Tags = {
  id: number;
  name: string;
  color: string;
};

export const UserTagPage = () => {
  const { isAuthenticated } = useAuth();
  const COLORS = [
    '#4f46e5', '#10b981', '#ef4444', '#f59e0b', 
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
  ];
  const [tags, setTags] = useState<Tags[]>([]);
  const [newTags, setNewTags] = useState<Omit<Tags, 'id'>>({
    name: '',
    color: '#4f46e5',
  });
  const [editingTags, setEditingTags] = useState<Tags | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTags = async () => {
    setLoading(true);
    try {
      console.log(localStorage.getItem('jwtToken'))
      const res = await fetch('http://localhost:8080/api/tags', {
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
  
      if (!res.ok) throw new Error('Failed to fetch tags');
      
      const data = await res.json();
      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTags 
        ? `http://localhost:8080/api/tags/${editingTags.id}`
        : 'http://localhost:8080/api/tags';
      
      const method = editingTags ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify(editingTags || newTags)
      });

      if (res.ok) {
        await fetchTags();
        setNewTags({ name: '', color: '#4f46e5'});
        if (editingTags) setEditingTags(null);
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const deleteProject = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this Tag?')) return;
    
    try {
      const res = await fetch(`http://localhost:8080/api/tags/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      if (res.ok) await fetchTags();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchTags();
  }, [isAuthenticated]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Tags Management 🏷️</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Input
            label="Tag Name"
            value={editingTags?.name || newTags.name}
            onChange={e => editingTags 
              ? setEditingTags({...editingTags, name: e.target.value})
              : setNewTags({...newTags, name: e.target.value})}
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
                    editingTags
                        ? setEditingTags({...editingTags, color})
                        : setNewTags({...newTags, color})
                    }
                    className={`w-8 h-8 rounded-full border-2 ${
                    (editingTags?.color === color || newTags.color === color) 
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
                        borderColor: editingTags?.color || newTags.color,
                        backgroundColor: (editingTags?.color === 'custom' || newTags.color === 'custom') 
                            ? 'transparent' 
                            : 'white'
                        }}
                    >
                        <Plus 
                        className="w-4 h-4" 
                        style={{ 
                            color: editingTags?.color || newTags.color 
                        }}
                        />
                    </div>
                    <input
                        type="color"
                        value={editingTags?.color || newTags.color}
                        onChange={(e) => {
                        const color = e.target.value;
                        if (editingTags) {
                            setEditingTags({...editingTags, color});
                        } else {
                            setNewTags({...newTags, color});
                        }
                        }}
                        className="absolute opacity-0 w-0 h-0"
                    />
                    </label>
                </div>
            </div>
        </div>
        <div className="flex gap-2">
          <Button 
            type="submit" 
            variant="primary"
            className="flex items-center gap-2"
          >
            {editingTags ? (
              <>
                <Pencil className="w-4 h-4" />
                Update Tag
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Tag
              </>
            )}
          </Button>
          {editingTags && (
            <Button 
              variant="ghost" 
              onClick={() => setEditingTags(null)}
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
                <Table.Head>Actions</Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {tags.map((project) => (
                <Table.Row key={project.id} className="hover:bg-gray-50">
                    <Table.Cell className="font-medium">{project.name}</Table.Cell>
                    <Table.Cell>
                    <div 
                        className="w-6 h-6 rounded-full shadow-sm border"
                        style={{ backgroundColor: project.color || '#4f46e5' }}
                    />
                    </Table.Cell>
                    <Table.Cell>
                    <div className="flex gap-2">
                        <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setEditingTags(project)}
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
