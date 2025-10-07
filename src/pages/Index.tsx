import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProjectGrid } from "@/components/ProjectGrid";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
  isLiked?: boolean;
};

const Index = () => {
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [selectedCategory, searchParams]);

  const loadProjects = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    const searchQuery = searchParams.get("search");

    let query = supabase
      .from("projects")
      .select(`
        *,
        profiles(*)
      `)
      .order("created_at", { ascending: false });

    if (selectedCategory) {
      query = query.eq("category_id", selectedCategory);
    }

    if (searchQuery) {
      query = query.ilike("title", `%${searchQuery}%`);
    }

    const { data: projectsData, error: projectsError } = await query;

    if (projectsError) {
      console.error("Error loading projects:", projectsError);
      setLoading(false);
      return;
    }

    if (user) {
      const { data: likesData } = await supabase
        .from("likes")
        .select("project_id")
        .eq("user_id", user.id);

      const likedProjectIds = new Set(likesData?.map(like => like.project_id) || []);

      const projectsWithLikes = (projectsData?.map(project => ({
        ...project,
        isLiked: likedProjectIds.has(project.id),
      })) || []) as Project[];

      setProjects(projectsWithLikes);
    } else {
      setProjects((projectsData || []) as Project[]);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryFilter 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      
      <main className="container px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        ) : (
          <ProjectGrid projects={projects} onProjectUpdate={loadProjects} />
        )}
      </main>
    </div>
  );
};

export default Index;
