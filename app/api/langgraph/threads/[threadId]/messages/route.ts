import { NextResponse } from "next/server";
import { getMessages } from "@/app/api/_mock/store";

export function GET(
  _req: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  return params.then(({ threadId }) => {
    // threadId here is the URL-encoded lgThreadId (userId:remoteId)
    const lgThreadId = decodeURIComponent(threadId);
    return NextResponse.json({ messages: getMessages(lgThreadId) });
  });
}
