import { NextResponse } from "next/server";
import { listThreads, createThread } from "@/app/api/_mock/store";

export function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId") ?? "";
  const threads = listThreads(projectId);
  return NextResponse.json({ threads, nextCursor: null });
}

export async function POST(req: Request) {
  const body = await req.json() as { remoteId?: string; projectId?: string };
  const remoteId = body.remoteId ?? Math.random().toString(36).slice(2);
  const projectId = body.projectId ?? "demo-project";
  const thread = createThread(remoteId, projectId);
  return NextResponse.json({ thread_id: thread.remoteId, remoteId: thread.remoteId });
}
