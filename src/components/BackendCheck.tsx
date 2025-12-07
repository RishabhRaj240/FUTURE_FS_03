import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkSupabaseConnection, isSupabaseConfigured } from "@/integrations/supabase/client";

export const BackendCheck = () => {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const checkBackend = async () => {
    setIsChecking(true);
    try {
      // Check environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // First check if env vars are set
      if (!isSupabaseConfigured()) {
        setIsConfigured(false);
        
        // Provide specific error message
        if (!supabaseUrl && !supabaseKey) {
          setErrorMessage(
            "Environment variables are not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your .env file and restart the dev server."
          );
        } else if (!supabaseUrl) {
          setErrorMessage(
            "VITE_SUPABASE_URL is missing. Please add it to your .env file and restart the dev server."
          );
        } else if (!supabaseKey) {
          setErrorMessage(
            "VITE_SUPABASE_PUBLISHABLE_KEY is missing. Please add it to your .env file and restart the dev server."
          );
        } else {
          setErrorMessage("Environment variables are not properly configured.");
        }
        
        setIsChecking(false);
        return;
      }

      // Try to connect to Supabase
      const connected = await checkSupabaseConnection();
      setIsConfigured(connected);
      
      if (!connected) {
        setErrorMessage(
          "Unable to connect to Supabase. Please verify:\n" +
          "1. Your Supabase project is active\n" +
          "2. Your credentials are correct\n" +
          "3. Your network connection is working\n" +
          "4. Check the browser console for detailed error messages"
        );
      }
    } catch (error) {
      console.error("Backend check error:", error);
      setIsConfigured(false);
      
      if (error instanceof Error) {
        if (error.message.includes("fetch") || error.message.includes("Failed to fetch")) {
          setErrorMessage(
            "Network error: Unable to reach Supabase servers. Please check your internet connection and verify your Supabase URL is correct."
          );
        } else {
          setErrorMessage(`Connection error: ${error.message}`);
        }
      } else {
        setErrorMessage("Unknown error occurred while checking backend connection.");
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  if (isChecking || isConfigured === true) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <Alert variant="destructive" className="shadow-lg border-2">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="font-semibold text-base">
          Backend Connection Failed
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p className="text-sm">
            {errorMessage || "The application cannot connect to the backend. This usually means your Supabase environment variables are not set."}
          </p>
          <div className="bg-destructive/10 p-3 rounded-md space-y-2 border border-destructive/20">
            <p className="font-medium text-sm">Quick Fix Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>
                Create a <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">.env</code> file in the root directory
              </li>
              <li>
                Add your Supabase credentials:
                <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto border">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-key-here`}
                </pre>
              </li>
              <li>
                Get your credentials from{" "}
                <a
                  href="https://app.supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline inline-flex items-center gap-1 hover:text-primary/80"
                >
                  Supabase Dashboard
                  <ExternalLink className="h-3 w-3" />
                </a>{" "}
                (Settings → API)
              </li>
              <li>Restart your development server after creating/updating the .env file</li>
            </ol>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkBackend}
              disabled={isChecking}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`} />
              {isChecking ? "Checking..." : "Retry Connection"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open("https://app.supabase.com", "_blank");
              }}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-3 w-3" />
              Open Supabase Dashboard
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

