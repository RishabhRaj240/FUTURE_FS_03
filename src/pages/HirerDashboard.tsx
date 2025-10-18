import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Briefcase,
  TrendingUp,
  Eye,
  MessageCircle,
  Calendar,
  Award,
  Target,
  Zap,
  Building2,
  Globe,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  MoreHorizontal,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Crown,
  BarChart3,
  FileText,
  Image as ImageIcon,
  Video,
  Code,
  Palette,
  Camera,
  Music,
  Gamepad2,
  Layers,
  PenTool,
  Type,
  Brush,
  Globe as GlobeIcon,
  Smartphone,
  Building,
  Home,
  Scissors,
  BookOpen,
  Target as TargetIcon,
  Monitor,
  Heart,
  Share2,
  Download,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Settings,
  Bell,
  UserPlus,
  Send,
  ThumbsUp,
  MessageSquare,
  Flag,
  Bookmark,
  Tag,
  Hash,
  Grid,
  List,
  SlidersHorizontal,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"] | null;
};

interface HirerProject {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: "draft" | "published" | "in-progress" | "completed" | "cancelled";
  category: string;
  skills_required: string[];
  proposals_count: number;
  created_at: string;
  deadline: string;
  client_id: string;
  client: Profile;
}

// Mock data for demonstration
const mockProjects: HirerProject[] = [
  {
    id: "1",
    title: "Modern Website Redesign",
    description:
      "Looking for a talented designer to redesign our company website with modern UI/UX principles.",
    budget: 5000,
    status: "published",
    category: "Web Design",
    skills_required: ["UI/UX", "Figma", "React", "Responsive Design"],
    proposals_count: 12,
    created_at: "2024-01-15",
    deadline: "2024-02-15",
    client_id: "1",
    client: {
      id: "1",
      full_name: "John Smith",
      username: "johnsmith",
      avatar_url: "",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      banner_url: "",
      bio: "",
      location: "",
      website: "",
      is_available: true,
      hourly_rate: 0,
      followers_count: 0,
      following_count: 0,
      instagram: "",
      linkedin: "",
      twitter: "",
    },
  },
  {
    id: "2",
    title: "Mobile App UI Design",
    description:
      "Need a creative designer to create beautiful mobile app interfaces for our fitness tracking app.",
    budget: 3000,
    status: "in-progress",
    category: "Mobile Design",
    skills_required: ["Mobile Design", "iOS", "Android", "Prototyping"],
    proposals_count: 8,
    created_at: "2024-01-10",
    deadline: "2024-02-10",
    client_id: "2",
    client: {
      id: "2",
      full_name: "Sarah Johnson",
      username: "sarahj",
      avatar_url: "",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      banner_url: "",
      bio: "",
      location: "",
      website: "",
      is_available: true,
      hourly_rate: 0,
      followers_count: 0,
      following_count: 0,
      instagram: "",
      linkedin: "",
      twitter: "",
    },
  },
  {
    id: "3",
    title: "Brand Identity Package",
    description:
      "Complete brand identity design including logo, business cards, and brand guidelines.",
    budget: 2500,
    status: "completed",
    category: "Branding",
    skills_required: [
      "Logo Design",
      "Branding",
      "Illustration",
      "Print Design",
    ],
    proposals_count: 15,
    created_at: "2024-01-05",
    deadline: "2024-01-25",
    client_id: "3",
    client: {
      id: "3",
      full_name: "Mike Chen",
      username: "mikechen",
      avatar_url: "",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      banner_url: "",
      bio: "",
      location: "",
      website: "",
      is_available: true,
      hourly_rate: 0,
      followers_count: 0,
      following_count: 0,
      instagram: "",
      linkedin: "",
      twitter: "",
    },
  },
];

const HirerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<HirerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    budget: 0,
    category: "",
    skills_required: [] as string[],
    deadline: "",
  });

  const mockStats = {
    totalProjects: 12,
    activeProjects: 5,
    completedProjects: 7,
    totalBudget: 45000,
    avgProjectValue: 3750,
    proposalsReceived: 89,
    avgResponseTime: "2.3 days",
    clientSatisfaction: 4.8,
  };

  const categories = [
    "Web Design",
    "Mobile Design",
    "Branding",
    "UI/UX",
    "Graphic Design",
    "Illustration",
    "Photography",
    "Video Production",
    "3D Modeling",
    "Animation",
    "Copywriting",
    "Marketing",
  ];

  const skills = [
    "UI/UX",
    "Figma",
    "React",
    "Responsive Design",
    "Mobile Design",
    "iOS",
    "Android",
    "Prototyping",
    "Logo Design",
    "Branding",
    "Illustration",
    "Print Design",
    "Photoshop",
    "Illustrator",
    "Sketch",
    "Adobe XD",
    "InVision",
    "Principle",
    "Framer",
    "Webflow",
    "HTML",
    "CSS",
    "JavaScript",
    "Vue.js",
    "Angular",
    "Node.js",
    "Python",
    "WordPress",
    "Shopify",
    "Photography",
    "Videography",
    "After Effects",
    "Premiere Pro",
    "Cinema 4D",
    "Blender",
    "Maya",
    "3ds Max",
    "ZBrush",
    "Substance",
    "Unity",
    "Unreal Engine",
  ];

  const loadUserData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profileData);
    } else {
      navigate("/auth");
    }
  }, [navigate]);

  useEffect(() => {
    loadUserData();
    setProjects(mockProjects);
    setLoading(false);
  }, [loadUserData]);

  const handleCreateProject = async () => {
    if (!newProject.title || !newProject.description || !newProject.budget) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically save to database
    const project: HirerProject = {
      id: Date.now().toString(),
      ...newProject,
      status: "draft",
      proposals_count: 0,
      created_at: new Date().toISOString(),
      deadline:
        newProject.deadline ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      client_id: user?.id || "",
      client: profile!,
    };

    setProjects([project, ...projects]);
    setShowCreateProject(false);
    setNewProject({
      title: "",
      description: "",
      budget: 0,
      category: "",
      skills_required: [],
      deadline: "",
    });

    toast({
      title: "Success",
      description: "Project created successfully!",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle className="h-4 w-4" />;
      case "in-progress":
        return <Play className="h-4 w-4" />;
      case "completed":
        return <Award className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Pause className="h-4 w-4" />;
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hirer Dashboard
            </h1>
            <p className="text-gray-600">
              Manage your projects and find talented freelancers
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="hidden md:flex"
            >
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Creative Mode
            </Button>
            <Dialog
              open={showCreateProject}
              onOpenChange={setShowCreateProject}
            >
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Project Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter project title"
                      value={newProject.title}
                      onChange={(e) =>
                        setNewProject({ ...newProject, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your project requirements"
                      rows={4}
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget ($) *</Label>
                      <Input
                        id="budget"
                        type="number"
                        placeholder="5000"
                        value={newProject.budget}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            budget: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Deadline</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={newProject.deadline}
                        onChange={(e) =>
                          setNewProject({
                            ...newProject,
                            deadline: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newProject.category}
                      onValueChange={(value) =>
                        setNewProject({ ...newProject, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Required Skills</Label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
                      {skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant={
                            newProject.skills_required.includes(skill)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => {
                            const skills = newProject.skills_required.includes(
                              skill
                            )
                              ? newProject.skills_required.filter(
                                  (s) => s !== skill
                                )
                              : [...newProject.skills_required, skill];
                            setNewProject({
                              ...newProject,
                              skills_required: skills,
                            });
                          }}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateProject(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateProject}>
                      Create Project
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Projects
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockStats.totalProjects}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Projects
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockStats.activeProjects}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Budget
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${mockStats.totalBudget.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Proposals</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockStats.proposalsReceived}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="proposals">Proposals</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        type: "proposal",
                        message:
                          "New proposal received for 'Modern Website Redesign'",
                        time: "2 hours ago",
                        icon: MessageCircle,
                      },
                      {
                        type: "project",
                        message: "Project 'Brand Identity Package' completed",
                        time: "1 day ago",
                        icon: CheckCircle,
                      },
                      {
                        type: "message",
                        message: "Message from Sarah Johnson",
                        time: "2 days ago",
                        icon: Mail,
                      },
                      {
                        type: "proposal",
                        message:
                          "Proposal submitted for 'Mobile App UI Design'",
                        time: "3 days ago",
                        icon: Users,
                      },
                    ].map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <activity.icon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Project
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Freelancers
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    View Messages
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            {/* Projects Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {project.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(project.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(project.status)}
                              {project.status.replace("-", " ")}
                            </span>
                          </Badge>
                          <Badge variant="outline">{project.category}</Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {project.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />$
                          {project.budget.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {project.proposals_count} proposals
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(project.deadline).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.skills_required.slice(0, 3).map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {project.skills_required.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{project.skills_required.length - 3} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Messages
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="proposals" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Proposals</CardTitle>
                <p className="text-sm text-gray-600">
                  Review and manage project proposals
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No proposals yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Proposals will appear here once freelancers start applying
                    to your projects.
                  </p>
                  <Button onClick={() => setActiveTab("projects")}>
                    View Projects
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <p className="text-sm text-gray-600">
                  Communicate with freelancers
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No messages yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start conversations with freelancers about your projects.
                  </p>
                  <Button onClick={() => setActiveTab("projects")}>
                    View Projects
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Completed Projects</span>
                        <span>
                          {mockStats.completedProjects}/
                          {mockStats.totalProjects}
                        </span>
                      </div>
                      <Progress
                        value={
                          (mockStats.completedProjects /
                            mockStats.totalProjects) *
                          100
                        }
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Active Projects</span>
                        <span>
                          {mockStats.activeProjects}/{mockStats.totalProjects}
                        </span>
                      </div>
                      <Progress
                        value={
                          (mockStats.activeProjects / mockStats.totalProjects) *
                          100
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Budget
                      </span>
                      <span className="font-semibold">
                        ${mockStats.totalBudget.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Average Project Value
                      </span>
                      <span className="font-semibold">
                        ${mockStats.avgProjectValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Proposals Received
                      </span>
                      <span className="font-semibold">
                        {mockStats.proposalsReceived}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HirerDashboard;
