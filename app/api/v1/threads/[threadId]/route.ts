import { NextResponse } from "next/server";
import { getThread, patchThread, deleteThread } from "@/app/api/_mock/store";

type Params = { params: Promise<{ threadId: string }> };

export function GET(_req: Request, { params }: Params) {
  return params.then(({ threadId }) => {
    const t = getThread(threadId);
    if (!t) return NextResponse.json({ detail: "Not found." }, { status: 404 });
    return NextResponse.json({ remoteId: t.remoteId, status: t.status, title: t.title });
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const { threadId } = await params;
  const body = await req.json() as Record<string, string>;
  const patch: { title?: string; status?: "regular" | "archived" } = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.status !== undefined) patch.status = body.status as "regular" | "archived";
  // ignore other fields (e.g. target_board) — just return ok
  const t = patchThread(threadId, patch) ?? getThread(threadId);
  return NextResponse.json({ remoteId: threadId, ...(t ?? {}) });
}

export function DELETE(_req: Request, { params }: Params) {
  return params.then(({ threadId }) => {
    deleteThread(threadId);
    return new NextResponse(null, { status: 204 });
  });
}
