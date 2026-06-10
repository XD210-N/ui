import { NextResponse } from "next/server";
import { listProjects, createProject } from "@/app/api/_mock/store";

export function GET() {
  return NextResponse.json({ projects: listProjects() });
}

export async function POST(req: Request) {
  const body = await req.json() as { name?: string };
  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ detail: "Project name is required." }, { status: 400 });
  }
  const project = createProject(name);
  return NextResponse.json(project, { status: 201 });
}
