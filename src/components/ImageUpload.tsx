import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Camera, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  bucket: string;
  folder: string;
  aspectRatio?: string;
  className?: string;
  placeholder?: string;
  isBanner?: boolean;
}

export const ImageUpload = ({
  currentImageUrl,
  onImageUploaded,
  bucket,
  folder,
  aspectRatio = "aspect-square",
  className = "",
  placeholder = "Upload Image",
  isBanner = false,
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
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

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onImageUploaded(publicUrl);
      setPreviewUrl(null);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onImageUploaded("");
    setPreviewUrl(null);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />

      {displayUrl ? (
        <Card className="group cursor-pointer hover:shadow-lg transition-shadow duration-200 overflow-hidden">
          <div className={`${aspectRatio} overflow-hidden relative`}>
            <img
              src={displayUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleClick}
                disabled={uploading}
              >
                <Camera className="h-4 w-4 mr-1" />
                {uploading ? "Uploading..." : "Change"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemoveImage}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card
          className={`${aspectRatio} border-dashed border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors duration-200`}
          onClick={handleClick}
        >
          <CardContent className="flex flex-col items-center justify-center h-full p-6">
            <div className="text-gray-400 mb-4">
              {isBanner ? (
                <ImageIcon className="h-12 w-12" />
              ) : (
                <Camera className="h-12 w-12" />
              )}
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              {placeholder}
            </p>
            <p className="text-xs text-gray-500 text-center">
              {isBanner 
                ? "Optimal dimensions 3200 x 410px" 
                : "Click to upload or drag and drop"
              }
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-1" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
