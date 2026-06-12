import { appendMessages, getThread } from "@/app/api/_mock/store";

// SSE event format the frontend expects: "data: <json>\n\n"
function sseEvent(payload: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

const MOCK_REPLY = `Hello! I'm the **OmniStack UI mock backend**.

This is a preview-only mode — no real AI is running. The UI layout, styles, and interactions are fully functional so a designer can work on them without connecting to the real backend.

Here's what you can explore:

- **Thread list** in the sidebar — create, rename, archive threads
- **Project switcher** — create and switch between projects  
- **Artifact canvas** on the right — shows PRD / output panels
- **Composer** — type messages, attach files, send

> To connect to the real backend, set \`NEXT_PUBLIC_SAAS_URL\` in \`.env.local\`.
`;

async function streamReply(
  controller: ReadableStreamDefaultController,
  userText: string,
  threadId: string,
  userId: string,
) {
  const msgId = Math.random().toString(36).slice(2);

  // Stream the reply word by word with a small delay
  const words = MOCK_REPLY.split(" ");
  let accumulated = "";
  for (const word of words) {
    accumulated += (accumulated ? " " : "") + word;
    controller.enqueue(sseEvent({ type: "text", content: word + " " }));
    await new Promise((r) => setTimeout(r, 18));
  }

  controller.enqueue(sseEvent({ type: "done" }));

  // Persist to in-memory history
  const lgThreadId = `${userId}:${threadId}`;
  appendMessages(lgThreadId, [
    {
      id: Math.random().toString(36).slice(2),
      role: "user",
      content: [{ type: "text", text: userText }],
    },
    {
      id: msgId,
      role: "assistant",
      content: [{ type: "text", text: accumulated }],
    },
  ]);

  controller.close();
}

export async function POST(req: Request) {
  let userText = "";
  let threadId = "";
  let userId = "anonymous";

  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("multipart")) {
    const form = await req.formData();
    userText = (form.get("text") as string) ?? "";
    threadId = (form.get("threadId") as string) ?? "";
    userId = (form.get("userId") as string) ?? "anonymous";
  } else {
    const body = await req.json() as { text?: string; threadId?: string; userId?: string };
    userText = body.text ?? "";
    threadId = body.threadId ?? "";
    userId = body.userId ?? "anonymous";
  }

  const stream = new ReadableStream({
    async start(controller) {
      await streamReply(controller, userText, threadId, userId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
