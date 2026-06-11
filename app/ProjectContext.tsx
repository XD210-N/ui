"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useStrings } from "@/lib/strings-context";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Project {
  project_id: string;
  name: string;
  user_id: string;
  created_at: string;
  last_opened_at: string | null;
}

interface ProjectContextValue {
  projects: Project[];
  activeProject: Project | null;
  loading: boolean;
  openProject: (projectId: string) => Promise<void>;
  createProject: (name: string) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  requestCreateDialog: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectContext must be used inside ProjectProvider");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    const res = await fetch(`/v1/projects`);
    const data = await res.json();
    return (data.projects ?? []) as Project[];
  }, []);

  const refreshProjects = useCallback(async () => {
    const ps = await fetchProjects();
    setProjects(ps);
  }, [fetchProjects]);

  const openProject = useCallback(async (projectId: string) => {
    const res = await fetch(`/v1/projects/${projectId}/open`, {
      method: "POST",
    });
    const p = (await res.json()) as Project;
    setActiveProject(p);
    setProjects((prev) => [p, ...prev.filter((x) => x.project_id !== projectId)]);
    setDialogOpen(false);
  }, []);

  const createProject = useCallback(
    async (name: string) => {
      const res = await fetch(`/v1/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(data.detail ?? "Failed to create project.");
      }
      const p = (await res.json()) as Project;
      await openProject(p.project_id);
      return p;
    },
    [openProject],
  );

  const requestCreateDialog = useCallback(() => setDialogOpen(true), []);

  const deleteProject = useCallback(
    async (projectId: string) => {
      const res = await fetch(`/v1/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project.");

      const wasActive = activeProject?.project_id === projectId;
      const remaining = projects.filter((p) => p.project_id !== projectId);
      setProjects(remaining);

      if (wasActive) {
        if (remaining.length > 0) {
          await openProject(remaining[0]!.project_id);
        } else {
          setActiveProject(null);
        }
      }
    },
    [activeProject, projects, openProject],
  );

  // On mount: fetch projects and auto-open the most recently used one
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ps = await fetchProjects();
        if (cancelled) return;
        setProjects(ps);
        if (ps.length > 0) {
          await openProject(ps[0]!.project_id);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showDialog = !loading && (!activeProject || dialogOpen);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        loading,
        openProject,
        createProject,
        deleteProject,
        refreshProjects,
        requestCreateDialog,
      }}
    >
      {children}
      {showDialog && (
        <CreateProjectDialog
          canCancel={!!activeProject}
          onCancel={() => setDialogOpen(false)}
        />
      )}
    </ProjectContext.Provider>
  );
}

// ── Gate ──────────────────────────────────────────────────────────────────────

/** Renders children only when a project is active. Shows a loading screen or
 *  nothing (dialog overlay takes over) otherwise. */
export function ProjectGate({ children }: { children: ReactNode }) {
  const { activeProject, loading } = useProjectContext();
  const s = useStrings();

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center text-sm text-zinc-400">
        {s.loading}
      </div>
    );
  }

  if (!activeProject) {
    // CreateProjectDialog is rendered as a full-screen overlay by ProjectProvider
    return null;
  }

  return <>{children}</>;
}

// ── Create Project Dialog ─────────────────────────────────────────────────────

/** Returns an error message if *name* cannot be used as a folder name on Linux. */
function validateNameLocally(
  name: string,
  msgs: {
    empty: string;
    reserved: string;
    invalidChars: string;
    tooLong: string;
  },
): string | null {
  if (!name) return msgs.empty;
  if (name === "." || name === "..") return msgs.reserved;
  // eslint-disable-next-line no-control-regex
  if (/[\/\x00-\x1f\x7f]/.test(name)) return msgs.invalidChars;
  if (new TextEncoder().encode(name).length > 255) return msgs.tooLong;
  return null;
}

function CreateProjectDialog({
  canCancel,
  onCancel,
}: {
  canCancel: boolean;
  onCancel: () => void;
}) {
  const { createProject } = useProjectContext();
  const s = useStrings();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    // Clear error once the user starts editing
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const localErr = validateNameLocally(trimmed, {
      empty: s.validationEmpty,
      reserved: s.validationReserved,
      invalidChars: s.validationInvalidChars,
      tooLong: s.validationTooLong,
    });
    if (localErr) {
      setError(localErr);
      return;
    }
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await createProject(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : s.createFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-96 flex flex-col gap-4 shadow-2xl">
        <h2 className="font-semibold text-lg">
          {canCancel ? s.newProject : s.createFirstProject}
        </h2>
        {!canCancel && (
          <p className="text-sm text-zinc-400">
            {s.projectDescription}
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <input
              autoFocus
              className={`bg-white/5 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                error
                  ? "border-red-500/70 focus:ring-red-500/50"
                  : "border-white/10 focus:ring-white/20"
              }`}
              placeholder={s.projectNamePlaceholder}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
            {error && (
              <p className="text-xs text-red-400 px-1">{error}</p>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            {canCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm rounded-lg hover:bg-white/8 text-zinc-300"
              >
                {s.cancel}
              </button>
            )}
            <button
              type="submit"
              disabled={!name.trim() || busy}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg px-4 py-2 text-sm font-medium"
            >
              {busy ? s.creatingButton : s.createButton}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Project Switcher ──────────────────────────────────────────────────────────

/** Sidebar header showing the active project name with a dropdown to switch
 *  projects, create a new one, or delete a project. */
export function ProjectSwitcher() {
  const { projects, activeProject, openProject, requestCreateDialog, deleteProject } =
    useProjectContext();
  const s = useStrings();
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleConfirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteProject(pendingDelete.project_id);
      setPendingDelete(null);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  if (!activeProject) return null;

  const others = projects.filter((p) => p.project_id !== activeProject.project_id);

  return (
    <>
      <div className="px-2 pb-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {s.projectsLabel}
        </div>
      </div>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/5 transition-colors"
        >
          <span className="flex-1 truncate text-sm font-medium">
            {activeProject.name}
          </span>
          <svg
            className="h-3 w-3 flex-shrink-0 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-xl">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 border-b border-white/8">
              {s.projectsLabel}
            </div>
            {others.map((p) => (
              <div key={p.project_id} className="group flex items-center">
                <button
                  onClick={() => { openProject(p.project_id); setOpen(false); }}
                  className="flex-1 truncate px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors"
                >
                  {p.name}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setPendingDelete(p); setOpen(false); }}
                  title={s.deleteProjectTitle(p.name)}
                  className="px-2.5 py-2 text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
            {others.length > 0 && <div className="border-t border-white/8" />}
            <button
              onClick={() => { requestCreateDialog(); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-zinc-400 hover:bg-white/5 transition-colors"
            >
              {s.newProjectMenuItem}
            </button>
          </div>
        )}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-96 flex flex-col gap-4 shadow-2xl">
            <h2 className="font-semibold">{s.deleteProjectTitle(pendingDelete.name)}</h2>
            <p className="text-sm text-zinc-400">
              {s.deleteProjectDesc}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg hover:bg-white/8 text-zinc-300 disabled:opacity-40"
              >
                {s.cancel}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-40 rounded-lg px-4 py-2 text-sm font-medium"
              >
                {deleting ? s.deletingButton : s.deleteButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TrashIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
