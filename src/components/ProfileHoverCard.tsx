import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  ArrowRight,
  Settings,
  BarChart3,
  Briefcase,
  ShoppingBag,
  Crown,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ProfileHoverCardProps {
  userId: string;
  children: React.ReactNode;
}

export const ProfileHoverCard = ({
  userId,
  children,
}: ProfileHoverCardProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCard, setShowCard] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    // Clear any existing leave timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    // Set hover delay before showing the card
    hoverTimeoutRef.current = setTimeout(() => {
      setShowCard(true);
      // Small delay for smooth transition
      setTimeout(() => setIsVisible(true), 10);
    }, 500); // 500ms delay before showing
  };

  const handleMouseLeave = () => {
    // Clear any existing hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Start fade out transition
    setIsVisible(false);
    
    // Hide the card after transition completes
    leaveTimeoutRef.current = setTimeout(() => {
      setShowCard(false);
    }, 400); // 400ms delay before hiding
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "You have been signed out successfully.",
        });
        navigate("/auth");
      }
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    // Close the dropdown after navigation
    setIsVisible(false);
    setTimeout(() => setShowCard(false), 200);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  if (loading || !profile) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {showCard && (
        <Card 
          className={`absolute top-full right-0 mt-3 w-80 z-50 bg-white border border-gray-200 shadow-lg rounded-lg max-h-96 overflow-y-auto transition-all duration-500 ease-in-out ${
            isVisible 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 -translate-y-2 scale-95'
          }`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <CardContent className="p-0">
            {/* Profile Section */}
            <div className="p-6 text-center border-b border-gray-100">
              <div className="flex justify-center mb-4">
                <Avatar 
                  className="h-16 w-16 border-2 border-gray-200 cursor-pointer hover:ring-4 hover:ring-blue-200 transition-all duration-200"
                  onClick={() => navigate(`/${profile.username}`)}
                >
                  <AvatarImage src={profile.avatar_url || ""} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg">
                    {profile.full_name?.[0] ||
                      profile.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <h3 
                className="text-lg font-semibold text-gray-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors duration-200"
                onClick={() => navigate(`/${profile.username}`)}
              >
                {profile.full_name || profile.username}
              </h3>

              <p 
                className="text-sm text-gray-500 mb-4 cursor-pointer hover:text-blue-600 transition-colors duration-200"
                onClick={() => navigate(`/${profile.username}`)}
              >
                {profile.username}
              </p>

              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to PRO
                <Badge
                  variant="secondary"
                  className="ml-2 bg-white/20 text-white border-white/30"
                >
                  PRO
                </Badge>
              </Button>
            </div>

            {/* Account Status Section */}
            <div className="p-4 border-b border-gray-100">
              <div className="text-xs text-gray-500 mb-3">
                {(() => {
                  const savedSettings = localStorage.getItem('userAvailabilitySettings');
                  let statusText = "Available for Work";
                  let statusColor = "text-green-600";
                  
                  if (savedSettings) {
                    try {
                      const parsedSettings = JSON.parse(savedSettings);
                      const isAvailable = parsedSettings.isAvailable;
                      const status = parsedSettings.availabilityStatus || "available";
                      
                      if (!isAvailable) {
                        statusText = "Not Available";
                        statusColor = "text-gray-500";
                      } else if (status === "busy") {
                        statusText = "Busy";
                        statusColor = "text-yellow-600";
                      } else if (status === "away") {
                        statusText = "Away";
                        statusColor = "text-orange-600";
                      }
                    } catch (error) {
                      console.error("Error parsing availability settings:", error);
                    }
                  }
                  
                  return (
                    <div className={`${statusColor} font-medium`}>
                      Status: {statusText}
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-3">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                  onClick={() => handleMenuClick("/hirer-dashboard")}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Switch to Hirer
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>

                <div 
                  className="cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                  onClick={() => handleMenuClick("/edit-availability")}
                >
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    Edit My Availability
                  </div>
                  <div className="text-xs text-gray-500">
                    Freelance (Available now)
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Links Section */}
            <div className="p-2">
              <div className="space-y-1">
                <div 
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                  onClick={() => handleMenuClick(`/${profile.username}`)}
                >
                  <Settings className="h-4 w-4 text-gray-600" />
                  CreativeHub Profile
                </div>

                <div 
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                  onClick={() => window.open("https://portfolio.adobe.com", "_blank")}
                >
                  <Briefcase className="h-4 w-4 text-gray-600" />
                  Adobe Portfolio
                </div>

                <div 
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                  onClick={() => handleMenuClick("/analytics")}
                >
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                  Stats & Insights
                </div>

                <div 
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                  onClick={() => handleMenuClick("/freelance")}
                >
                  <Briefcase className="h-4 w-4 text-gray-600" />
                  Manage Freelance Projects
                </div>

                <div 
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                  onClick={() => handleMenuClick("/purchases")}
                >
                  <ShoppingBag className="h-4 w-4 text-gray-600" />
                  Purchases
                </div>

                <div 
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                  onClick={() => handleMenuClick("/settings")}
                >
                  <Settings className="h-4 w-4 text-gray-600" />
                  Settings
                </div>

                <div className="border-t border-gray-100 my-2"></div>

                <div
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  Sign Out
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
