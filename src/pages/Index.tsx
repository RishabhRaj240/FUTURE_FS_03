import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProjectGrid } from "@/components/ProjectGrid";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
  categories: Database["public"]["Tables"]["categories"]["Row"] | null;
  isLiked?: boolean;
  isSaved?: boolean;
};

const Index = () => {
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("all");

  const loadProjects = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const searchQuery = searchParams.get("search");
    const categoryFilter = searchParams.get("category");
    const sortBy = searchParams.get("sort") || "relevance";
    const dateRange = searchParams.get("date") || "all";
    const mediaType = searchParams.get("media") || "all";

    let query = supabase.from("projects").select(`
        *,
        profiles(*),
        categories(*)
      `);

    // Apply search query
    if (searchQuery) {
      query = query.or(
        `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
      );
    }

    // Apply category filter
    if (activeSection === "category" && selectedCategory) {
      query = query.eq("category_id", selectedCategory);
    } else if (categoryFilter) {
      query = query.eq("category_id", categoryFilter);
    }

    // Apply date range filter
    if (dateRange !== "all") {
      const dateFilter = getDateFilter(dateRange);
      if (dateFilter) {
        query = query.gte("created_at", dateFilter);
      }
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "most_liked":
        query = query.order("likes_count", {
          ascending: false,
          nullsFirst: false,
        });
        break;
      case "most_saved":
        query = query.order("saves_count", {
          ascending: false,
          nullsFirst: false,
        });
        break;
      case "most_commented":
        query = query.order("comments_count", {
          ascending: false,
          nullsFirst: false,
        });
        break;
      case "relevance":
      default:
        if (searchQuery) {
          // For relevance, prioritize projects with search terms in title
          query = query.order("title", { ascending: true });
        } else {
          query = query.order("created_at", { ascending: false });
        }
        break;
    }

    // Sections behavior
    if (activeSection === "best") {
      // Sort by likes_count desc, then by created_at desc for tie-breaking
      query = query
        .order("likes_count", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
    }

    const { data: projectsData, error: projectsError } = await query;

    let results = (projectsData || []) as Project[];

    console.log("Raw projects from database:", results.length, "projects");
    console.log(
      "Project URLs:",
      results.map((p) => ({
        title: p.title,
        url: p.image_url,
        category: p.categories?.name,
      }))
    );

    // Apply media type filter
    const filterVideosOnly =
      activeSection === "edited-video" ||
      activeSection === "motion" ||
      mediaType === "videos";
    const filterImagesOnly = mediaType === "images";

    console.log("Filtering projects:", {
      activeSection,
      mediaType,
      filterVideosOnly,
      filterImagesOnly,
      totalProjects: results.length,
    });

    if (filterVideosOnly) {
      // Show only videos
      results = results.filter((p) =>
        /(\.mp4|\.webm|\.mov|\.m4v)(\?|$)/i.test(p.image_url || "")
      );
      console.log("After video filter:", results.length, "videos found");
    } else if (filterImagesOnly) {
      // Show only images
      results = results.filter(
        (p) => !/(\.mp4|\.webm|\.mov|\.m4v)(\?|$)/i.test(p.image_url || "")
      );
      console.log("After image filter:", results.length, "images found");
    } else if (activeSection !== "edited-video" && activeSection !== "motion") {
      // In all other sections, show both images and videos
      // No filtering needed - show all content
      console.log(
        "Showing all content (images + videos):",
        results.length,
        "total projects"
      );
    }

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

      const { data: savesData } = await supabase
        .from("saves")
        .select("project_id")
        .eq("user_id", user.id);

      const likedProjectIds = new Set(
        likesData?.map((like) => like.project_id) || []
      );
      const savedProjectIds = new Set(
        savesData?.map((save) => save.project_id) || []
      );

      const projectsWithLikesAndSaves = (results.map((project) => ({
        ...project,
        isLiked: likedProjectIds.has(project.id),
        isSaved: savedProjectIds.has(project.id),
      })) || []) as Project[];

      setProjects(projectsWithLikesAndSaves as Project[]);
    } else {
      setProjects(results as Project[]);
    }

    setLoading(false);
  }, [selectedCategory, searchParams, activeSection]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const getDateFilter = (dateRange: string) => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return now.toISOString().split("T")[0];
      case "week": {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString();
      }
      case "month": {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return monthAgo.toISOString();
      }
      case "year": {
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return yearAgo.toISOString();
      }
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onSectionChange={setActiveSection}
        activeSection={activeSection}
      />

      <main className="container px-4 py-8">
        {/* Search Results Header */}
        {searchParams.get("search") && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">
              Search results for "{searchParams.get("search")}"
            </h1>
            <p className="text-muted-foreground">
              {projects.length} {projects.length === 1 ? "project" : "projects"}{" "}
              found
            </p>
          </div>
        )}

        {activeSection === "best" && (
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent mb-2">
              Best of Creative Hub
            </h1>
            <p className="text-muted-foreground">
              Discover the most loved creative works from our community
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        ) : (
          <ProjectGrid
            projects={projects}
            onProjectUpdate={loadProjects}
            onSaveToggle={loadProjects}
            isBestSection={activeSection === "best"}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
