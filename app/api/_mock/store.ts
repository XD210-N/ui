/**
 * In-memory mock store for the UI preview mock backend.
 * State lives in the Next.js server process — resets on server restart.
 */

export interface Project {
  project_id: string;
  name: string;
  user_id: string;
  created_at: string;
  last_opened_at: string | null;
}

export interface Thread {
  remoteId: string;
  projectId: string;
  status: "regular" | "archived";
  title: string;
  createdAt: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: Array<{ type: string; text: string }>;
}

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function now() {
  return new Date().toISOString();
}

// ── State ──────────────────────────────────────────────────────────────────────

const projects = new Map<string, Project>();
const threads = new Map<string, Thread>();
const messages = new Map<string, Message[]>(); // keyed by lgThreadId

// Seed one default project so the UI loads immediately without a create dialog
const _seedProject: Project = {
  project_id: "demo-project",
  name: "Demo Project",
  user_id: "demo-user",
  created_at: now(),
  last_opened_at: now(),
};
projects.set(_seedProject.project_id, _seedProject);

// ── Projects ───────────────────────────────────────────────────────────────────

export function listProjects(): Project[] {
  return [...projects.values()].sort(
    (a, b) =>
      new Date(b.last_opened_at ?? b.created_at).getTime() -
      new Date(a.last_opened_at ?? a.created_at).getTime(),
  );
}

export function createProject(name: string): Project {
  const p: Project = {
    project_id: uuid(),
    name,
    user_id: "demo-user",
    created_at: now(),
    last_opened_at: null,
  };
  projects.set(p.project_id, p);
  return p;
}

export function openProject(projectId: string): Project | null {
  const p = projects.get(projectId);
  if (!p) return null;
  p.last_opened_at = now();
  return p;
}

export function deleteProject(projectId: string): boolean {
  return projects.delete(projectId);
}

// ── Threads ────────────────────────────────────────────────────────────────────

export function listThreads(projectId: string): Thread[] {
  return [...threads.values()].filter((t) => t.projectId === projectId);
}

export function getThread(remoteId: string): Thread | null {
  return threads.get(remoteId) ?? null;
}

export function createThread(remoteId: string, projectId: string): Thread {
  const t: Thread = {
    remoteId,
    projectId,
    status: "regular",
    title: "New Thread",
    createdAt: now(),
  };
  threads.set(remoteId, t);
  return t;
}

export function patchThread(
  remoteId: string,
  patch: Partial<Pick<Thread, "title" | "status">>,
): Thread | null {
  const t = threads.get(remoteId);
  if (!t) return null;
  if (patch.title !== undefined) t.title = patch.title;
  if (patch.status !== undefined) t.status = patch.status;
  return t;
}

export function deleteThread(remoteId: string): boolean {
  return threads.delete(remoteId);
}

// ── Messages ───────────────────────────────────────────────────────────────────

export function getMessages(lgThreadId: string): Message[] {
  return messages.get(lgThreadId) ?? [];
}

export function appendMessages(lgThreadId: string, msgs: Message[]) {
  const existing = messages.get(lgThreadId) ?? [];
  messages.set(lgThreadId, [...existing, ...msgs]);
}
