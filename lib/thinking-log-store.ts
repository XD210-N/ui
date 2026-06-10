/**
 * thinkingLogStore — module-level pub/sub store for the live agent thinking log.
 *
 * Framework-free so both the runtime hook (MyRuntimeProvider) and the
 * ThinkingIndicator component (thread.tsx) can access it without prop-drilling.
 */

let _log = "";
const _listeners = new Set<() => void>();

export function getThinkingLog(): string {
  return _log;
}

export function setThinkingLog(text: string) {
  _log = text;
  _listeners.forEach((l) => l());
}

export function clearThinkingLog() {
  _log = "";
  _listeners.forEach((l) => l());
}

export function subscribeThinkingLog(listener: () => void): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}
