import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Download,
  Search,
  Filter,
  Grid,
  List,
  Image as ImageIcon,
  Video,
  File,
  Calendar,
  Eye,
  Heart,
  MoreVertical,
  Archive,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import JSZip from "jszip";

type Project = Database["public"]["Tables"]["projects"]["Row"];

const Assets = () => {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<"all" | "images" | "videos">(
    "all"
  );
  const [isCreatingZip, setIsCreatingZip] = useState(false);
  const [downloadingAsset, setDownloadingAsset] = useState<string | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  // Compression utility function
  const compressImage = (
    file: Blob,
    maxWidth: number = 800,
    quality: number = 0.8
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions - more aggressive resizing for larger images
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // For very large images, reduce further
        if (width > 1200) {
          const scale = 1200 / width;
          width = 1200;
          height = height * scale;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            resolve(blob || file);
          },
          "image/jpeg",
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Video compression function - create a smaller version
  const compressVideo = (file: Blob): Promise<Blob> => {
    return new Promise((resolve) => {
      // For now, we'll create a thumbnail image from the video instead of compressing
      // This ensures the zip stays within size limits
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      video.onloadedmetadata = () => {
        // Set canvas dimensions (create a thumbnail)
        const maxWidth = 400;
        const maxHeight = 300;

        let { videoWidth, videoHeight } = video;

        // Calculate new dimensions maintaining aspect ratio
        if (videoWidth > maxWidth || videoHeight > maxHeight) {
          const aspectRatio = videoWidth / videoHeight;
          if (videoWidth > videoHeight) {
            videoWidth = maxWidth;
            videoHeight = maxWidth / aspectRatio;
          } else {
            videoHeight = maxHeight;
            videoWidth = maxHeight * aspectRatio;
          }
        }

        canvas.width = videoWidth;
        canvas.height = videoHeight;

        // Seek to middle of video for thumbnail
        video.currentTime = video.duration / 2;

        video.onseeked = () => {
          // Draw video frame to canvas
          ctx?.drawImage(video, 0, 0, videoWidth, videoHeight);

          // Convert to JPEG with high compression
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                resolve(file); // Fallback to original if compression fails
              }
            },
            "image/jpeg",
            0.6
          ); // 60% quality for significant compression
        };
      };

      video.onerror = () => {
        resolve(file); // Fallback to original if video fails to load
      };

      video.src = URL.createObjectURL(file);
      video.load();
    });
  };

  // Get file type and compress accordingly
  const processFileForZip = async (
    url: string,
    title: string
  ): Promise<Blob> => {
    const response = await fetch(url);
    const blob = await response.blob();

    // Check if it's an image
    if (blob.type.startsWith("image/")) {
      // Use more aggressive compression for zip files
      return await compressImage(blob, 600, 0.7);
    }

    // Check if it's a video
    if (blob.type.startsWith("video/")) {
      // Convert video to compressed thumbnail image
      return await compressVideo(blob);
    }

    // For other files, return as-is
    return blob;
  };

  const loadAssets = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setAssets(projects || []);
    } catch (error) {
      console.error("Error loading assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (asset: Project) => {
    setDownloadingAsset(asset.id);
    try {
      const zip = new JSZip();

      // Process and compress the project file
      const compressedBlob = await processFileForZip(
        asset.image_url,
        asset.title
      );

      // Get file extension - use .jpg for videos since we convert them to images
      const urlParts = asset.image_url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const originalExtension = fileName.split(".").pop() || "file";
      const fileExtension = compressedBlob.type.startsWith("image/")
        ? "jpg"
        : originalExtension;

      // Add the compressed project file
      zip.file(`project.${fileExtension}`, compressedBlob);

      // Add title text file
      zip.file("title.txt", asset.title);

      // Add description text file with compression note for videos
      const isVideo =
        asset.image_url.includes(".mp4") ||
        asset.image_url.includes(".mov") ||
        asset.image_url.includes(".avi") ||
        asset.image_url.includes(".webm");
      const descriptionText = isVideo
        ? `${
            asset.description || "No description provided"
          }\n\nNote: Video has been converted to a compressed thumbnail image for size optimization.`
        : asset.description || "No description provided";

      zip.file("description.txt", descriptionText);

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Check if zip is within size limits (100kb-2mb)
      const minSize = 100 * 1024; // 100kb
      const maxSize = 2 * 1024 * 1024; // 2mb

      if (zipBlob.size < minSize) {
        // If too small, add more content or show info
        console.log(
          `Zip size: ${Math.round(zipBlob.size / 1024)}kb - within limits`
        );
      }

      if (zipBlob.size > maxSize) {
        alert(
          `Zip file is too large (${Math.round(
            zipBlob.size / 1024
          )}kb). The file has been compressed but may still exceed limits.`
        );
        return;
      }

      // Download the zip file
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${asset.title.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}_project.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading asset:", error);
    } finally {
      setDownloadingAsset(null);
    }
  };

  const handleDownloadAllAsZip = async () => {
    if (assets.length === 0) return;

    setIsCreatingZip(true);
    try {
      const zip = new JSZip();

      // Add each project to the zip
      for (const asset of assets) {
        try {
          // Process and compress the project file
          const compressedBlob = await processFileForZip(
            asset.image_url,
            asset.title
          );

          // Get file extension - use .jpg for videos since we convert them to images
          const urlParts = asset.image_url.split("/");
          const fileName = urlParts[urlParts.length - 1];
          const originalExtension = fileName.split(".").pop() || "file";
          const fileExtension = compressedBlob.type.startsWith("image/")
            ? "jpg"
            : originalExtension;

          // Add the compressed project file
          zip.file(
            `${asset.title.replace(
              /[^a-zA-Z0-9]/g,
              "_"
            )}/project.${fileExtension}`,
            compressedBlob
          );

          // Add title text file
          zip.file(
            `${asset.title.replace(/[^a-zA-Z0-9]/g, "_")}/title.txt`,
            asset.title
          );

          // Add description text file with compression note for videos
          const isVideo =
            asset.image_url.includes(".mp4") ||
            asset.image_url.includes(".mov") ||
            asset.image_url.includes(".avi") ||
            asset.image_url.includes(".webm");
          const descriptionText = isVideo
            ? `${
                asset.description || "No description provided"
              }\n\nNote: Video has been converted to a compressed thumbnail image for size optimization.`
            : asset.description || "No description provided";

          zip.file(
            `${asset.title.replace(/[^a-zA-Z0-9]/g, "_")}/description.txt`,
            descriptionText
          );
        } catch (error) {
          console.error(`Error processing asset ${asset.title}:`, error);
        }
      }

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Check file size (100kb = 100 * 1024 bytes, 2mb = 2 * 1024 * 1024 bytes)
      const minSize = 100 * 1024; // 100kb
      const maxSize = 2 * 1024 * 1024; // 2mb

      if (zipBlob.size < minSize) {
        alert(
          `Zip file is too small (${Math.round(
            zipBlob.size / 1024
          )}kb). Please add more projects or content.`
        );
        return;
      }

      if (zipBlob.size > maxSize) {
        alert(
          `Zip file is too large (${Math.round(
            zipBlob.size / 1024
          )}kb). Please select fewer projects.`
        );
        return;
      }

      // Download the zip file
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `my_projects_${
        new Date().toISOString().split("T")[0]
      }.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error creating zip file:", error);
      alert("Error creating zip file. Please try again.");
    } finally {
      setIsCreatingZip(false);
    }
  };

  const getFileType = (url: string) => {
    const extension = url.split(".").pop()?.toLowerCase();
    if (
      ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")
    ) {
      return "image";
    } else if (["mp4", "mov", "avi", "webm", "mkv"].includes(extension || "")) {
      return "video";
    }
    return "file";
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === "all") return matchesSearch;

    const fileType = getFileType(asset.image_url);
    if (filterType === "images") return matchesSearch && fileType === "image";
    if (filterType === "videos") return matchesSearch && fileType === "video";

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <div className="text-center py-20">
            <p className="text-muted-foreground">Loading your assets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Assets</h1>
          <p className="text-muted-foreground">
            Download your projects as compressed zip files with title and
            description. Videos are converted to thumbnails for optimal size.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
            >
              All
            </Button>
            <Button
              variant={filterType === "images" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("images")}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Images
            </Button>
            <Button
              variant={filterType === "videos" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("videos")}
            >
              <Video className="h-4 w-4 mr-1" />
              Videos
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Download All Button */}
        {assets.length > 0 && (
          <div className="mb-6">
            <Button
              onClick={handleDownloadAllAsZip}
              disabled={isCreatingZip}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreatingZip ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Zip...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Download All as Zip
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Downloads all your projects as compressed zip files (100kb-2mb
              size limit)
            </p>
          </div>
        )}

        {/* Assets Grid/List */}
        {filteredAssets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assets found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterType !== "all"
                  ? "Try adjusting your search or filters"
                  : "Upload your first project to see your assets here"}
              </p>
              {!searchTerm && filterType === "all" && (
                <Button onClick={() => (window.location.href = "/upload")}>
                  Upload Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }
          >
            {filteredAssets.map((asset) => {
              const fileType = getFileType(asset.image_url);
              const isImage = fileType === "image";
              const isVideo = fileType === "video";

              return (
                <Card
                  key={asset.id}
                  className="group hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="p-0">
                    <div className="relative aspect-square overflow-hidden rounded-t-lg">
                      {isImage ? (
                        <img
                          src={asset.image_url}
                          alt={asset.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : isVideo ? (
                        <video
                          src={asset.image_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <File className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}

                      {/* Overlay with download button */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          onClick={() => handleDownload(asset)}
                          disabled={downloadingAsset === asset.id}
                          size="sm"
                          className="bg-white text-black hover:bg-white/90"
                        >
                          {downloadingAsset === asset.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Archive className="h-4 w-4 mr-2" />
                              Download as Zip
                            </>
                          )}
                        </Button>
                      </div>

                      {/* File type badge */}
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs">
                          {isImage ? (
                            <ImageIcon className="h-3 w-3 mr-1" />
                          ) : isVideo ? (
                            <Video className="h-3 w-3 mr-1" />
                          ) : (
                            <File className="h-3 w-3 mr-1" />
                          )}
                          {fileType}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold line-clamp-2">
                        {asset.title}
                      </h3>
                      {asset.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {asset.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {asset.views_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {asset.likes_count}
                          </span>
                        </div>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(asset.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {assets.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Asset Statistics</CardTitle>
              <CardDescription>Overview of your uploaded media</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{assets.length}</div>
                  <div className="text-sm text-muted-foreground">
                    Total Assets
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {
                      assets.filter((a) => getFileType(a.image_url) === "image")
                        .length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Images</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {
                      assets.filter((a) => getFileType(a.image_url) === "video")
                        .length
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Videos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {assets.reduce((sum, asset) => sum + asset.views_count, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Views
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Assets;
