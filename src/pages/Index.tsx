import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProjectGrid } from "@/components/ProjectGrid";
import { TestProjects } from "@/components/TestProjects";
import { NavigationTest } from "@/components/NavigationTest";
import { NexusLogo } from "@/components/NexusLogo";
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
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("all");

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

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
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

      if (projectsError) {
        console.error("Error loading projects:", projectsError);
        
        // Handle specific error types
        if (projectsError.message.includes("fetch") || projectsError.message.includes("Failed to fetch")) {
          setError("Unable to connect to the server. Please check your internet connection and try again.");
        } else if (projectsError.code === "PGRST301" || projectsError.message.includes("JWT")) {
          setError("Authentication error. Please refresh the page or log in again.");
        } else {
          setError(`Failed to load projects: ${projectsError.message}`);
        }
        setProjects([]);
        setLoading(false);
        return;
      }

      let results = (projectsData || []) as Project[];

      console.log("Raw projects from database:", results.length, "projects");

      // Apply media type filter
      const filterVideosOnly =
        activeSection === "edited-video" ||
        activeSection === "motion" ||
        mediaType === "videos";
      const filterImagesOnly = mediaType === "images";

      if (filterVideosOnly) {
        // Show only videos
        results = results.filter((p) =>
          /(\.mp4|\.webm|\.mov|\.m4v)(\?|$)/i.test(p.image_url || "")
        );
      } else if (filterImagesOnly) {
        // Show only images
        results = results.filter(
          (p) => !/(\.mp4|\.webm|\.mov|\.m4v)(\?|$)/i.test(p.image_url || "")
        );
      }

      // Load user likes and saves if authenticated
      if (user) {
        try {
          const [likesResult, savesResult] = await Promise.all([
            supabase
              .from("likes")
              .select("project_id")
              .eq("user_id", user.id),
            supabase
              .from("saves")
              .select("project_id")
              .eq("user_id", user.id),
          ]);

          const likedProjectIds = new Set(
            likesResult.data?.map((like) => like.project_id) || []
          );
          const savedProjectIds = new Set(
            savesResult.data?.map((save) => save.project_id) || []
          );

          const projectsWithLikesAndSaves = results.map((project) => ({
            ...project,
            isLiked: likedProjectIds.has(project.id),
            isSaved: savedProjectIds.has(project.id),
          })) as Project[];

          setProjects(projectsWithLikesAndSaves);
        } catch (userDataError) {
          console.error("Error loading user data:", userDataError);
          // Continue with projects even if user data fails
          setProjects(results);
        }
      } else {
        setProjects(results);
      }
    } catch (err) {
      console.error("Unexpected error loading projects:", err);
      setError(
        err instanceof Error
          ? `An unexpected error occurred: ${err.message}`
          : "An unexpected error occurred while loading projects."
      );
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchParams, activeSection]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

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
        {/* Hero Section - Show when no search and on main page */}
        {!searchParams.get("search") && activeSection === "all" && (
          <div className="mb-12 text-center">
            <div className="flex justify-center mb-6">
              <NexusLogo size="xl" variant="hero" className="text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-muted-foreground mb-4">
              Discover Creative Excellence
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with talented creators, showcase your work, and find
              inspiration in our vibrant community.
            </p>
          </div>
        )}

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
              Best of Nexus
            </h1>
            <p className="text-muted-foreground">
              Discover the most loved creative works from our community
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 mb-4">
                <h3 className="text-xl font-semibold text-destructive mb-2">
                  Error Loading Projects
                </h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <button
                  onClick={() => loadProjects()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-2xl font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share your creative work!
            </p>
            <NavigationTest />
            <TestProjects />
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
