import { NextResponse } from "next/server";
import { openProject } from "@/app/api/_mock/store";

export function POST(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  return params.then(({ projectId }) => {
    const project = openProject(projectId);
    if (!project) return NextResponse.json({ detail: "Not found." }, { status: 404 });
    return NextResponse.json(project);
  });
}
