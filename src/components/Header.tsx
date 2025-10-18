import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileHoverCard } from "@/components/ProfileHoverCard";
import { EnhancedSearch } from "@/components/EnhancedSearch";
import { Bell, Upload, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    setProfile(profileData);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      {/* Top bar */}
      <div className="container px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="text-[22px] font-extrabold tracking-tight text-foreground hover:text-primary transition-all duration-200 cursor-pointer select-none hover:scale-105 active:scale-95"
              title="Go to Home"
            >
              CreativeHub
            </Link>
            <nav className="hidden lg:flex items-center gap-6">
              <Link to="/" className="text-sm font-semibold text-foreground">
                Explore
              </Link>
              <Link
                to="/jobs"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Find Jobs
              </Link>
              <Link
                to="/freelance"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                My Freelance Work
              </Link>
              <Link
                to="/hire-freelancers"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Hire Freelancers
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button
                  onClick={() => navigate("/upload")}
                  className="hidden md:flex gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Share Your Work
                </Button>
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <ProfileHoverCard userId={user.id}>
                  <Link
                    to={profile?.username ? `/${profile.username}` : "/profile"}
                  >
                    <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 ring-primary transition-all">
                      <AvatarImage
                        src={
                          profile?.avatar_url || user.user_metadata?.avatar_url
                        }
                      />
                      <AvatarFallback>
                        {profile?.full_name?.[0] ||
                          profile?.username?.[0] ||
                          user.email?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </ProfileHoverCard>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Log In
                </Button>
                <Button onClick={() => navigate("/auth?mode=signup")}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search + filter row */}
        <div className="flex items-center gap-3 pb-3">
          <EnhancedSearch />
          <div className="hidden md:flex items-center gap-2 rounded-full border px-1 py-1 bg-white">
            <Button 
              variant={location.pathname === "/" ? "default" : "ghost"}
              className={`rounded-full px-4 h-8 ${
                location.pathname === "/" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => navigate("/")}
            >
              Projects
            </Button>
            <Button
              variant={location.pathname === "/assets" ? "default" : "ghost"}
              className={`rounded-full px-4 h-8 ${
                location.pathname === "/assets" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => navigate("/assets")}
            >
              Assets
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
