import { useEffect, useMemo, useState } from 'react';
import { Hash, Palette, Pencil, Plus, Search, Tag, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type UserTag = {
  id: number;
  name: string;
  color: string;
};

type TagFormState = {
  name: string;
  color: string;
};

const DEFAULT_COLOR = '#4f46e5';
const TAG_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#334155'];

const initialFormState: TagFormState = {
  name: '',
  color: DEFAULT_COLOR,
};

export const UserTagPage = () => {
  const { isAuthenticated } = useAuth();
  const [tags, setTags] = useState<UserTag[]>([]);
  const [formState, setFormState] = useState<TagFormState>(initialFormState);
  const [editingTag, setEditingTag] = useState<UserTag | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tags', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }

      const data: UserTag[] = await response.json();
      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      void fetchTags();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (editingTag) {
      setFormState({
        name: editingTag.name,
        color: editingTag.color || DEFAULT_COLOR,
      });
    } else {
      setFormState(initialFormState);
    }
  }, [editingTag]);

  const filteredTags = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery.length === 0) {
      return tags;
    }

    return tags.filter((tag) => tag.name.toLowerCase().includes(normalizedQuery));
  }, [searchQuery, tags]);

  const uniqueColorCount = useMemo(() => {
    return new Set(tags.map((tag) => tag.color || DEFAULT_COLOR)).size;
  }, [tags]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = formState.name.trim();
    if (!trimmedName) {
      return;
    }

    setSaving(true);
    try {
      const isEditing = editingTag !== null;
      const response = await fetch(isEditing ? `/api/tags/${editingTag.id}` : '/api/tags', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          color: formState.color,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save tag');
      }

      await fetchTags();
      setEditingTag(null);
      setFormState(initialFormState);
    } catch (error) {
      console.error('Error saving tag:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteTag = async (id: number) => {
    if (!window.confirm('Delete this tag? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete tag');
      }

      await fetchTags();
      if (editingTag?.id === id) {
        setEditingTag(null);
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-emerald-100 via-lime-50 to-teal-100 px-6 py-8 sm:px-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              <Tag className="h-3.5 w-3.5" />
              Tag Studio
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">Tags Management</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-700 sm:text-base">
              Build a clean tag taxonomy so entries can be searched, filtered, and summarized across your workflows.
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-2 text-slate-700">
              <Hash className="h-4 w-4" />
            </div>
            <p className="text-2xl font-semibold text-slate-900">{tags.length}</p>
            <p className="text-sm text-slate-600">Total tags</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-2 text-slate-700">
              <Palette className="h-4 w-4" />
            </div>
            <p className="text-2xl font-semibold text-slate-900">{uniqueColorCount}</p>
            <p className="text-sm text-slate-600">Color groups</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-2 text-slate-700">
              <Search className="h-4 w-4" />
            </div>
            <p className="text-2xl font-semibold text-slate-900">{filteredTags.length}</p>
            <p className="text-sm text-slate-600">Filtered tags</p>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-slate-900">{editingTag ? 'Edit Tag' : 'Create Tag'}</h2>
            {editingTag && (
              <button
                type="button"
                onClick={() => setEditingTag(null)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Cancel editing
              </button>
            )}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Tag name</span>
                <input
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  required
                  placeholder="Deep Work"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:border-emerald-300 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Custom color</span>
                <input
                  type="color"
                  value={formState.color}
                  onChange={(event) => setFormState((prev) => ({ ...prev, color: event.target.value }))}
                  className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-1"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormState((prev) => ({ ...prev, color }))}
                  aria-label={`Select color ${color}`}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    formState.color.toLowerCase() === color.toLowerCase() ? 'border-slate-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingTag ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {saving ? 'Saving...' : editingTag ? 'Update Tag' : 'Create Tag'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <label className="relative mb-4 block text-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tags"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-slate-900 focus:border-emerald-300 focus:outline-none"
            />
          </label>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
              No tags found. Create one above and use it while tracking time entries.
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/70 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Tag</th>
                      <th className="px-4 py-3 font-medium">Color</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTags.map((tag) => (
                      <tr key={tag.id} className="border-t border-slate-200 bg-white">
                        <td className="px-4 py-3 font-medium text-slate-900">{tag.name}</td>
                        <td className="px-4 py-3">
                          <div
                            className="h-6 w-6 rounded-full border border-slate-300"
                            style={{ backgroundColor: tag.color || DEFAULT_COLOR }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingTag(tag)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                              aria-label={`Edit tag ${tag.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTag(tag.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50"
                              aria-label={`Delete tag ${tag.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {filteredTags.map((tag) => (
                  <article key={tag.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{tag.name}</h3>
                      </div>
                      <div className="h-7 w-7 rounded-full border border-slate-300" style={{ backgroundColor: tag.color || DEFAULT_COLOR }} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingTag(tag)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTag(tag.id)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
