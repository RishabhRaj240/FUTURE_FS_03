import { useState, useEffect } from "react";
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

  if (loading || !profile) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowCard(true)}
      onMouseLeave={() => setShowCard(false)}
    >
      {children}

      {showCard && (
        <Card className="absolute top-full right-0 mt-2 w-80 z-50 bg-white border border-gray-200 shadow-lg rounded-lg max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {/* Profile Section */}
            <div className="p-6 text-center border-b border-gray-100">
              <div className="flex justify-center mb-4">
                <Avatar className="h-16 w-16 border-2 border-gray-200">
                  <AvatarImage src={profile.avatar_url || ""} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg">
                    {profile.full_name?.[0] ||
                      profile.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {profile.full_name || profile.username}
              </h3>

              <p className="text-sm text-gray-500 mb-4">{profile.username}</p>

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
                Viewing as: Creative
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Switch to Hirer
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>

                <div className="cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
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
                <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                  <Settings className="h-4 w-4 text-gray-600" />
                  CreativeHub Profile
                </div>

                <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                  <Briefcase className="h-4 w-4 text-gray-600" />
                  Adobe Portfolio
                </div>

                <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                  Stats & Insights
                </div>

                <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                  <Briefcase className="h-4 w-4 text-gray-600" />
                  Manage Freelance Projects
                </div>

                <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                  <ShoppingBag className="h-4 w-4 text-gray-600" />
                  Purchases
                </div>

                <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
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
