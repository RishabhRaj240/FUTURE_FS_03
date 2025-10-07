import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  fallbackText?: string;
}

export const ProfileImageUpload = ({
  currentImageUrl,
  onImageUploaded,
  size = "md",
  className = "",
  fallbackText = "U",
}: ProfileImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-32 w-32",
    lg: "h-48 w-48",
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `avatars/${Date.now()}.${fileExt}`;

       const { data, error } = await supabase.storage
         .from("projects")
         .upload(fileName, file);

       if (error) throw error;

       const {
         data: { publicUrl },
       } = supabase.storage.from("projects").getPublicUrl(fileName);

      onImageUploaded(publicUrl);

      toast({
        title: "Success",
        description: "Profile image uploaded successfully!",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileSelect(file);
    };
    input.click();
  };

  return (
    <div className={`relative group ${className}`}>
      <Avatar
        className={`${sizeClasses[size]} border-4 border-white shadow-lg`}
      >
        <AvatarImage src={currentImageUrl || ""} />
        <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          {fallbackText}
        </AvatarFallback>
      </Avatar>

      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center">
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full"
          onClick={handleClick}
          disabled={uploading}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>

      {uploading && (
        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
          <div className="text-white text-sm">Uploading...</div>
        </div>
      )}
    </div>
  );
};
