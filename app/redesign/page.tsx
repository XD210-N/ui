import { ProjectProvider } from "@/app/ProjectContext";
import { RedesignHome } from "./components/RedesignHome";

export default function RedesignPage() {
  return (
    <ProjectProvider>
      <RedesignHome />
    </ProjectProvider>
  );
}
