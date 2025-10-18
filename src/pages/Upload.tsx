import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import {
  Upload as UploadIcon,
  X,
  Image as ImageIcon,
  Video as VideoIcon,
} from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

export default function Upload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isVideoSelected, setIsVideoSelected] = useState<boolean>(false);
  const [uploadType, setUploadType] = useState<"image" | "video">("image");
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Allow video uploads for all categories
  const isVideoCategory = (() => {
    const selected = categories.find((c) => c.id === categoryId);
    if (!selected) return false;
    const name = (selected.name || "").toLowerCase();
    return (
      name === "edited video" ||
      name === "motion" ||
      name === "animation" ||
      name === "video production"
    );
  })();

  const checkAuth = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  }, [navigate]);

  useEffect(() => {
    checkAuth();
    loadCategories();
  }, [checkAuth]);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error loading categories:", error);
      return;
    }

    setCategories(data || []);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type based on upload type
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      if (uploadType === "video" && !isVideo) {
        toast({
          title: "Invalid File Type",
          description: "Please select a video file (MP4, WebM, MOV, etc.)",
          variant: "destructive",
        });
        return;
      }

      if (uploadType === "image" && !isImage) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (PNG, JPG, WEBP, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size
      const maxSize =
        uploadType === "video" ? 200 * 1024 * 1024 : 10 * 1024 * 1024; // 200MB for video, 10MB for image
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `File size must be less than ${
            uploadType === "video" ? "200MB" : "10MB"
          }`,
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      setIsVideoSelected(isVideo);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setIsVideoSelected(false);
  };

  const handleUploadTypeChange = (type: "image" | "video") => {
    setUploadType(type);
    // Clear current file when switching types
    if (imageFile) {
      setImageFile(null);
      setImagePreview(null);
      setIsVideoSelected(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile) {
      toast({
        title: "Error",
        description:
          uploadType === "video"
            ? "Please select a video"
            : "Please select an image",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload media (image or video)
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("projects")
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("projects").getPublicUrl(fileName);

      // Create project (store media URL in image_url for now)
      const { error: projectError } = await supabase.from("projects").insert({
        user_id: user.id,
        title,
        description,
        image_url: publicUrl,
        category_id: categoryId || null,
      });

      if (projectError) throw projectError;

      toast({
        title: "Success!",
        description: "Your project has been uploaded",
      });

      navigate("/");
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-3xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Share Your Work</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Upload Type Selector */}
              <div className="space-y-2">
                <Label>Upload Type *</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={uploadType === "image" ? "default" : "outline"}
                    onClick={() => handleUploadTypeChange("image")}
                    className="flex-1"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Image
                  </Button>
                  <Button
                    type="button"
                    variant={uploadType === "video" ? "default" : "outline"}
                    onClick={() => handleUploadTypeChange("video")}
                    className="flex-1"
                  >
                    <VideoIcon className="h-4 w-4 mr-2" />
                    Video
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {uploadType === "video"
                    ? "Videos will auto-play in the project grid and can be up to 200MB"
                    : "Images are optimized for fast loading and can be up to 10MB"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>
                  Project {uploadType === "video" ? "Video" : "Image"} *
                </Label>
                {imagePreview ? (
                  <div className="relative">
                    {isVideoSelected ? (
                      <video
                        src={imagePreview}
                        className="w-full h-64 object-cover rounded-lg"
                        controls
                      />
                    ) : (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadIcon className="h-10 w-10 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {uploadType === "video"
                          ? "MP4, WebM, MOV (MAX. 200MB)"
                          : "PNG, JPG, or WEBP (MAX. 10MB)"}
                      </p>
                    </div>
                    <Input
                      type="file"
                      className="hidden"
                      accept={uploadType === "video" ? "video/*" : "image/*"}
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Give your project a title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us about your project..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading} className="flex-1">
                  {uploading ? "Uploading..." : "Publish"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
