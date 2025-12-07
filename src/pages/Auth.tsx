import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(
    searchParams.get("mode") === "signup"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error(
          "Backend not configured. Please check your environment variables."
        );
      }

      if (isSignUp) {
        // Validate required fields
        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }

        if (username && username.length < 3) {
          throw new Error("Username must be at least 3 characters long");
        }

        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: username || email.split("@")[0],
              full_name: fullName,
            },
          },
        });

        if (error) {
          // Handle specific Supabase errors
          if (error.message.includes("fetch")) {
            throw new Error(
              "Unable to connect to the server. Please check your internet connection and try again."
            );
          }
          throw error;
        }

        // Wait a moment for the trigger to create the profile
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Check if profile was created, if not create it manually
        if (signUpData.user) {
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", signUpData.user.id)
            .single();

          if (!existingProfile) {
            // Create profile manually if trigger failed
            const { error: profileError } = await supabase
              .from("profiles")
              .insert({
                id: signUpData.user.id,
                username: username || email.split("@")[0],
                full_name: fullName,
              });

            if (profileError) {
              console.warn("Failed to create profile manually:", profileError);
            }
          }
        }

        toast({
          title: "Success!",
          description:
            "Account created successfully. Please check your email to verify.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Handle specific Supabase errors
          if (error.message.includes("fetch") || error.message.includes("Failed to fetch")) {
            throw new Error(
              "Unable to connect to the server. Please check your internet connection and Supabase configuration."
            );
          }
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Invalid email or password. Please try again.");
          }
          throw error;
        }

        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        navigate("/");
      }
    } catch (error: unknown) {
      console.error("Auth error:", error);

      // Provide more specific error messages
      let errorMessage = "An error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Network/connection errors
        if (
          error.message.includes("fetch") ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("network")
        ) {
          errorMessage =
            "Unable to connect to the server. Please check:\n" +
            "1. Your internet connection\n" +
            "2. Supabase environment variables are set correctly\n" +
            "3. The Supabase service is running";
        } else if (error.message.includes("Database error")) {
          errorMessage =
            "There was an issue creating your profile. Please try again.";
        } else if (error.message.includes("duplicate key")) {
          errorMessage =
            "Username already exists. Please choose a different username.";
        } else if (error.message.includes("email")) {
          errorMessage =
            "Invalid email address. Please check your email format.";
        } else if (error.message.includes("password")) {
          errorMessage = "Password must be at least 6 characters long.";
        } else if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (error.message.includes("Backend not configured")) {
          errorMessage =
            "Backend configuration is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.";
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            {isSignUp ? "Create an account" : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Sign up to start sharing your creative work"
              : "Sign in to your account to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name (optional)</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
