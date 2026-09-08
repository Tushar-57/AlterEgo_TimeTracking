import { useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  FolderKanban,
  Palette,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../ui/page-header';

type Project = {
  id: number;
  name: string;
  color: string;
  client: string;
};

type ProjectFormState = {
  name: string;
  color: string;
  client: string;
};

const DEFAULT_COLOR = '#4f46e5';
const PROJECT_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#334155'];

const initialFormState: ProjectFormState = {
  name: '',
  color: DEFAULT_COLOR,
  client: '',
};

const ProjectPage = () => {
  const { isAuthenticated, token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [formState, setFormState] = useState<ProjectFormState>(initialFormState);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/projects/userProjects', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data: Project[] = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      void fetchProjects();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (editingProject) {
      setFormState({
        name: editingProject.name,
        color: editingProject.color || DEFAULT_COLOR,
        client: editingProject.client || '',
      });
    } else {
      setFormState(initialFormState);
    }
  }, [editingProject]);

  const clientOptions = useMemo(() => {
    return Array.from(new Set(projects.map((project) => project.client.trim()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        project.name.toLowerCase().includes(normalizedQuery) ||
        project.client.toLowerCase().includes(normalizedQuery);

      const matchesClient = clientFilter === 'all' || project.client === clientFilter;

      return matchesQuery && matchesClient;
    });
  }, [clientFilter, projects, searchQuery]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = formState.name.trim();
    if (!trimmedName) {
      return;
    }

    setSaving(true);
    try {
      const isEditing = editingProject !== null;
      const response = await fetch(isEditing ? `/api/projects/${editingProject.id}` : '/api/projects', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          color: formState.color,
          client: formState.client.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save project');
      }

      await fetchProjects();
      setEditingProject(null);
      setFormState(initialFormState);
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (id: number) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      await fetchProjects();
      if (editingProject?.id === id) {
        setEditingProject(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const totalClients = clientOptions.length;
  const activeColorCount = new Set(projects.map((project) => project.color || DEFAULT_COLOR)).size;

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          eyebrow="Manage"
          title="Projects"
          icon={FolderKanban}
          subtitle="Colour-code your focus areas and group client work so time logging stays fast."
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-3 inline-flex rounded-lg bg-muted p-2 text-foreground">
              <FolderKanban className="h-4 w-4" />
            </div>
            <p className="text-2xl font-semibold text-foreground">{projects.length}</p>
            <p className="text-sm text-muted-foreground">Total projects</p>
          </article>

          <article className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-3 inline-flex rounded-lg bg-muted p-2 text-foreground">
              <BriefcaseBusiness className="h-4 w-4" />
            </div>
            <p className="text-2xl font-semibold text-foreground">{totalClients}</p>
            <p className="text-sm text-muted-foreground">Client accounts</p>
          </article>

          <article className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-3 inline-flex rounded-lg bg-muted p-2 text-foreground">
              <Palette className="h-4 w-4" />
            </div>
            <p className="text-2xl font-semibold text-foreground">{activeColorCount}</p>
            <p className="text-sm text-muted-foreground">Unique color tracks</p>
          </article>

          <article className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-3 inline-flex rounded-lg bg-muted p-2 text-foreground">
              <Search className="h-4 w-4" />
            </div>
            <p className="text-2xl font-semibold text-foreground">{filteredProjects.length}</p>
            <p className="text-sm text-muted-foreground">Filtered results</p>
          </article>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              {editingProject ? 'Edit Project' : 'Create Project'}
            </h2>
            {editingProject && (
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition hover:bg-accent"
              >
                <X className="h-4 w-4" />
                Cancel editing
              </button>
            )}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">Project name</span>
                <input
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  required
                  placeholder="Launch prep sprint"
                  className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-foreground focus:border-ring focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">Client</span>
                <input
                  value={formState.client}
                  onChange={(event) => setFormState((prev) => ({ ...prev, client: event.target.value }))}
                  placeholder="Acme Labs"
                  className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-foreground focus:border-ring focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">Custom color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formState.color}
                    onChange={(event) => setFormState((prev) => ({ ...prev, color: event.target.value }))}
                    aria-label="Pick a custom colour"
                    className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-input bg-background p-1"
                  />
                  <span className="font-mono text-xs uppercase text-muted-foreground">{formState.color}</span>
                </div>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Select color ${color}`}
                  onClick={() => setFormState((prev) => ({ ...prev, color }))}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    formState.color.toLowerCase() === color.toLowerCase() ? 'border-primary scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingProject ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {saving ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <label className="relative text-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by project or client"
                className="w-full rounded-xl border border-border bg-muted py-2.5 pl-10 pr-3 text-foreground focus:border-ring focus:outline-none"
              />
            </label>

            <select
              value={clientFilter}
              onChange={(event) => setClientFilter(event.target.value)}
              className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-foreground focus:border-ring focus:outline-none"
            >
              <option value="all">All clients</option>
              {clientOptions.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-input bg-muted px-4 py-10 text-center text-sm text-muted-foreground">
              No projects match your filters yet. Create one above to get started.
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-xl border border-border md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/70 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Project</th>
                      <th className="px-4 py-3 font-medium">Client</th>
                      <th className="px-4 py-3 font-medium">Color</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="border-t border-border bg-card">
                        <td className="px-4 py-3 font-medium text-foreground">{project.name}</td>
                        <td className="px-4 py-3 text-foreground">{project.client || '-'}</td>
                        <td className="px-4 py-3">
                          <div
                            className="h-6 w-6 rounded-full border border-input"
                            style={{ backgroundColor: project.color || DEFAULT_COLOR }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingProject(project)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted"
                              aria-label={`Edit project ${project.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProject(project.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-destructive text-destructive transition hover:bg-destructive hover:text-destructive-foreground"
                              aria-label={`Delete project ${project.name}`}
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
                {filteredProjects.map((project) => (
                  <article key={project.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">{project.client || 'No client assigned'}</p>
                      </div>
                      <div
                        className="h-7 w-7 rounded-full border border-input"
                        style={{ backgroundColor: project.color || DEFAULT_COLOR }}
                      />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingProject(project)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProject(project.id)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-destructive px-3 py-2 text-sm text-destructive"
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

export default ProjectPage;
