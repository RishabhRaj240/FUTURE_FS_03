import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
  isLiked?: boolean;
};

interface ProjectCardProps {
  project: Project;
  onLikeToggle?: () => void;
}

export const ProjectCard = ({ project, onLikeToggle }: ProjectCardProps) => {
  const [isLiking, setIsLiking] = useState(false);
  const [localLiked, setLocalLiked] = useState(project.isLiked || false);
  const [likesCount, setLikesCount] = useState(project.likes_count);
  const { toast } = useToast();

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLiking(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
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
        setLikesCount(prev => prev - 1);
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ user_id: user.id, project_id: project.id });

        if (error) throw error;
        
        setLocalLiked(true);
        setLikesCount(prev => prev + 1);
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

  return (
    <Link to={`/project/${project.id}`} className="group block">
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-lg bg-muted aspect-[4/3]">
          <img
            src={project.image_url}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-white/90 hover:bg-white text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleLike}
            disabled={isLiking}
          >
            <Heart className={`h-5 w-5 ${localLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarImage src={project.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{project.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-foreground truncate">
              {project.profiles?.username}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
            <div className="flex items-center gap-1">
              <Heart className={`h-3.5 w-3.5 ${localLiked ? 'fill-red-500 text-red-500' : ''}`} />
              <span>{likesCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              <span>{project.views_count}</span>
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {project.title}
        </h3>
      </div>
    </Link>
  );
};
