import { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "@/components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  Eye,
  Heart,
  Users,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalProjects: 0,
    followers: 0,
    monthlyViews: [],
    categoryStats: [],
    engagementRate: 0,
    topProjects: [],
  });

  // Sample data for demonstration
  const monthlyData = useMemo(
    () => [
      { month: "Jan", views: 1200, likes: 85, projects: 3 },
      { month: "Feb", views: 1900, likes: 120, projects: 5 },
      { month: "Mar", views: 2800, likes: 200, projects: 7 },
      { month: "Apr", views: 3200, likes: 280, projects: 8 },
      { month: "May", views: 4100, likes: 350, projects: 10 },
      { month: "Jun", views: 3800, likes: 320, projects: 9 },
    ],
    []
  );

  const categoryData = useMemo(
    () => [
      { name: "UI/UX", value: 35, count: 12 },
      { name: "Graphic Design", value: 25, count: 8 },
      { name: "Photography", value: 20, count: 6 },
      { name: "Illustration", value: 15, count: 5 },
      { name: "3D Art", value: 5, count: 2 },
    ],
    []
  );

  const engagementData = useMemo(
    () => [
      { day: "Mon", engagement: 65 },
      { day: "Tue", engagement: 78 },
      { day: "Wed", engagement: 82 },
      { day: "Thu", engagement: 75 },
      { day: "Fri", engagement: 88 },
      { day: "Sat", engagement: 92 },
      { day: "Sun", engagement: 85 },
    ],
    []
  );

  const topProjectsData = useMemo(
    () => [
      { name: "Mobile App Design", views: 2500, likes: 180, engagement: 7.2 },
      { name: "Brand Identity", views: 1800, likes: 145, engagement: 8.1 },
      { name: "Website Redesign", views: 2200, likes: 165, engagement: 7.5 },
      { name: "Logo Collection", views: 1500, likes: 120, engagement: 8.0 },
    ],
    []
  );

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  const chartConfig = {
    views: {
      label: "Views",
      color: "hsl(var(--chart-1))",
    },
    likes: {
      label: "Likes",
      color: "hsl(var(--chart-2))",
    },
    projects: {
      label: "Projects",
      color: "hsl(var(--chart-3))",
    },
    engagement: {
      label: "Engagement %",
      color: "hsl(var(--chart-4))",
    },
  };

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load user's analytics data from Supabase
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Auth error:", authError);
        setLoading(false);
        return;
      }

      // Get user's projects with stats
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select(
          "id, title, views_count, likes_count, created_at, category_id, categories(name)"
        )
        .eq("user_id", user.id);

      if (projectsError) {
        console.error("Error loading projects:", projectsError);
        setLoading(false);
        return;
      }

      if (projects) {
        const totalViews = projects.reduce(
          (sum, project) => sum + project.views_count,
          0
        );
        const totalLikes = projects.reduce(
          (sum, project) => sum + project.likes_count,
          0
        );
        const totalProjects = projects.length;

        // Calculate engagement rate
        const engagementRate =
          totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;

        setAnalyticsData({
          totalViews,
          totalLikes,
          totalProjects,
          followers: 0, // This would come from a followers table
          monthlyViews: monthlyData,
          categoryStats: categoryData,
          engagementRate: Math.round(engagementRate * 10) / 10,
          topProjects: topProjectsData,
        });
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [monthlyData, categoryData, topProjectsData]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <div className="text-center py-20">
            <p className="text-muted-foreground">Loading analytics...</p>
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
          <h1 className="text-3xl font-bold mb-2">Analytics & Insights</h1>
          <p className="text-muted-foreground">
            Track your creative work performance and engagement metrics
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.totalViews.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                <ArrowUpRight className="inline h-3 w-3 text-green-500" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.totalLikes.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                <ArrowUpRight className="inline h-3 w-3 text-green-500" />
                +8% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.totalProjects}
              </div>
              <p className="text-xs text-muted-foreground">
                <ArrowUpRight className="inline h-3 w-3 text-green-500" />
                +2 this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Engagement Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.engagementRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                <ArrowUpRight className="inline h-3 w-3 text-green-500" />
                +1.2% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="projects">Top Projects</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Performance</CardTitle>
                  <CardDescription>
                    Views, likes, and projects over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="views" fill="var(--color-views)" />
                      <Bar dataKey="likes" fill="var(--color-likes)" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Trends</CardTitle>
                  <CardDescription>Daily engagement percentage</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <AreaChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="engagement"
                        stroke="var(--color-engagement)"
                        fill="var(--color-engagement)"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Analysis</CardTitle>
                <CardDescription>
                  Detailed engagement metrics and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <LineChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="engagement"
                      stroke="var(--color-engagement)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                  <CardDescription>
                    Your work across different categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                  <CardDescription>Project count by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryData.map((category, index) => (
                      <div
                        key={category.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <Badge variant="secondary">
                          {category.count} projects
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Projects</CardTitle>
                <CardDescription>
                  Your most successful projects by engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProjectsData.map((project, index) => (
                    <div
                      key={project.name}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{project.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {project.views.toLocaleString()} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {project.likes} likes
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {project.engagement}% engagement
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Engagement rate
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Analytics;
