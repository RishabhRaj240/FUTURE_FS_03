import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const EnvTest = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Environment Variables Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p>
          <strong>Supabase URL:</strong> {supabaseUrl}
        </p>
        <p>
          <strong>Project ID:</strong> {projectId}
        </p>
        <p>
          <strong>Key (first 20 chars):</strong> {supabaseKey?.substring(0, 20)}
          ...
        </p>
        <p>
          <strong>All variables loaded:</strong>{" "}
          {supabaseUrl && supabaseKey && projectId ? "YES" : "NO"}
        </p>
      </CardContent>
    </Card>
  );
};
