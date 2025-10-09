import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Download, 
  Eye, 
  Star, 
  Calendar, 
  DollarSign, 
  Search,
  Filter,
  Grid3X3,
  List,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  ExternalLink,
  Heart,
  Share2,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Purchase = {
  id: string;
  title: string;
  type: 'template' | 'asset' | 'course' | 'tool' | 'resource';
  category: string;
  seller: string;
  sellerAvatar?: string;
  price: number;
  purchaseDate: string;
  status: 'completed' | 'pending' | 'refunded' | 'cancelled';
  rating: number;
  downloads: number;
  description: string;
  thumbnail: string;
  files: {
    name: string;
    size: string;
    type: string;
    url: string;
  }[];
  tags: string[];
  license: 'personal' | 'commercial' | 'extended';
  expiresAt?: string;
};

const Purchases = () => {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();

  // Sample purchases data
  const samplePurchases: Purchase[] = [
    {
      id: "1",
      title: "Modern UI Kit - Figma Templates",
      type: "template",
      category: "UI/UX",
      seller: "DesignStudio Pro",
      sellerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      price: 49,
      purchaseDate: "2024-01-15",
      status: "completed",
      rating: 4.8,
      downloads: 3,
      description: "Complete UI kit with 50+ modern components for web and mobile design",
      thumbnail: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=300&fit=crop",
      files: [
        { name: "UI-Kit.fig", size: "12.5 MB", type: "Figma", url: "#" },
        { name: "Components.pdf", size: "2.1 MB", type: "PDF", url: "#" },
        { name: "Icons.zip", size: "5.3 MB", type: "ZIP", url: "#" }
      ],
      tags: ["Figma", "UI Kit", "Components", "Modern"],
      license: "commercial",
      expiresAt: "2025-01-15"
    },
    {
      id: "2",
      title: "Premium Stock Photos Bundle",
      type: "asset",
      category: "Photography",
      seller: "PhotoMaster",
      sellerAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
      price: 29,
      purchaseDate: "2024-01-10",
      status: "completed",
      rating: 4.9,
      downloads: 15,
      description: "High-quality stock photos for business and creative projects",
      thumbnail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
      files: [
        { name: "Business-Photos.zip", size: "245 MB", type: "ZIP", url: "#" },
        { name: "License.pdf", size: "0.5 MB", type: "PDF", url: "#" }
      ],
      tags: ["Stock Photos", "Business", "High Quality", "Commercial"],
      license: "commercial"
    },
    {
      id: "3",
      title: "Advanced Photoshop Course",
      type: "course",
      category: "Education",
      seller: "Creative Academy",
      sellerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      price: 99,
      purchaseDate: "2024-01-05",
      status: "completed",
      rating: 4.7,
      downloads: 1,
      description: "Master advanced Photoshop techniques with 20+ video lessons",
      thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
      files: [
        { name: "Course-Videos.zip", size: "2.1 GB", type: "ZIP", url: "#" },
        { name: "Course-Materials.pdf", size: "15.2 MB", type: "PDF", url: "#" },
        { name: "Practice-Files.zip", size: "89.3 MB", type: "ZIP", url: "#" }
      ],
      tags: ["Photoshop", "Course", "Video", "Tutorial"],
      license: "personal",
      expiresAt: "2025-01-05"
    },
    {
      id: "4",
      title: "Icon Pack - Business & Finance",
      type: "asset",
      category: "Icons",
      seller: "IconCraft",
      sellerAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
      price: 19,
      purchaseDate: "2023-12-20",
      status: "completed",
      rating: 4.6,
      downloads: 8,
      description: "Professional icon set for business and finance applications",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
      files: [
        { name: "Icons-SVG.zip", size: "8.7 MB", type: "ZIP", url: "#" },
        { name: "Icons-PNG.zip", size: "12.3 MB", type: "ZIP", url: "#" },
        { name: "Icon-Font.ttf", size: "1.2 MB", type: "TTF", url: "#" }
      ],
      tags: ["Icons", "Business", "SVG", "PNG"],
      license: "commercial"
    },
    {
      id: "5",
      title: "Web Development Toolkit",
      type: "tool",
      category: "Development",
      seller: "DevTools Pro",
      sellerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
      price: 79,
      purchaseDate: "2023-12-15",
      status: "completed",
      rating: 4.9,
      downloads: 2,
      description: "Complete toolkit for modern web development with React components",
      thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop",
      files: [
        { name: "React-Components.zip", size: "45.6 MB", type: "ZIP", url: "#" },
        { name: "Documentation.pdf", size: "8.9 MB", type: "PDF", url: "#" },
        { name: "Examples.zip", size: "23.1 MB", type: "ZIP", url: "#" }
      ],
      tags: ["React", "Components", "Web Dev", "Toolkit"],
      license: "commercial"
    },
    {
      id: "6",
      title: "Design System Documentation",
      type: "resource",
      category: "Documentation",
      seller: "Design Systems Co",
      sellerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      price: 39,
      purchaseDate: "2023-12-10",
      status: "completed",
      rating: 4.8,
      downloads: 1,
      description: "Comprehensive guide to building and maintaining design systems",
      thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop",
      files: [
        { name: "Design-System-Guide.pdf", size: "25.7 MB", type: "PDF", url: "#" },
        { name: "Templates.zip", size: "12.4 MB", type: "ZIP", url: "#" }
      ],
      tags: ["Design System", "Documentation", "Guide", "Templates"],
      license: "personal"
    }
  ];

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      // In a real app, this would load from a purchases table
      setPurchases(samplePurchases);
    } catch (error) {
      console.error("Error loading purchases:", error);
      toast({
        title: "Error",
        description: "Failed to load purchases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'template': return <FileText className="h-4 w-4" />;
      case 'asset': return <Image className="h-4 w-4" />;
      case 'course': return <Video className="h-4 w-4" />;
      case 'tool': return <Archive className="h-4 w-4" />;
      case 'resource': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'refunded': return <AlertCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getLicenseColor = (license: string) => {
    switch (license) {
      case 'commercial': return 'bg-blue-100 text-blue-800';
      case 'extended': return 'bg-purple-100 text-purple-800';
      case 'personal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         purchase.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         purchase.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === "all" || purchase.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getPurchaseStats = () => {
    const total = purchases.length;
    const totalSpent = purchases.reduce((sum, p) => sum + p.price, 0);
    const completed = purchases.filter(p => p.status === 'completed').length;
    const totalDownloads = purchases.reduce((sum, p) => sum + p.downloads, 0);
    
    return { total, totalSpent, completed, totalDownloads };
  };

  const stats = getPurchaseStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <div className="text-center py-20">
            <p className="text-muted-foreground">Loading purchases...</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Purchases</h1>
              <p className="text-muted-foreground">
                View and manage your purchased templates, assets, and resources
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Items purchased
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalSpent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                All time spending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">
                Successful purchases
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDownloads}</div>
              <p className="text-xs text-muted-foreground">
                Total downloads
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search purchases, sellers, or tags..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-input rounded-md bg-background"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="template">Templates</option>
            <option value="asset">Assets</option>
            <option value="course">Courses</option>
            <option value="tool">Tools</option>
            <option value="resource">Resources</option>
          </select>
        </div>

        {/* Purchases Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPurchases.map((purchase) => (
              <Card key={purchase.id} className="hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={purchase.thumbnail}
                    alt={purchase.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge className={getStatusColor(purchase.status)}>
                      {getStatusIcon(purchase.status)}
                      <span className="ml-1 capitalize">{purchase.status}</span>
                    </Badge>
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {getTypeIcon(purchase.type)}
                      <span className="capitalize">{purchase.type}</span>
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={purchase.sellerAvatar} />
                        <AvatarFallback>{purchase.seller[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg line-clamp-1">{purchase.title}</CardTitle>
                        <CardDescription>{purchase.seller}</CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {purchase.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{purchase.rating}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {purchase.downloads} downloads
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge className={getLicenseColor(purchase.license)}>
                      {purchase.license} license
                    </Badge>
                    <div className="text-lg font-bold">${purchase.price}</div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {purchase.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {purchase.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{purchase.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm text-muted-foreground">
                      Purchased {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPurchases.map((purchase) => (
              <Card key={purchase.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={purchase.thumbnail}
                      alt={purchase.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold line-clamp-1">{purchase.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={purchase.sellerAvatar} />
                              <AvatarFallback>{purchase.seller[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{purchase.seller}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(purchase.status)}>
                            {getStatusIcon(purchase.status)}
                            <span className="ml-1 capitalize">{purchase.status}</span>
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {purchase.description}
                      </p>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {getTypeIcon(purchase.type)}
                            <span className="capitalize">{purchase.type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{purchase.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            <span>{purchase.downloads}</span>
                          </div>
                          <Badge className={getLicenseColor(purchase.license)}>
                            {purchase.license}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-lg font-bold">${purchase.price}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(purchase.purchaseDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredPurchases.length === 0 && (
          <div className="text-center py-20">
            <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No purchases found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || typeFilter !== "all" 
                ? "Try adjusting your search or filters"
                : "Start exploring and purchasing creative assets"
              }
            </p>
            <Button>
              <ExternalLink className="h-4 w-4 mr-2" />
              Browse Marketplace
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Purchases;
