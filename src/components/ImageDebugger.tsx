import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const ImageDebugger = () => {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const testUpload = async () => {
    setLoading(true);
    try {
      // Create a simple test image (1x1 pixel PNG)
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx!.fillStyle = '#ff0000';
      ctx!.fillRect(0, 0, 1, 1);
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], 'test.png', { type: 'image/png' });
        const fileName = `test/${Date.now()}.png`;
        
        console.log('Uploading test image:', fileName);
        
        const { data, error } = await supabase.storage
          .from('projects')
          .upload(fileName, file);

        if (error) {
          console.error('Upload error:', error);
          toast({
            title: "Upload Error",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('projects')
          .getPublicUrl(fileName);

        console.log('Upload successful, public URL:', publicUrl);
        
        setUploadedImages(prev => [...prev, publicUrl]);
        
        toast({
          title: "Success",
          description: "Test image uploaded successfully!",
        });
      });
    } catch (error) {
      console.error('Test upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload test image.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testBucketAccess = async () => {
    try {
      console.log('Testing bucket access...');
      
      const { data, error } = await supabase.storage
        .from('projects')
        .list('', { limit: 10 });

      if (error) {
        console.error('Bucket access error:', error);
        toast({
          title: "Bucket Access Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('Bucket contents:', data);
        toast({
          title: "Bucket Access Success",
          description: `Found ${data?.length || 0} items in bucket`,
        });
      }
    } catch (error) {
      console.error('Bucket test error:', error);
      toast({
        title: "Error",
        description: "Failed to test bucket access.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Image Upload Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button onClick={testUpload} disabled={loading}>
            {loading ? "Uploading..." : "Upload Test Image"}
          </Button>
          <Button onClick={testBucketAccess} variant="outline">
            Test Bucket Access
          </Button>
        </div>
        
        {uploadedImages.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Uploaded Images:</h3>
            {uploadedImages.map((url, index) => (
              <div key={index} className="border rounded p-2">
                <p className="text-sm text-gray-600 mb-2">URL: {url}</p>
                <img 
                  src={url} 
                  alt={`Test ${index + 1}`}
                  className="border"
                  onLoad={() => console.log(`Image ${index + 1} loaded successfully`)}
                  onError={() => console.error(`Image ${index + 1} failed to load`)}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
