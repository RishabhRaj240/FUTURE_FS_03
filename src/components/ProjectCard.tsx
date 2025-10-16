import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Eye, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ProfileHoverCard } from "@/components/ProfileHoverCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
  categories: Database["public"]["Tables"]["categories"]["Row"] | null;
  isLiked?: boolean;
  isSaved?: boolean;
};

interface ProjectCardProps {
  project: Project;
  onLikeToggle?: () => void;
  onSaveToggle?: () => void;
  isBestSection?: boolean;
  rank?: number;
}

export const ProjectCard = ({
  project,
  onLikeToggle,
  onSaveToggle,
  isBestSection = false,
  rank,
}: ProjectCardProps) => {
  const [isLiking, setIsLiking] = useState(false);
  const [localLiked, setLocalLiked] = useState(project.isLiked || false);
  const [likesCount, setLikesCount] = useState(project.likes_count);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(project.isSaved || false);
  const [savesCount, setSavesCount] = useState(project.saves_count || 0);
  const { toast } = useToast();

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLiking(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to like projects",
        variant: "destructive",
      });
      setIsLiking(false);
      return;
    }

    try {
      if (localLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("project_id", project.id);

        if (error) throw error;

        setLocalLiked(false);
        setLikesCount((prev) => prev - 1);
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ user_id: user.id, project_id: project.id });

        if (error) throw error;

        setLocalLiked(true);
        setLikesCount((prev) => prev + 1);
      }

      onLikeToggle?.();
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to save projects",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    try {
      if (isSaved) {
        const { error } = await supabase
          .from("saves")
          .delete()
          .eq("user_id", user.id)
          .eq("project_id", project.id);

        if (error) throw error;

        setIsSaved(false);
        setSavesCount((prev) => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase
          .from("saves")
          .insert({ user_id: user.id, project_id: project.id });

        if (error) throw error;

        setIsSaved(true);
        setSavesCount((prev) => prev + 1);
      }

      onSaveToggle?.();
    } catch (error) {
      console.error("Error toggling save:", error);
      toast({
        title: "Error",
        description: "Failed to update save",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Determine if this is a top post (top 3 or high likes)
  const isTopPost =
    (isBestSection && rank !== undefined && rank <= 3) || likesCount >= 10;
  const isHighLiked = likesCount >= 5;

  return (
    <Link to={`/project/${project.id}`} className="group block">
      <div className={`space-y-2 ${isTopPost ? "relative" : ""}`}>
        {isTopPost && rank && (
          <div className="absolute -top-2 -left-2 z-20 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
            #{rank}
          </div>
        )}
        <div
          className={`relative overflow-hidden rounded-lg bg-muted aspect-[4/3] ${
            isTopPost ? "ring-2 ring-yellow-400/50 shadow-lg" : ""
          }`}
        >
          {/(\.mp4|\.webm|\.mov|\.m4v)(\?|$)/i.test(project.image_url) ? (
            <video
              src={project.image_url}
              className="w-full h-full object-cover"
              controls
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={project.image_url}
              alt={project.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                // Create fallback div
                const fallback = document.createElement("div");
                fallback.className =
                  "w-full h-full bg-muted flex items-center justify-center";
                fallback.innerHTML =
                  '<div class="text-muted-foreground text-sm text-center">Image failed to load</div>';
                target.parentNode?.insertBefore(fallback, target);
              }}
            />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10" />
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/90 hover:bg-white text-foreground"
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart
                className={`h-5 w-5 ${
                  localLiked ? "fill-red-500 text-red-500" : ""
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/90 hover:bg-white text-foreground"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Bookmark
                className={`h-5 w-5 ${
                  isSaved ? "fill-blue-500 text-blue-500" : ""
                }`}
              />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ProfileHoverCard userId={project.user_id}>
              <Avatar className="h-6 w-6 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                <AvatarImage src={project.profiles?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {project.profiles?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </ProfileHoverCard>
            <span className="text-xs font-medium text-foreground truncate">
              {project.profiles?.username}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
            <div
              className={`flex items-center gap-1 ${
                isHighLiked ? "text-orange-600 font-semibold" : ""
              }`}
            >
              <Heart
                className={`h-3.5 w-3.5 ${
                  localLiked
                    ? "fill-red-500 text-red-500"
                    : isHighLiked
                    ? "text-orange-600"
                    : ""
                }`}
              />
              <span
                className={isHighLiked ? "text-orange-600 font-semibold" : ""}
              >
                {likesCount}
              </span>
              {isHighLiked && <span className="text-orange-500">🔥</span>}
            </div>
            <div className="flex items-center gap-1">
              <Bookmark
                className={`h-3.5 w-3.5 ${
                  isSaved ? "fill-blue-500 text-blue-500" : ""
                }`}
              />
              <span>{savesCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              <span>{project.views_count}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {project.title}
          </h3>
          {project.categories && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {project.categories.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
