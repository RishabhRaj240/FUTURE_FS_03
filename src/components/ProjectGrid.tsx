import { ProjectCard } from "./ProjectCard";
import { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
  categories: Database["public"]["Tables"]["categories"]["Row"] | null;
  isLiked?: boolean;
};

interface ProjectGridProps {
  projects: Project[];
  onProjectUpdate?: () => void;
  onSaveToggle?: () => void;
  isBestSection?: boolean;
}

export const ProjectGrid = ({ projects, onProjectUpdate, onSaveToggle, isBestSection = false }: ProjectGridProps) => {
  if (projects.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-2xl font-semibold mb-2">No projects found</h3>
        <p className="text-muted-foreground">Be the first to share your creative work!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map((project, index) => (
        <ProjectCard 
          key={project.id} 
          project={project}
          onLikeToggle={onProjectUpdate}
          onSaveToggle={onSaveToggle}
          isBestSection={isBestSection}
          rank={isBestSection ? index + 1 : undefined}
        />
      ))}
    </div>
  );
};
