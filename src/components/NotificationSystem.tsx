import React, { useState, useEffect } from "react";
import {
  Bell,
  X,
  Clock,
  User,
  Image,
  Sparkles,
  Palette,
  Camera,
  Code,
  Music,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
};

interface Notification {
  id: string;
  type: "project_upload";
  project: Project;
  timestamp: string;
  read: boolean;
}

export const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes("design") || name.includes("graphic")) return Palette;
    if (name.includes("photo") || name.includes("photography")) return Camera;
    if (name.includes("video") || name.includes("film")) return Video;
    if (name.includes("music") || name.includes("audio")) return Music;
    if (name.includes("code") || name.includes("development")) return Code;
    return Sparkles;
  };

  useEffect(() => {
    // Load existing notifications from localStorage
    const savedNotifications = localStorage.getItem("nexus_notifications");
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n: Notification) => !n.read).length);
      } catch (error) {
        console.error("Error parsing saved notifications:", error);
        localStorage.removeItem("nexus_notifications");
      }
    }

    // Check if user is authenticated before setting up real-time listener
    const setupRealtimeListener = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("User not authenticated, skipping real-time listener setup");
        return;
      }

      console.log("Setting up real-time listener for user:", user.id);

      // Set up real-time listener for new projects
      const channel = supabase
        .channel("projects", {
          config: {
            broadcast: { self: false },
            presence: { key: user.id },
          },
        })
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "projects",
            filter: `user_id=neq.${user.id}`, // Only notify for other users' projects
          },
          async (payload) => {
            console.log("New project detected:", payload);

            try {
              // Fetch the full project data with profile and category info
              const { data: projectData, error: fetchError } = await supabase
                .from("projects")
                .select(
                  `
                  *,
                  profiles(*),
                  categories(*)
                `
                )
                .eq("id", payload.new.id)
                .single();

              if (fetchError) {
                console.error("Error fetching project data:", fetchError);
                // Don't show error to user for notification failures
                return;
              }

              if (projectData) {
                const newNotification: Notification = {
                  id: `notification_${Date.now()}_${Math.random()}`,
                  type: "project_upload",
                  project: projectData,
                  timestamp: new Date().toISOString(),
                  read: false,
                };

                setNotifications((prev) => {
                  const updated = [newNotification, ...prev].slice(0, 50); // Keep only last 50 notifications
                  localStorage.setItem(
                    "nexus_notifications",
                    JSON.stringify(updated)
                  );
                  return updated;
                });

                setUnreadCount((prev) => prev + 1);

                // Show toast notification
                toast({
                  title: "New Project Uploaded!",
                  description: `${
                    projectData.profiles?.username || "Someone"
                  } uploaded "${projectData.title}"`,
                  duration: 5000,
                });

                // Show browser notification if permission is granted
                if (Notification.permission === "granted") {
                  new Notification("New Project on Nexus", {
                    body: `${
                      projectData.profiles?.username || "Someone"
                    } uploaded a new project: ${projectData.title}`,
                    icon: projectData.image_url || "/favicon.ico",
                  });
                }
              }
            } catch (error) {
              console.error("Error processing notification:", error);
            }
          }
        )
        .subscribe((status) => {
          console.log("Real-time subscription status:", status);
          if (status === "SUBSCRIBED") {
            console.log("Successfully subscribed to real-time updates");
          } else if (status === "CHANNEL_ERROR") {
            console.error("Real-time subscription error");
          }
        });

      return channel;
    };

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    let channel: any = null;
    setupRealtimeListener().then((ch) => {
      channel = ch;
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [toast]);

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      localStorage.setItem("nexus_notifications", JSON.stringify(updated));
      return updated;
    });
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem("nexus_notifications", JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(0);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem("nexus_notifications");
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor(
      (now.getTime() - notificationTime.getTime()) / 1000
    );

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Notifications
              </CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs h-7"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="text-xs h-7 text-muted-foreground"
                >
                  Clear all
                </Button>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No notifications yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll see new project uploads here
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notification.read
                          ? "bg-blue-50/50 border-l-2 border-l-blue-500"
                          : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 relative">
                          {notification.project.image_url ? (
                            <img
                              src={notification.project.image_url}
                              alt={notification.project.title}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <Image className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          {notification.project.categories && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                              {React.createElement(
                                getCategoryIcon(
                                  notification.project.categories.name
                                ),
                                {
                                  className:
                                    "h-2.5 w-2.5 text-primary-foreground",
                                }
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              {notification.project.profiles?.username ||
                                "Unknown User"}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>

                          <p className="text-sm text-foreground font-medium mb-1">
                            uploaded a new project
                          </p>

                          <p className="text-sm text-muted-foreground truncate mb-1">
                            {notification.project.title}
                          </p>

                          {notification.project.categories && (
                            <div className="flex items-center gap-1 mb-2">
                              <Badge
                                variant="secondary"
                                className="text-xs px-2 py-0.5"
                              >
                                {notification.project.categories.name}
                              </Badge>
                            </div>
                          )}

                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationSystem;
