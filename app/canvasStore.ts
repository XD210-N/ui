/**
 * canvasStore — module-level pub/sub store for artifact previews.
 *
 * Intentionally framework-free so that both the runtime hook (useLangGraphRuntime)
 * and the ArtifactCanvas component can access it without prop-drilling through
 * the provider tree.
 */

export interface CanvasState {
  requirements: string;
  appPlan: string;
  uploadImages: string[]; // data URLs of user-uploaded images
  report: string; // markdown report.md from agent-requirement
  runId: string; // current run_id (available before completion for image URLs)
  runComplete: boolean; // true after the backend emits the final done event
  screenPngs: string[]; // list of PNG filenames from screens dir
  lapSystemDir: string; // path to the work dir (e.g. Agent-Build/app_<run_id>)
}

let _state: CanvasState = {
  requirements: "",
  appPlan: "",
  uploadImages: [],
  report: "",
  runId: "",
  runComplete: false,
  screenPngs: [],
  lapSystemDir: "",
};
const _listeners = new Set<() => void>();

export function getCanvasState(): CanvasState {
  return _state;
}

export function updateCanvas(patch: Partial<CanvasState>) {
  _state = { ..._state, ...patch };
  _listeners.forEach((l) => {
    l();
  });
}

export function clearCanvas() {
  _state = {
    requirements: "",
    appPlan: "",
    uploadImages: [],
    report: "",
    runId: "",
    runComplete: false,
    screenPngs: [],
    lapSystemDir: "",
  };
  _listeners.forEach((l) => {
    l();
  });
}

export function subscribeCanvas(listener: () => void): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}
