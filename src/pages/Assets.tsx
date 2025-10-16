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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

const Assets = () => {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<"all" | "images" | "videos">(
    "all"
  );

  useEffect(() => {
    loadAssets();
  }, []);

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
    try {
      // Extract filename from URL
      const urlParts = asset.image_url.split("/");
      const fileName = urlParts[urlParts.length - 1];

      // Create a temporary link to download the file
      const response = await fetch(asset.image_url);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${asset.title}_${fileName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading asset:", error);
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
            Download and manage your uploaded media files
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
                          size="sm"
                          className="bg-white text-black hover:bg-white/90"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
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
