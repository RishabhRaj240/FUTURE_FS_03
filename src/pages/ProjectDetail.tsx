import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ProfileHoverCard } from "@/components/ProfileHoverCard";
import {
  Heart,
  Eye,
  Share2,
  ArrowLeft,
  Calendar,
  Tag,
  ExternalLink,
  Download,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Edit,
  Trash2,
  Upload,
  Camera,
  Send
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
  categories: Database["public"]["Tables"]["categories"]["Row"] | null;
  isLiked?: boolean;
};

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [localLiked, setLocalLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savesCount, setSavesCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    loadProject();
    getCurrentUser();
  }, [id]);

  useEffect(() => {
    if (currentUser && project) {
      checkIfSaved();
    }
  }, [currentUser, project]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadProject = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select(`
          *,
          profiles(*),
          categories(*)
        `)
        .eq("id", id)
        .single();

      if (projectError) {
        console.error("Error loading project:", projectError);
        navigate("/404");
        return;
      }

      setProject(projectData);
      setLikesCount(projectData.likes_count);
      setSavesCount(projectData.saves_count || 0);
      setCommentsCount(projectData.comments_count || 0);

      // Check if current user has liked this project
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: likeData } = await supabase
          .from("likes")
          .select("id")
          .eq("user_id", user.id)
          .eq("project_id", id)
          .single();

        setLocalLiked(!!likeData);
      }

      // Load comments
      loadComments();
    } catch (error) {
      console.error("Error:", error);
      navigate("/404");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to like projects",
        variant: "destructive",
      });
      return;
    }

    setIsLiking(true);

    try {
      if (localLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("project_id", project!.id);

        if (error) throw error;
        
        setLocalLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ user_id: user.id, project_id: project!.id });

        if (error) throw error;
        
        setLocalLiked(true);
        setLikesCount(prev => prev + 1);
      }
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: project?.title,
          text: project?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Project link copied to clipboard",
      });
    }
  };

  const handleSave = async () => {
    if (!currentUser || !project) return;

    setIsSaving(true);
    try {
      if (isSaved) {
        // Unsave the project
        const { error } = await supabase
          .from("saves")
          .delete()
          .eq("user_id", currentUser.id)
          .eq("project_id", project.id);

        if (error) throw error;

        setIsSaved(false);
        setSavesCount(prev => Math.max(0, prev - 1));
        toast({
          title: "Removed from saves",
          description: "Project removed from your saved items",
        });
      } else {
        // Save the project
        const { error } = await supabase
          .from("saves")
          .insert({
            user_id: currentUser.id,
            project_id: project.id
          });

        if (error) throw error;

        setIsSaved(true);
        setSavesCount(prev => prev + 1);
        toast({
          title: "Saved",
          description: "Project added to your saved items",
        });
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast({
        title: "Error",
        description: "Failed to update save status",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleComment = async () => {
    if (!currentUser || !project || !newComment.trim()) return;

    setIsCommenting(true);
    try {
      const { error } = await supabase
        .from("comments")
        .insert({
          user_id: currentUser.id,
          project_id: project.id,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment("");
      loadComments();
      setCommentsCount(prev => prev + 1);
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsCommenting(false);
    }
  };

  const loadComments = async () => {
    if (!project) return;

    try {
      const { data: commentsData, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("project_id", project.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setComments(commentsData || []);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const checkIfSaved = async () => {
    if (!currentUser || !project) return;

    try {
      const { data: saveData } = await supabase
        .from("saves")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("project_id", project.id)
        .single();

      setIsSaved(!!saveData);
    } catch (error) {
      console.error("Error checking save status:", error);
    }
  };

  const isProjectOwner = currentUser && project && currentUser.id === project.user_id;

  const handleDeleteImage = async () => {
    if (!project) return;

    try {
      // Extract file path from URL
      const url = new URL(project.image_url);
      const filePath = url.pathname.split('/').slice(3).join('/'); // Remove '/storage/v1/object/public/projects/'

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('projects')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        toast({
          title: "Error",
          description: "Failed to delete image from storage.",
          variant: "destructive",
        });
        return;
      }

      // Update project with placeholder image
      const { error: updateError } = await supabase
        .from('projects')
        .update({ image_url: '/placeholder.svg' })
        .eq('id', project.id);

      if (updateError) {
        toast({
          title: "Error",
          description: "Failed to update project.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setProject({ ...project, image_url: '/placeholder.svg' });
      setIsEditMode(false);
      
      toast({
        title: "Success",
        description: "Image deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image.",
        variant: "destructive",
      });
    }
  };

  const handleReuploadImage = async (file: File) => {
    if (!project) return;

    setIsUploading(true);
    try {
      // Keep reference to the previous image URL so we can clean it up after updating
      const previousImageUrl = project.image_url;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${project.user_id}/${Date.now()}.${fileExt}`;

      // Upload new image
      const { data, error: uploadError } = await supabase.storage
        .from('projects')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('projects')
        .getPublicUrl(fileName);

      // Update project with new image URL
      const { error: updateError } = await supabase
        .from('projects')
        .update({ image_url: publicUrl })
        .eq('id', project.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setProject({ ...project, image_url: publicUrl });
      setIsEditMode(false);

      // Best-effort: remove the old image from storage to avoid orphaned files
      try {
        if (previousImageUrl && !previousImageUrl.endsWith('/placeholder.svg')) {
          const prevUrl = new URL(previousImageUrl);
          // Expect: /storage/v1/object/public/projects/<path>
          const prevPath = prevUrl.pathname.split('/').slice(5).join('/');
          // Fallback for different path structures
          const altPrevPath = prevUrl.pathname.split('/').slice(3).join('/');
          const candidatePaths = [prevPath, altPrevPath].filter(Boolean);

          for (const p of candidatePaths) {
            if (!p) continue;
            const { error: removeError } = await supabase.storage
              .from('projects')
              .remove([p]);
            // If one removal path works, stop trying others
            if (!removeError) break;
          }
        }
      } catch (cleanupError) {
        // Non-fatal: log but don't interrupt user flow
        console.warn('Failed to cleanup previous image:', cleanupError);
      }
      
      toast({
        title: "Success",
        description: "Image updated successfully!",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to update image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-6"></div>
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">Project not found</h1>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Media */}
            <div className="relative overflow-hidden rounded-lg bg-white shadow-sm group">
              {/(\.mp4|\.webm|\.mov|\.m4v)(\?|$)/i.test(project.image_url) ? (
                <video src={project.image_url} className="w-full h-auto" controls autoPlay muted loop playsInline />
              ) : (
                <img
                  src={project.image_url}
                  alt={project.title}
                  className="w-full h-auto object-cover"
                />
              )}
              
              {/* Edit Mode Overlay */}
              {isProjectOwner && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleReuploadImage(file);
                        };
                        input.click();
                      }}
                      disabled={isUploading}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Re-upload'}
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isUploading}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project Image</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this project image? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteImage}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Image
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </div>

            {/* Project Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {project.title}
                  </h1>
                  {project.description && (
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>
                
                {/* Edit Mode Toggle */}
                {isProjectOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="ml-4"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Exit Edit' : 'Edit Project'}
                  </Button>
                )}
              </div>

              {/* Project Stats */}
              <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {formatDate(project.created_at)}
                  </span>
                </div>
                {project.categories && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <Badge variant="secondary" className="bg-blue-100 text-blue-600">
                      {project.categories.name}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Info */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Created by</h3>
              <div className="flex items-center gap-3">
                <ProfileHoverCard userId={project.user_id}>
                  <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                    <AvatarImage src={project.profiles?.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {project.profiles?.full_name?.[0] || project.profiles?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </ProfileHoverCard>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {project.profiles?.full_name || project.profiles?.username}
                  </h4>
                  <p className="text-sm text-gray-500">@{project.profiles?.username}</p>
                </div>
              </div>
              <Separator className="my-4" />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/${project.profiles?.username}`)}
              >
                View Profile
              </Button>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLike}
                    disabled={isLiking}
                    className="flex-1 mr-2"
                  >
                    <Heart className={`h-4 w-4 mr-2 ${localLiked ? 'fill-red-500 text-red-500' : ''}`} />
                    {localLiked ? 'Liked' : 'Like'} ({likesCount})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="flex-1 ml-2"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleSave}
                  disabled={isSaving || !currentUser}
                >
                  <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? 'fill-blue-500 text-blue-500' : ''}`} />
                  {isSaved ? 'Saved' : 'Save'} ({savesCount})
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  disabled={!currentUser}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Comment ({commentsCount})
                </Button>
              </div>
            </Card>

            {/* Owner Actions */}
            {isProjectOwner && (
              <Card className="p-6 border-blue-200 bg-blue-50">
                <h3 className="font-semibold text-blue-900 mb-4">Owner Actions</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleReuploadImage(file);
                      };
                      input.click();
                    }}
                    disabled={isUploading}
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Change Project Image'}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isUploading}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project Image
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project Image</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this project image? This action cannot be undone and will replace the image with a placeholder.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteImage}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Image
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            )}

            {/* Project Stats */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Views</span>
                  </div>
                  <span className="font-medium text-gray-900">{project.views_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Likes</span>
                  </div>
                  <span className="font-medium text-gray-900">{likesCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Saves</span>
                  </div>
                  <span className="font-medium text-gray-900">{savesCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Comments</span>
                  </div>
                  <span className="font-medium text-gray-900">{commentsCount}</span>
                </div>
              </div>
            </Card>

            {/* Comments Section */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Comments ({commentsCount})</h3>
              
              {/* Add Comment Form */}
              {currentUser ? (
                <div className="mb-6">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {currentUser.user_metadata?.full_name?.[0] || currentUser.email?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px] resize-none"
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          onClick={handleComment}
                          disabled={isCommenting || !newComment.trim()}
                          size="sm"
                        >
                          {isCommenting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Posting...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Post Comment
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    Please log in to add a comment
                  </p>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.profiles?.avatar_url} />
                        <AvatarFallback>
                          {comment.profiles?.full_name?.[0] || comment.profiles?.username?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {comment.profiles?.full_name || comment.profiles?.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
