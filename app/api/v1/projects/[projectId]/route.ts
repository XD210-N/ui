import { NextResponse } from "next/server";
import { deleteProject } from "@/app/api/_mock/store";

export function DELETE(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  return params.then(({ projectId }) => {
    const ok = deleteProject(projectId);
    if (!ok) return NextResponse.json({ detail: "Not found." }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  });
}
