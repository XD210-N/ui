"use client";

/**
 * MyRuntimeProvider — useExternalStoreRuntime architecture.
 *
 * The frontend owns the presentation state (messages, isRunning) via
 * React useState.  This is the correct choice for OmniStack because:
 *
 *  1. The same state can be shared with a canvas/preview pane without
 *     event-emitter hacks — both panels read the same Zustand/useState source.
 *  2. We control the full network pipeline in onNew: auth headers, retry
 *     logic, abort, and any custom command wrapping happen here explicitly.
 *  3. LangGraph is the backend source of truth; we load history directly
 *     from its checkpoint endpoint rather than fighting data-stream sync.
 */

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AssistantRuntimeProvider,
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
  useExternalStoreRuntime,
  useRemoteThreadListRuntime,
  useThreadListItemRuntime,
  type AppendMessage,
  type ImageMessagePart,
  type RemoteThreadListAdapter,
  type TextMessagePart,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { createAssistantStream } from "assistant-stream";
import { clearCanvas, updateCanvas } from "./canvasStore";
import { getSelectedBoard } from "./boardStore";

const SAAS_URL = process.env.NEXT_PUBLIC_SAAS_URL ?? "http://localhost:8000";
const RELATIONSHIP_FILE_EXTENSIONS = new Set([
  ".md",
  ".markdown",
  ".txt",
  ".text",
  ".json",
  ".yaml",
  ".yml",
]);
const RELATIONSHIP_FILE_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "application/json",
  "application/yaml",
  "application/x-yaml",
  "text/yaml",
  "text/x-yaml",
]);

// Fallback for crypto.randomUUID (unavailable in insecure HTTP contexts)
const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

type UploadableAttachment = {
  name?: string | undefined;
  contentType?: string | undefined;
  file?: File | undefined;
};

const isRelationshipDescriptionAttachment = (
  attachment: unknown,
): attachment is UploadableAttachment & { file: File } => {
  const item = attachment as UploadableAttachment;
  if (!(item.file instanceof File)) return false;
  const name = item.name ?? item.file.name ?? "";
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : "";
  const contentType = (item.contentType || item.file.type || "").toLowerCase();
  return (
    RELATIONSHIP_FILE_EXTENSIONS.has(ext)
    || RELATIONSHIP_FILE_TYPES.has(contentType)
  );
};

// ── User context ──────────────────────────────────────────────────────────────

const UserIdContext = createContext<string | undefined>(undefined);

export function useUserId() {
  return useContext(UserIdContext);
}

// ── Thread list adapter ───────────────────────────────────────────────────────

function makeThreadListAdapter(userId: string | undefined, projectId: string): RemoteThreadListAdapter {
  return {
    async list({ after } = {}) {
      const p = new URLSearchParams();
      if (userId) p.set("userId", userId);
      p.set("projectId", projectId);
      if (after) p.set("after", after);
      const res = await fetch(`${SAAS_URL}/v1/threads?${p}`);
      const data = await res.json();
      return {
        threads: (data.threads ?? []).map(
          (t: { remoteId: string; status: string; title?: string }) => ({
            remoteId: t.remoteId,
            status: t.status,
            title: t.title,
          }),
        ),
        nextCursor: data.nextCursor ?? undefined,
      };
    },

    async initialize(localId) {
      const res = await fetch(`${SAAS_URL}/v1/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remoteId: localId, userId, name: "New Thread", projectId }),
      });
      const data = await res.json();
      return { remoteId: data.thread_id ?? data.remoteId, externalId: undefined };
    },

    async rename(remoteId, title) {
      await fetch(`${SAAS_URL}/v1/threads/${remoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
    },

    async archive(remoteId) {
      await fetch(`${SAAS_URL}/v1/threads/${remoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
    },

    async unarchive(remoteId) {
      await fetch(`${SAAS_URL}/v1/threads/${remoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "regular" }),
      });
    },

    async delete(remoteId) {
      await fetch(`${SAAS_URL}/v1/threads/${remoteId}`, { method: "DELETE" });
    },

    async fetch(remoteId) {
      const res = await fetch(`${SAAS_URL}/v1/threads/${remoteId}`);
      if (!res.ok) throw new Error("Thread not found");
      const t = await res.json();
      return {
        remoteId: t.remoteId ?? t.thread_id,
        status: t.status ?? "regular",
        title: t.title ?? t.name,
      };
    },

    generateTitle: async (remoteId, messages) => {
      return createAssistantStream(async (controller) => {
        const firstUser = messages.find((m) => m.role === "user");
        let title = "New Thread";
        if (firstUser) {
          const text = firstUser.content
            .filter((c): c is { type: "text"; text: string } => c.type === "text")
            .map((c) => c.text)
            .join(" ");
          title = text.slice(0, 50) + (text.length > 50 ? "..." : "");
        }
        controller.appendText(title);
        await fetch(`${SAAS_URL}/v1/threads/${remoteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
      });
    },
  };
}

// ── Error message helper ──────────────────────────────────────────────────────

/**
 * Convert raw backend error strings into user-friendly messages.
 * Preserves informative details while hiding internal paths/stack traces.
 */
function _friendlyError(raw: string): string {
  const msg = raw.replace(/^Error:\s*/i, "");
  if (/has no api_key|api_key.*not.*configured|no api.?key/i.test(msg)) {
    return "API key is not configured.";
  }
  if (/Invalid router config JSON/i.test(msg)) {
    return "routing_models.local.json contains invalid JSON. Please fix the configuration file.";
  }
  if (/thread.*not found/i.test(msg)) {
    return "Conversation thread not found. Please start a new thread.";
  }
  if (/Backend returned 5\d\d/.test(msg)) {
    return "The server encountered an error. Please try again.";
  }
  if (/Backend returned 404/.test(msg)) {
    return "Conversation not found. Please start a new thread.";
  }
  if (/Failed to fetch|NetworkError|fetch/i.test(msg)) {
    return "Could not reach the server. Make sure the backend is running.";
  }
  return msg || "An unexpected error occurred. Please try again.";
}

// ── Per-thread runtime hook (useExternalStoreRuntime) ─────────────────────────

function useLangGraphRuntime() {
  const userId = useUserId();
  const threadListItem = useThreadListItemRuntime({ optional: true });
  const remoteIdRef = useRef<string | undefined>(undefined);
  const threadListItemRef = useRef(threadListItem);
  threadListItemRef.current = threadListItem;
  const abortRef = useRef<AbortController | null>(null);
  const isProcessingRef = useRef(false);

  const [messages, setMessages] = useState<ThreadMessageLike[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // ── Load history when thread changes ──────────────────────────────────────
  useEffect(() => {
    if (!threadListItem) return;

    const handleThreadChange = async (remoteId: string | undefined) => {
      if (remoteId === remoteIdRef.current) return;

      // When transitioning from undefined → remoteId during initialization
      // triggered by onNew, don't clear the optimistic messages.
      if (!remoteIdRef.current && remoteId && isProcessingRef.current) {
        remoteIdRef.current = remoteId;
        return;
      }

      remoteIdRef.current = remoteId;

      // Cancel any in-flight request for the previous thread
      abortRef.current?.abort();
      abortRef.current = null;
      setIsRunning(false);
      setMessages([]);
      clearCanvas();

      if (!remoteId) return;

      // Load history from LangGraph checkpoint (backend is the source of truth)
      try {
        const lgThreadId = `${userId ?? "anonymous"}:${remoteId}`;
        const res = await fetch(
          `${SAAS_URL}/langgraph/threads/${encodeURIComponent(lgThreadId)}/messages`,
        );
        if (!res.ok) return;
        const data = await res.json();
        setMessages(
          (data.messages ?? []).map(
            (
              msg: {
                id: string;
                role: "user" | "assistant";
                content: Array<{ type: string; text: string }>;
              },
            ) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              createdAt: new Date(),
              ...(msg.role === "assistant"
                ? { status: { type: "complete" as const, reason: "unknown" as const } }
                : {}),
            }),
          ),
        );
      } catch {
        /* new thread — no history */
      }
    };

    handleThreadChange(threadListItem.getState().remoteId);
    return threadListItem.subscribe(() =>
      handleThreadChange(threadListItem.getState().remoteId),
    );
  }, [threadListItem, userId]);

  // ── onNew — called when the user sends a message ──────────────────────────
  const onNew = useCallback(
    async (appendMsg: AppendMessage) => {
      const userText = appendMsg.content
        .filter((c): c is { type: "text"; text: string } => c.type === "text")
        .map((c) => c.text)
        .join("");

      const userMsgId = generateUUID();
      const assistantMsgId = generateUUID();

      // Build user message content: text + any image parts from attachments.
      const userContentParts: (TextMessagePart | ImageMessagePart)[] = [];
      if (userText) userContentParts.push({ type: "text", text: userText });
      for (const a of appendMsg.attachments ?? []) {
        for (const c of a.content ?? []) {
          if (c.type === "image") userContentParts.push(c as ImageMessagePart);
        }
      }

      // Optimistically add user + in-progress assistant messages.
      // This must happen before the threadId check because the framework
      // triggers thread initialization when messages are first added.
      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: "user" as const,
          content: userContentParts.length > 0
            ? userContentParts
            : [{ type: "text" as const, text: userText }],
          createdAt: new Date(),
        },
        {
          id: assistantMsgId,
          role: "assistant" as const,
          content: [{ type: "text", text: "" }],
          createdAt: new Date(),
          status: { type: "running" as const },
          metadata: { custom: { thinkingLogs: [] as string[], thinkingText: "" } },
        },
      ]);
      setIsRunning(true);

      // Helper: mark assistant message as an error
      const showError = (message: string) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: [],
                  status: {
                    type: "incomplete" as const,
                    reason: "error" as const,
                    error: message,
                  },
                }
              : m,
          ),
        );
      };

      // Wait for the remoteId if the thread hasn't been initialized yet
      let threadId = remoteIdRef.current;
      if (!threadId) {
        const item = threadListItemRef.current;
        if (!item) {
          setIsRunning(false);
          isProcessingRef.current = false;
          showError("Could not initialize conversation thread.");
          return;
        }
        // Directly trigger thread initialization
        try {
          isProcessingRef.current = true;
          const { remoteId } = await item.initialize();
          threadId = remoteId;
          remoteIdRef.current = remoteId;
        } catch (err) {
          setIsRunning(false);
          isProcessingRef.current = false;
          showError(
            err instanceof Error ? err.message : "Failed to start conversation.",
          );
          return;
        }
      }

      // Sync the user's chosen target board onto the thread so the requirement
      // validator checks the requested resolution against THIS board (e.g. a
      // 480x480 request is valid once F1_SMART_PANEL_SPINOR is selected).
      try {
        await fetch(`${SAAS_URL}/v1/threads/${threadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_board: getSelectedBoard() }),
        });
      } catch { /* non-fatal: keep the thread's existing board */ }

      const abort = new AbortController();
      abortRef.current = abort;

      // Extract image parts from attachments populated by SimpleImageAttachmentAdapter.send().
      // The adapter stores converted data-URLs in attachment.content[], not in appendMsg.content.
      const imageParts = (appendMsg.attachments ?? []).flatMap((a) =>
        (a.content ?? [])
          .filter((c): c is { type: "image"; image: string } => c.type === "image")
          .map((c) => ({ ...c, filename: a.name })),
      );
      const relationshipFiles = (appendMsg.attachments ?? []).flatMap((a) => {
        if (!isRelationshipDescriptionAttachment(a)) return [];
        return [
          {
            file: a.file,
            filename: a.name ?? a.file.name,
          },
        ];
      });

      // Reset run-scoped canvas artifacts so a new run cannot reuse stale report/runId state.
      updateCanvas({
        requirements: "",
        appPlan: "",
        report: "",
        runId: "",
        runComplete: false,
        screenPngs: [],
        lapSystemDir: "",
        uploadImages: imageParts.map((p) => p.image),
      });

      try {
        let res: Response;
        if (imageParts.length > 0 || relationshipFiles.length > 0) {
          // Multipart: convert data-URL images and include relationship files.
          const form = new FormData();
          form.append("text", userText);
          form.append("threadId", threadId);
          form.append("userId", userId ?? "anonymous");
          for (const [i, imgPart] of imageParts.entries()) {
            const blob = await fetch(imgPart.image).then((r) => r.blob());
            const filename = imgPart.filename ?? `image_${i}.png`;
            form.append("images", blob, filename);
          }
          for (const item of relationshipFiles) {
            form.append("files", item.file, item.filename);
          }
          res = await fetch(`${SAAS_URL}/langgraph/multipart`, {
            method: "POST",
            signal: abort.signal,
            body: form,
          });
        } else {
          res = await fetch(`${SAAS_URL}/langgraph`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: abort.signal,
            body: JSON.stringify({ text: userText, threadId, userId }),
          });
        }

        if (!res.ok || !res.body) {          let detail = `Backend returned ${res.status}`;
          try {
            const body = await res.json();
            if (body?.detail) detail = String(body.detail);
          } catch {
            /* ignore parse errors */
          }
          showError(_friendlyError(detail));
          return;
        }

        // Parse the plain SSE stream.
        // Each line: "data: <json>\n\n"
        // Event types: text | state | done | error
        console.debug("[SSE] stream opened status=%d", res.status);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";
        let receivedDone = false;

        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const event = JSON.parse(line.slice(6)) as {
              type: string;
              agent?: string;
              content?: string;
              requirements?: string;
              app_plan?: string;
              report?: string;
              message?: string;
              run_id?: string;
              suggestions?: Array<{ title: string; label: string; prompt: string }>;
              screen_pngs?: string[];
              lap_system_dir?: string;
            };

            if (event.type === "text" && event.content) {
              accumulated += (accumulated ? "\n" : "") + event.content;
              console.debug("[SSE] text agent=%s content=%.80s", event.agent, event.content);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: [{ type: "text", text: accumulated }] }
                    : m,
                ),
              );
            } else if (event.type === "log") {
              console.debug("[SSE] log agent=%s content=%s", event.agent, event.content);
              if (event.content) {
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== assistantMsgId) return m;
                    const prev_logs = (m.metadata?.custom as Record<string, unknown> | undefined)?.thinkingLogs as string[] | undefined ?? [];
                    return { ...m, metadata: { custom: { ...(m.metadata?.custom as object), thinkingLogs: [...prev_logs, event.content] } } };
                  }),
                );
              }
            } else if (event.type === "thinking") {
              if (event.content) {
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== assistantMsgId) return m;
                    const prev_text = (m.metadata?.custom as Record<string, unknown> | undefined)?.thinkingText as string | undefined ?? "";
                    return { ...m, metadata: { custom: { ...(m.metadata?.custom as object), thinkingText: prev_text + event.content } } };
                  }),
                );
              }
            } else if (event.type === "state") {
              console.debug("[SSE] state requirements=%s app_plan=%s suggestions=%s", !!event.requirements, !!event.app_plan, !!event.suggestions);
              updateCanvas({
                ...(event.run_id ? { runId: event.run_id } : {}),
                ...(event.requirements ? { requirements: event.requirements } : {}),
                ...(event.app_plan ? { appPlan: event.app_plan } : {}),
                ...(event.report ? { report: event.report } : {}),
              });
              if (event.suggestions) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          metadata: {
                            custom: {
                              ...(m.metadata?.custom as object),
                              suggestions: event.suggestions,
                            },
                          },
                        }
                      : m,
                  ),
                );
              }
            } else if (event.type === "done") {
              console.debug("[SSE] done run_id=%s", event.run_id);
              updateCanvas({
                runComplete: true,
                ...(event.run_id ? { runId: event.run_id } : {}),
              });
              if (event.screen_pngs) updateCanvas({ screenPngs: event.screen_pngs });
              if (event.lap_system_dir) updateCanvas({ lapSystemDir: event.lap_system_dir });
              receivedDone = true;
              break outer;
            } else if (event.type === "error") {
              const rawMsg = event.message ?? "Unknown agent error";
              showError(_friendlyError(rawMsg));
              return;
            }
          }
        }

        if (!receivedDone) {
          // Stream closed without a terminal event — surface as an error.
          showError("The server closed the connection unexpectedly. Please try again.");
          return;
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  status: { type: "complete" as const, reason: "unknown" as const },
                }
              : m,
          ),
        );
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        const rawMsg = err instanceof Error ? err.message : String(err);
        showError(_friendlyError(rawMsg));
      } finally {
        setIsRunning(false);
        isProcessingRef.current = false;
        abortRef.current = null;
      }
    },
    [userId],
  );

  const attachmentAdapter = useMemo(() => {
    const textAdapter = new SimpleTextAttachmentAdapter();
    textAdapter.accept = [
      ".md",
      ".markdown",
      ".txt",
      ".text",
      ".json",
      ".yaml",
      ".yml",
      "text/plain",
      "text/markdown",
      "text/x-markdown",
      "application/json",
      "application/yaml",
      "application/x-yaml",
      "text/yaml",
      "text/x-yaml",
    ].join(",");
    return new CompositeAttachmentAdapter([
      new SimpleImageAttachmentAdapter(),
      textAdapter,
    ]);
  }, []);

  return useExternalStoreRuntime<ThreadMessageLike>({
    messages,
    isRunning,
    onNew,
    convertMessage: (m) => m,
    adapters: { attachments: attachmentAdapter },
  });
}

// ── Root provider ─────────────────────────────────────────────────────────────

export function MyRuntimeProvider({
  children,
  userId,
  projectId,
}: Readonly<{ children: ReactNode; userId?: string; projectId: string }>) {
  const threadListAdapter = useMemo(
    () => makeThreadListAdapter(userId, projectId),
    [userId, projectId],
  );

  const runtime = useRemoteThreadListRuntime({
    runtimeHook: useLangGraphRuntime,
    adapter: threadListAdapter,
  });

  return (
    <UserIdContext.Provider value={userId}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </UserIdContext.Provider>
  );
}
