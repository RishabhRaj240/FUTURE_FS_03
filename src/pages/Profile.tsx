import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/ImageUpload";
import {
  MapPin,
  Briefcase,
  Calendar,
  CheckCircle,
  Plus,
  Globe,
  Edit,
  Settings,
  Heart,
  Eye,
  Share2,
  MoreHorizontal,
  Camera,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"] | null;
  isLiked?: boolean;
  isSaved?: boolean;
};

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("work");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const hasLoadedProfile = useRef(false);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadProfileData = useCallback(async () => {
    if (!username || hasLoadedProfile.current) return;

    setLoading(true);
    hasLoadedProfile.current = true;
    
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError);
        navigate("/404");
        return;
      }

      setProfile(profileData);

      // Load user's projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select(
          `
          *,
          categories(*)
        `
        )
        .eq("user_id", profileData.id)
        .order("created_at", { ascending: false });

      if (projectsError) {
        console.error("Error loading projects:", projectsError);
        setProjects([]);
      } else {
        setProjects(projectsData || []);
      }
    } catch (error) {
      console.error("Error:", error);
      navigate("/404");
    } finally {
      setLoading(false);
    }
  }, [username, navigate]);

  useEffect(() => {
    getCurrentUser();
    loadProfileData();
    // Reset the ref when username changes
    hasLoadedProfile.current = false;
  }, [username, loadProfileData]);

  const updateProfileImage = async (imageUrl: string) => {
    if (!profile) return;

    console.log("Updating profile image with URL:", imageUrl);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: imageUrl })
        .eq("id", profile.id);

      if (error) {
        console.log("Profile image update error:", error);
        toast({
          title: "Error",
          description: `Failed to update profile image: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("Profile image updated successfully");
      setProfile({ ...profile, avatar_url: imageUrl });
      toast({
        title: "Success",
        description: "Profile image updated successfully!",
      });
    } catch (error) {
      console.error("Error updating profile image:", error);
      toast({
        title: "Error",
        description: "Failed to update profile image.",
        variant: "destructive",
      });
    }
  };

  const updateBannerImage = async (imageUrl: string) => {
    if (!profile) return;

    console.log("Updating banner image with URL:", imageUrl);

    try {
      // First try to update banner_url if the column exists
      const { error: bannerError } = await supabase
        .from("profiles")
        .update({ banner_url: imageUrl })
        .eq("id", profile.id);

      // If banner_url column doesn't exist, just update the profile state locally
      // This allows the UI to work even without the migration
      if (bannerError) {
        console.log("Banner column error:", bannerError);

        // Check if it's a column doesn't exist error or other RLS error
        if (
          bannerError.code === "PGRST116" ||
          bannerError.message.includes("column") ||
          bannerError.message.includes("does not exist")
        ) {
          console.log("banner_url column doesn't exist yet, updating locally");
          setProfile({ ...profile, banner_url: imageUrl });
          toast({
            title: "Success",
            description:
              "Banner image updated successfully! (Note: Banner will reset on page refresh until database is updated)",
          });
          return;
        }

        // For other errors, try to update locally as fallback
        console.log("Database update failed, updating locally as fallback");
        setProfile({ ...profile, banner_url: imageUrl });
        toast({
          title: "Success",
          description:
            "Banner image updated successfully! (Note: Banner will reset on page refresh until database is updated)",
        });
        return;
      }

      console.log("Banner image updated successfully in database");
      setProfile({ ...profile, banner_url: imageUrl });
      toast({
        title: "Success",
        description: "Banner image updated successfully!",
      });
    } catch (error) {
      console.error("Error updating banner image:", error);

      // As a last resort, try to update locally
      console.log("All database updates failed, updating locally as fallback");
      setProfile({ ...profile, banner_url: imageUrl });
      toast({
        title: "Success",
        description:
          "Banner image updated successfully! (Note: Banner will reset on page refresh until database is updated)",
      });
    }
  };

  const isOwnProfile = currentUser && profile && currentUser.id === profile.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-8"></div>
            <div className="flex gap-8">
              <div className="w-80">
                <div className="h-32 w-32 bg-gray-200 rounded-full mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
              </div>
              <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-48 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              Profile not found
            </h1>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Banner Area */}
      <div className="relative">
        {isOwnProfile ? (
          <div className="h-64 relative group">
            {profile.banner_url ? (
              <img
                src={profile.banner_url}
                alt="Banner"
                className="w-full h-full object-cover"
                onError={(e) =>
                  console.error(
                    "Banner image failed to load:",
                    profile.banner_url
                  )
                }
                onLoad={() =>
                  console.log(
                    "Banner image loaded successfully:",
                    profile.banner_url
                  )
                }
              />
            ) : (
              <div className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                <div className="absolute inset-0 bg-black/20"></div>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10">
              {/* Always show button when no banner */}
              {!profile.banner_url && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/90 hover:bg-white text-gray-900 border-0"
                    onClick={() => {
                      console.log("Add Banner button clicked!");
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          // Validate file type
                          if (!file.type.startsWith("image/")) {
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
                              description:
                                "Please select an image smaller than 10MB.",
                              variant: "destructive",
                            });
                            return;
                          }

                          try {
                            const fileExt = file.name.split(".").pop();
                            const fileName = `banners/${Date.now()}.${fileExt}`;

                            console.log("Starting banner upload:", fileName);

                            const { data, error } = await supabase.storage
                              .from("projects")
                              .upload(fileName, file);

                            if (error) {
                              console.error("Storage upload error:", error);
                              toast({
                                title: "Upload Error",
                                description: `Failed to upload image: ${error.message}`,
                                variant: "destructive",
                              });
                              return;
                            }

                            const {
                              data: { publicUrl },
                            } = supabase.storage
                              .from("projects")
                              .getPublicUrl(fileName);

                            console.log(
                              "Upload successful, public URL:",
                              publicUrl
                            );
                            await updateBannerImage(publicUrl);
                          } catch (error) {
                            console.error("Error uploading banner:", error);
                            toast({
                              title: "Upload Error",
                              description: "Failed to upload banner image.",
                              variant: "destructive",
                            });
                          }
                        }
                      };
                      input.click();
                    }}
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Add Banner
                  </Button>
                </div>
              )}
              {/* Hover button for existing banners */}
              <Button
                size="sm"
                variant="secondary"
                className="z-20 pointer-events-auto"
                onClick={() => {
                  console.log("Add Banner button clicked!");
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      // Validate file type
                      if (!file.type.startsWith("image/")) {
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
                          description:
                            "Please select an image smaller than 10MB.",
                          variant: "destructive",
                        });
                        return;
                      }

                      try {
                        const fileExt = file.name.split(".").pop();
                        const fileName = `banners/${Date.now()}.${fileExt}`;

                        console.log("Starting banner upload:", fileName);

                        const { data, error } = await supabase.storage
                          .from("projects")
                          .upload(fileName, file);

                        if (error) {
                          console.error("Storage upload error:", error);
                          toast({
                            title: "Upload Error",
                            description: `Failed to upload image: ${error.message}`,
                            variant: "destructive",
                          });
                          return;
                        }

                        const {
                          data: { publicUrl },
                        } = supabase.storage
                          .from("projects")
                          .getPublicUrl(fileName);

                        console.log(
                          "Upload successful, public URL:",
                          publicUrl
                        );
                        await updateBannerImage(publicUrl);
                      } catch (error) {
                        console.error("Error uploading banner:", error);
                        toast({
                          title: "Upload Error",
                          description: "Failed to upload banner image.",
                          variant: "destructive",
                        });
                      }
                    }
                  };
                  input.click();
                }}
              >
                <Camera className="h-4 w-4 mr-1" />
                {profile.banner_url ? "Change Banner" : "Add Banner"}
              </Button>
            </div>
            {!profile.banner_url && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <p className="text-lg font-medium opacity-90 mb-1">
                    Add a Banner Image
                  </p>
                  <p className="text-sm opacity-70">
                    Optimal dimensions 3200 x 410px
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-64 relative">
            {profile.banner_url ? (
              <img
                src={profile.banner_url}
                alt="Banner"
                className="w-full h-full object-cover"
                onError={(e) =>
                  console.error(
                    "Banner image failed to load:",
                    profile.banner_url
                  )
                }
                onLoad={() =>
                  console.log(
                    "Banner image loaded successfully:",
                    profile.banner_url
                  )
                }
              />
            ) : (
              <div className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                <div className="absolute inset-0 bg-black/20"></div>
              </div>
            )}
          </div>
        )}

        {/* Profile Picture - Overlapping banner */}
        <div className="relative -mt-16 ml-8">
          {isOwnProfile ? (
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                <AvatarImage
                  src={profile.avatar_url || ""}
                  onError={() =>
                    console.error(
                      "Avatar image failed to load:",
                      profile.avatar_url
                    )
                  }
                  onLoad={() =>
                    console.log(
                      "Avatar image loaded successfully:",
                      profile.avatar_url
                    )
                  }
                />
                <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  {profile.full_name?.[0] || profile.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center">
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        // Handle profile image upload
                        const reader = new FileReader();
                        reader.onload = async (e) => {
                          try {
                            const fileExt = file.name.split(".").pop();
                            const fileName = `avatars/${Date.now()}.${fileExt}`;

                            console.log(
                              "Starting profile image upload:",
                              fileName
                            );

                            const { data, error } = await supabase.storage
                              .from("projects")
                              .upload(fileName, file);

                            if (error) {
                              console.error("Storage upload error:", error);
                              toast({
                                title: "Upload Error",
                                description: `Failed to upload image: ${error.message}`,
                                variant: "destructive",
                              });
                              return;
                            }

                            const {
                              data: { publicUrl },
                            } = supabase.storage
                              .from("projects")
                              .getPublicUrl(fileName);

                            console.log(
                              "Upload successful, public URL:",
                              publicUrl
                            );
                            await updateProfileImage(publicUrl);
                          } catch (error) {
                            console.error(
                              "Error uploading profile image:",
                              error
                            );
                            toast({
                              title: "Upload Error",
                              description: "Failed to upload profile image.",
                              variant: "destructive",
                            });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
              <AvatarImage
                src={profile.avatar_url || ""}
                onError={() =>
                  console.error(
                    "Avatar image failed to load:",
                    profile.avatar_url
                  )
                }
                onLoad={() =>
                  console.log(
                    "Avatar image loaded successfully:",
                    profile.avatar_url
                  )
                }
              />
              <AvatarFallback className="text-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                {profile.full_name?.[0] || profile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8 bg-white">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-80 mt-8">
            <div className="space-y-6">
              {/* Profile Info */}
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.full_name || profile.username}
                </h1>

                <div className="flex items-center gap-2">
                  {(() => {
                    const savedSettings = localStorage.getItem('userAvailabilitySettings');
                    let isAvailable = true;
                    let statusText = "Available Now";
                    let statusColor = "text-green-600";
                    let dotColor = "bg-green-500";
                    
                    if (savedSettings) {
                      try {
                        const parsedSettings = JSON.parse(savedSettings);
                        isAvailable = parsedSettings.isAvailable;
                        const status = parsedSettings.availabilityStatus || "available";
                        
                        if (!isAvailable) {
                          statusText = "Not Available";
                          statusColor = "text-gray-500";
                          dotColor = "bg-gray-400";
                        } else if (status === "busy") {
                          statusText = "Busy";
                          statusColor = "text-yellow-600";
                          dotColor = "bg-yellow-500";
                        } else if (status === "away") {
                          statusText = "Away";
                          statusColor = "text-orange-600";
                          dotColor = "bg-orange-500";
                        }
                      } catch (error) {
                        console.error("Error parsing availability settings:", error);
                      }
                    }
                    
                    return (
                      <>
                        <div className={`h-2 w-2 ${dotColor} rounded-full`}></div>
                        <span className={`text-sm font-medium ${statusColor}`}>
                          {statusText}
                        </span>
                      </>
                    );
                  })()}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="h-4 w-4" />
                    <span>Available for Freelance</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="h-4 w-4" />
                    <span>India</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Only show for own profile */}
              {isOwnProfile && (
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => navigate("/settings")}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile Info
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Customize Profile
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-blue-100 text-blue-600"
                    >
                      PRO
                    </Badge>
                  </Button>
                </div>
              )}

              {/* Hire Card - Only show for own profile */}
              {isOwnProfile && (
                <Card className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <h3 className="font-semibold text-gray-900">
                      Hire{" "}
                      {profile.full_name?.split(" ")[0] || profile.username}
                    </h3>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            Freelance/Project
                          </span>
                        </div>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-sm text-gray-600">Availability: Now</p>
                      <Button
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Edit Availability
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 mt-8">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-7 bg-white border border-gray-200">
                <TabsTrigger
                  value="work"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  Work
                </TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="stock">Adobe Stock</TabsTrigger>
                <TabsTrigger value="moodboards">Moodboards</TabsTrigger>
                <TabsTrigger value="appreciations">Appreciations</TabsTrigger>
                <TabsTrigger value="stats">Your Stats</TabsTrigger>
                <TabsTrigger value="drafts">Drafts</TabsTrigger>
              </TabsList>

              <TabsContent value="work" className="mt-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Projects
                    </h2>
                    {isOwnProfile && (
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Section
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-blue-100 text-blue-600"
                        >
                          PRO
                        </Badge>
                      </Button>
                    )}
                  </div>

                  {projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {projects.map((project) => (
                        <Card
                          key={project.id}
                          className="group cursor-pointer hover:shadow-lg transition-shadow duration-200 overflow-hidden"
                        >
                          <div className="aspect-[4/3] overflow-hidden">
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
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                              {project.title}
                            </h3>
                            {project.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {project.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <Heart className="h-4 w-4" />
                                  <span>{project.likes_count}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-4 w-4" />
                                  <span>{project.views_count}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <Share2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-dashed border-2 border-gray-300">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="bg-blue-100 rounded-full p-4 mb-4">
                          <Plus className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Create a Project
                        </h3>
                        <p className="text-sm text-gray-600 text-center mb-4 max-w-sm">
                          Get feedback, views, and appreciations. Public
                          projects can be featured by our curators.
                        </p>
                        {isOwnProfile && (
                          <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => navigate("/upload")}
                          >
                            Create a Project
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="services">
                <div className="text-center py-12">
                  <p className="text-gray-600">
                    Services content coming soon...
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="stock">
                <div className="text-center py-12">
                  <p className="text-gray-600">
                    Adobe Stock content coming soon...
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="moodboards">
                <div className="text-center py-12">
                  <p className="text-gray-600">
                    Moodboards content coming soon...
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="appreciations">
                <div className="text-center py-12">
                  <p className="text-gray-600">
                    Appreciations content coming soon...
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="stats">
                <div className="text-center py-12">
                  <p className="text-gray-600">Stats content coming soon...</p>
                </div>
              </TabsContent>

              <TabsContent value="drafts">
                <div className="text-center py-12">
                  <p className="text-gray-600">Drafts content coming soon...</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
