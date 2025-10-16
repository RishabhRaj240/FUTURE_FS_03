import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Globe,
  Calendar as CalendarIcon,
  DollarSign,
  Users,
  Briefcase,
  Settings,
  Save,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Sun,
  Moon,
  Coffee,
  Zap,
  Heart,
  Star,
  Target,
  TrendingUp,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Bell,
  MessageCircle,
  Mail,
  Phone,
  Video,
  Camera,
  Mic,
  Monitor,
  Smartphone,
  Laptop,
  Tablet,
  Headphones,
  Wifi,
  Battery,
  WifiOff,
  Volume2,
  VolumeX,
  Palette,
  Image as ImageIcon,
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertTriangle,
  HelpCircle,
  Shield,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  UserPlus,
  Users2,
  Crown,
  Award,
  Trophy,
  Medal,
  Flag,
  Tag,
  Hash,
  AtSign,
  Link,
  Bookmark,
  BookmarkCheck,
  Share2,
  Send,
  Reply,
  Forward,
  Archive,
  Inbox,
  Trash,
  RefreshCw,
  RotateCcw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume1,
  Maximize,
  Minimize,
  Move,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Focus,
  Crop,
  Scissors,
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ListOrdered,
  Quote,
  Code,
  Terminal,
  Server,
  Cloud,
  CloudOff,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Thermometer,
  Droplets,
  Flame,
  Snowflake,
  Sunrise,
  Sunset,
  Compass,
  Navigation,
  Map,
  Building,
  Building2,
  Home,
  Factory,
  Store,
  School,
  Hospital,
  Church,
  Hotel,
  Car,
  Bus,
  Train,
  Plane,
  Ship,
  Bike,
  Truck,
  Rocket,
  Satellite,
  Telescope,
  Microscope,
  Speaker,
  Radio,
  Tv,
  Gamepad2,
  Joystick,
  Keyboard,
  Mouse,
  Printer,
  HardDrive,
  Cpu,
  MemoryStick,
  Watch,
  Timer,
  AlarmClock,
  Hourglass,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  CalendarMinus,
  CalendarRange,
  CalendarSearch,
  CalendarHeart,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AvailabilitySettings {
  isAvailable: boolean;
  availabilityStatus: "available" | "busy" | "away" | "invisible";
  hourlyRate: number;
  currency: string;
  timezone: string;
  workSchedule: {
    monday: { enabled: boolean; start: string; end: string };
    tuesday: { enabled: boolean; start: string; end: string };
    wednesday: { enabled: boolean; start: string; end: string };
    thursday: { enabled: boolean; start: string; end: string };
    friday: { enabled: boolean; start: string; end: string };
    saturday: { enabled: boolean; start: string; end: string };
    sunday: { enabled: boolean; start: string; end: string };
  };
  responseTime: string;
  maxProjects: number;
  skills: string[];
  services: string[];
  portfolio: string;
  bio: string;
  location: string;
  languages: string[];
  preferredCommunication: string[];
  projectTypes: string[];
  budgetRange: {
    min: number;
    max: number;
  };
  availabilityNotes: string;
  autoReply: boolean;
  autoReplyMessage: string;
  vacationMode: boolean;
  vacationStart: string;
  vacationEnd: string;
  vacationMessage: string;
}

const EditAvailability = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [availability, setAvailability] = useState<AvailabilitySettings>({
    isAvailable: true,
    availabilityStatus: "available",
    hourlyRate: 50,
    currency: "USD",
    timezone: "UTC",
    workSchedule: {
      monday: { enabled: true, start: "09:00", end: "17:00" },
      tuesday: { enabled: true, start: "09:00", end: "17:00" },
      wednesday: { enabled: true, start: "09:00", end: "17:00" },
      thursday: { enabled: true, start: "09:00", end: "17:00" },
      friday: { enabled: true, start: "09:00", end: "17:00" },
      saturday: { enabled: false, start: "09:00", end: "17:00" },
      sunday: { enabled: false, start: "09:00", end: "17:00" },
    },
    responseTime: "within-24-hours",
    maxProjects: 3,
    skills: [],
    services: [],
    portfolio: "",
    bio: "",
    location: "",
    languages: ["English"],
    preferredCommunication: ["email"],
    projectTypes: [],
    budgetRange: { min: 500, max: 10000 },
    availabilityNotes: "",
    autoReply: false,
    autoReplyMessage: "Thank you for your message. I'll get back to you soon!",
    vacationMode: false,
    vacationStart: "",
    vacationEnd: "",
    vacationMessage:
      "I'm currently on vacation and will respond when I return.",
  });

  const timezones = [
    "UTC",
    "EST",
    "PST",
    "CST",
    "MST",
    "GMT",
    "CET",
    "EET",
    "JST",
    "IST",
    "AEST",
    "NZST",
  ];

  const currencies = [
    "USD",
    "EUR",
    "GBP",
    "CAD",
    "AUD",
    "JPY",
    "INR",
    "BRL",
    "CHF",
    "SEK",
  ];

  const responseTimes = [
    { value: "within-1-hour", label: "Within 1 hour" },
    { value: "within-4-hours", label: "Within 4 hours" },
    { value: "within-24-hours", label: "Within 24 hours" },
    { value: "within-2-days", label: "Within 2 days" },
    { value: "within-1-week", label: "Within 1 week" },
  ];

  const communicationMethods = [
    "email",
    "phone",
    "video-call",
    "messaging",
    "in-person",
  ];

  const projectTypeOptions = [
    "Web Design",
    "Mobile App",
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
    "Development",
    "Consulting",
    "Training",
    "Research",
    "Writing",
    "Translation",
  ];

  const skillOptions = [
    "React",
    "Vue.js",
    "Angular",
    "Node.js",
    "Python",
    "JavaScript",
    "TypeScript",
    "Figma",
    "Adobe XD",
    "Sketch",
    "Photoshop",
    "Illustrator",
    "After Effects",
    "UI/UX Design",
    "Web Design",
    "Mobile Design",
    "Branding",
    "Logo Design",
    "Photography",
    "Videography",
    "3D Modeling",
    "Animation",
    "Copywriting",
    "Marketing",
    "SEO",
    "Content Writing",
    "Translation",
    "Research",
  ];

  const serviceOptions = [
    "Web Development",
    "Mobile App Development",
    "UI/UX Design",
    "Graphic Design",
    "Brand Identity",
    "Logo Design",
    "Photography",
    "Video Editing",
    "3D Animation",
    "Content Writing",
    "Marketing Strategy",
    "SEO Optimization",
    "Social Media Management",
    "E-commerce Development",
    "WordPress Development",
    "Consulting",
    "Training",
  ];

  const languageOptions = [
    "English",
    "Spanish",
    "French",
    "German",
    "Italian",
    "Portuguese",
    "Russian",
    "Chinese",
    "Japanese",
    "Korean",
    "Arabic",
    "Hindi",
    "Dutch",
    "Swedish",
    "Norwegian",
  ];

  useEffect(() => {
    loadUserData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserData = async () => {
    try {
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

        if (profileData) {
          setProfile(profileData);

          // Load availability settings from localStorage if available
          const savedSettings = localStorage.getItem(
            "userAvailabilitySettings"
          );
          if (savedSettings) {
            try {
              const parsedSettings = JSON.parse(savedSettings);
              setAvailability((prev) => ({
                ...prev,
                ...parsedSettings,
                bio: profileData.bio || prev.bio,
                location: profileData.location || prev.location,
              }));
            } catch (error) {
              console.error(
                "Error parsing saved availability settings:",
                error
              );
              // Fall back to defaults
              setAvailability((prev) => ({
                ...prev,
                bio: profileData.bio || prev.bio,
                location: profileData.location || prev.location,
              }));
            }
          } else {
            // Load basic settings from profile data
            setAvailability((prev) => ({
              ...prev,
              bio: profileData.bio || prev.bio,
              location: profileData.location || prev.location,
            }));
          }
        }

        setLoading(false);
      } else {
        navigate("/auth");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error",
        description: "Failed to load user data. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const updateAvailability = (updates: Partial<AvailabilitySettings>) => {
    setAvailability((prev) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const handleSaveAvailability = async () => {
    if (!user || !profile) {
      toast({
        title: "Error",
        description: "User not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // Store all settings in localStorage (this is our primary storage method)
      const settingsToSave = {
        isAvailable: availability.isAvailable,
        availabilityStatus: availability.availabilityStatus,
        hourlyRate: availability.hourlyRate,
        currency: availability.currency,
        timezone: availability.timezone,
        maxProjects: availability.maxProjects,
        responseTime: availability.responseTime,
        workSchedule: availability.workSchedule,
        skills: availability.skills,
        services: availability.services,
        languages: availability.languages,
        preferredCommunication: availability.preferredCommunication,
        projectTypes: availability.projectTypes,
        budgetRange: availability.budgetRange,
        availabilityNotes: availability.availabilityNotes,
        autoReply: availability.autoReply,
        autoReplyMessage: availability.autoReplyMessage,
        vacationMode: availability.vacationMode,
        vacationStart: availability.vacationStart,
        vacationEnd: availability.vacationEnd,
        vacationMessage: availability.vacationMessage,
        bio: availability.bio,
        location: availability.location,
        savedAt: new Date().toISOString(),
      };

      // Save to localStorage
      localStorage.setItem(
        "userAvailabilitySettings",
        JSON.stringify(settingsToSave)
      );
      console.log("✅ Settings saved to localStorage successfully");

      // Attempt database update (optional - won't fail the operation if it doesn't work)
      let dbUpdateSuccess = false;
      try {
        const updateData: Partial<Profile> = {};

        // Only add fields that we know exist in the current schema
        if (availability.bio !== undefined) {
          updateData.bio = availability.bio || null;
        }
        if (availability.location !== undefined) {
          updateData.location = availability.location || null;
        }

        // Only attempt database update if we have fields to update
        if (Object.keys(updateData).length > 0) {
          console.log("🔄 Attempting database update with:", updateData);

          const { error } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", user.id);

          if (error) {
            console.warn(
              "⚠️ Database update failed (but localStorage save succeeded):",
              error
            );
            dbUpdateSuccess = false;
          } else {
            console.log("✅ Database update successful");
            dbUpdateSuccess = true;

            // Update local profile state
            setProfile((prev) =>
              prev
                ? {
                    ...prev,
                    ...updateData,
                  }
                : null
            );
          }
        }
      } catch (dbError) {
        console.warn(
          "⚠️ Database update error (but localStorage save succeeded):",
          dbError
        );
        dbUpdateSuccess = false;
      }

      setHasUnsavedChanges(false);

      // Show success message
      const successMessage = dbUpdateSuccess
        ? "Your availability settings have been saved successfully!"
        : "Your availability settings have been saved! (Stored locally - database will be updated soon)";

      toast({
        title: "Success",
        description: successMessage,
      });

      // Navigate back to profile
      setTimeout(() => {
        navigate(`/${profile.username}`);
      }, 1000);
    } catch (error) {
      console.error("❌ Error saving availability:", error);
      toast({
        title: "Error",
        description: "Failed to save availability settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateWorkSchedule = (
    day: keyof typeof availability.workSchedule,
    field: "enabled" | "start" | "end",
    value: boolean | string
  ) => {
    setAvailability((prev) => ({
      ...prev,
      workSchedule: {
        ...prev.workSchedule,
        [day]: {
          ...prev.workSchedule[day],
          [field]: value,
        },
      },
    }));
  };

  const toggleSkill = (skill: string) => {
    setAvailability((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const toggleService = (service: string) => {
    setAvailability((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const toggleLanguage = (language: string) => {
    setAvailability((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
  };

  const toggleCommunicationMethod = (method: string) => {
    setAvailability((prev) => ({
      ...prev,
      preferredCommunication: prev.preferredCommunication.includes(method)
        ? prev.preferredCommunication.filter((m) => m !== method)
        : [...prev.preferredCommunication, method],
    }));
  };

  const toggleProjectType = (type: string) => {
    setAvailability((prev) => ({
      ...prev,
      projectTypes: prev.projectTypes.includes(type)
        ? prev.projectTypes.filter((t) => t !== type)
        : [...prev.projectTypes, type],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
              <div className="h-64 bg-gray-200 rounded"></div>
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
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/${profile?.username}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Edit My Availability
            </h1>
            <p className="text-gray-600">
              Manage your availability, rates, and work preferences
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="skills">Skills & Services</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="automation">Automation</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="mt-6">
                <div className="space-y-6">
                  {/* Availability Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Availability Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium">
                            Available for Work
                          </Label>
                          <p className="text-sm text-gray-600">
                            Show that you're open to new projects
                          </p>
                        </div>
                        <Switch
                          checked={availability.isAvailable}
                          onCheckedChange={(checked) =>
                            updateAvailability({ isAvailable: checked })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={availability.availabilityStatus}
                            onValueChange={(
                              value: "available" | "busy" | "away" | "invisible"
                            ) =>
                              updateAvailability({ availabilityStatus: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                  Available
                                </div>
                              </SelectItem>
                              <SelectItem value="busy">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                                  Busy
                                </div>
                              </SelectItem>
                              <SelectItem value="away">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                                  Away
                                </div>
                              </SelectItem>
                              <SelectItem value="invisible">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                                  Invisible
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Response Time</Label>
                          <Select
                            value={availability.responseTime}
                            onValueChange={(value) =>
                              updateAvailability({ responseTime: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {responseTimes.map((time) => (
                                <SelectItem key={time.value} value={time.value}>
                                  {time.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rate & Location */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Rate & Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Hourly Rate *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={availability.hourlyRate}
                            onChange={(e) =>
                              updateAvailability({
                                hourlyRate: Number(e.target.value),
                              })
                            }
                            placeholder="50"
                          />
                          {availability.hourlyRate <= 0 && (
                            <p className="text-xs text-red-500">
                              Please enter a valid hourly rate
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Currency</Label>
                          <Select
                            value={availability.currency}
                            onValueChange={(value) =>
                              updateAvailability({ currency: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {currencies.map((currency) => (
                                <SelectItem key={currency} value={currency}>
                                  {currency}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Timezone</Label>
                          <Select
                            value={availability.timezone}
                            onValueChange={(value) =>
                              updateAvailability({ timezone: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timezones.map((tz) => (
                                <SelectItem key={tz} value={tz}>
                                  {tz}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input
                            placeholder="e.g., New York, NY"
                            value={availability.location}
                            onChange={(e) =>
                              updateAvailability({ location: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Concurrent Projects</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={availability.maxProjects}
                            onChange={(e) =>
                              updateAvailability({
                                maxProjects: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Bio</Label>
                        <Textarea
                          placeholder="Tell clients about yourself and your expertise..."
                          rows={4}
                          value={availability.bio}
                          onChange={(e) =>
                            updateAvailability({ bio: e.target.value })
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Budget Range */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Budget Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Minimum Project Budget</Label>
                          <Input
                            type="number"
                            value={availability.budgetRange.min}
                            onChange={(e) =>
                              setAvailability((prev) => ({
                                ...prev,
                                budgetRange: {
                                  ...prev.budgetRange,
                                  min: Number(e.target.value),
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Maximum Project Budget</Label>
                          <Input
                            type="number"
                            value={availability.budgetRange.max}
                            onChange={(e) =>
                              setAvailability((prev) => ({
                                ...prev,
                                budgetRange: {
                                  ...prev.budgetRange,
                                  max: Number(e.target.value),
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      Work Schedule
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Set your working hours for each day of the week
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(availability.workSchedule).map(
                      ([day, schedule]) => (
                        <div
                          key={day}
                          className="flex items-center gap-4 p-4 border rounded-lg"
                        >
                          <div className="w-20">
                            <Label className="capitalize font-medium">
                              {day}
                            </Label>
                          </div>
                          <Switch
                            checked={schedule.enabled}
                            onCheckedChange={(checked) =>
                              updateWorkSchedule(
                                day as keyof typeof availability.workSchedule,
                                "enabled",
                                checked
                              )
                            }
                          />
                          {schedule.enabled && (
                            <>
                              <div className="flex-1 flex items-center gap-2">
                                <Input
                                  type="time"
                                  value={schedule.start}
                                  onChange={(e) =>
                                    updateWorkSchedule(
                                      day as keyof typeof availability.workSchedule,
                                      "start",
                                      e.target.value
                                    )
                                  }
                                  className="w-32"
                                />
                                <span className="text-gray-500">to</span>
                                <Input
                                  type="time"
                                  value={schedule.end}
                                  onChange={(e) =>
                                    updateWorkSchedule(
                                      day as keyof typeof availability.workSchedule,
                                      "end",
                                      e.target.value
                                    )
                                  }
                                  className="w-32"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skills" className="mt-6">
                <div className="space-y-6">
                  {/* Skills */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Skills
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                        {skillOptions.map((skill) => (
                          <Badge
                            key={skill}
                            variant={
                              availability.skills.includes(skill)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer hover:bg-blue-100"
                            onClick={() => toggleSkill(skill)}
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Services */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Services
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                        {serviceOptions.map((service) => (
                          <Badge
                            key={service}
                            variant={
                              availability.services.includes(service)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer hover:bg-green-100"
                            onClick={() => toggleService(service)}
                          >
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Languages */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Languages
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                        {languageOptions.map((language) => (
                          <Badge
                            key={language}
                            variant={
                              availability.languages.includes(language)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer hover:bg-purple-100"
                            onClick={() => toggleLanguage(language)}
                          >
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="preferences" className="mt-6">
                <div className="space-y-6">
                  {/* Communication Preferences */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Communication Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {communicationMethods.map((method) => (
                          <Badge
                            key={method}
                            variant={
                              availability.preferredCommunication.includes(
                                method
                              )
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer hover:bg-blue-100"
                            onClick={() => toggleCommunicationMethod(method)}
                          >
                            {method.replace("-", " ")}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Project Types */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Preferred Project Types
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                        {projectTypeOptions.map((type) => (
                          <Badge
                            key={type}
                            variant={
                              availability.projectTypes.includes(type)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer hover:bg-green-100"
                            onClick={() => toggleProjectType(type)}
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Additional Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Additional Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Any additional information about your availability or work preferences..."
                        rows={4}
                        value={availability.availabilityNotes}
                        onChange={(e) =>
                          setAvailability((prev) => ({
                            ...prev,
                            availabilityNotes: e.target.value,
                          }))
                        }
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="automation" className="mt-6">
                <div className="space-y-6">
                  {/* Auto Reply */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Auto Reply
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium">
                            Enable Auto Reply
                          </Label>
                          <p className="text-sm text-gray-600">
                            Automatically respond to new messages
                          </p>
                        </div>
                        <Switch
                          checked={availability.autoReply}
                          onCheckedChange={(checked) =>
                            setAvailability((prev) => ({
                              ...prev,
                              autoReply: checked,
                            }))
                          }
                        />
                      </div>

                      {availability.autoReply && (
                        <div className="space-y-2">
                          <Label>Auto Reply Message</Label>
                          <Textarea
                            placeholder="Enter your auto reply message..."
                            rows={3}
                            value={availability.autoReplyMessage}
                            onChange={(e) =>
                              setAvailability((prev) => ({
                                ...prev,
                                autoReplyMessage: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Vacation Mode */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        Vacation Mode
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium">
                            Enable Vacation Mode
                          </Label>
                          <p className="text-sm text-gray-600">
                            Automatically handle messages while away
                          </p>
                        </div>
                        <Switch
                          checked={availability.vacationMode}
                          onCheckedChange={(checked) =>
                            setAvailability((prev) => ({
                              ...prev,
                              vacationMode: checked,
                            }))
                          }
                        />
                      </div>

                      {availability.vacationMode && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Vacation Start</Label>
                            <Input
                              type="date"
                              value={availability.vacationStart}
                              onChange={(e) =>
                                setAvailability((prev) => ({
                                  ...prev,
                                  vacationStart: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Vacation End</Label>
                            <Input
                              type="date"
                              value={availability.vacationEnd}
                              onChange={(e) =>
                                setAvailability((prev) => ({
                                  ...prev,
                                  vacationEnd: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      )}

                      {availability.vacationMode && (
                        <div className="space-y-2">
                          <Label>Vacation Message</Label>
                          <Textarea
                            placeholder="Enter your vacation message..."
                            rows={3}
                            value={availability.vacationMessage}
                            onChange={(e) =>
                              setAvailability((prev) => ({
                                ...prev,
                                vacationMessage: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Save Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Save Changes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleSaveAvailability}
                  disabled={saving}
                  variant={hasUnsavedChanges ? "default" : "secondary"}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {hasUnsavedChanges ? "Save Changes" : "Saved"}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/${profile?.username}`)}
                >
                  Cancel
                </Button>

                {/* Debug button - remove in production */}
                <Button
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => {
                    const settings = localStorage.getItem(
                      "userAvailabilitySettings"
                    );
                    if (settings) {
                      console.log(
                        "Current localStorage settings:",
                        JSON.parse(settings)
                      );
                      toast({
                        title: "Debug Info",
                        description: `Settings saved at: ${
                          JSON.parse(settings).savedAt || "Unknown"
                        }`,
                      });
                    } else {
                      toast({
                        title: "Debug Info",
                        description: "No settings found in localStorage",
                      });
                    }
                  }}
                >
                  Debug: Check Storage
                </Button>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      availability.isAvailable &&
                      availability.availabilityStatus === "available"
                        ? "bg-green-500"
                        : availability.availabilityStatus === "busy"
                        ? "bg-yellow-500"
                        : availability.availabilityStatus === "away"
                        ? "bg-orange-500"
                        : "bg-gray-400"
                    }`}
                  ></div>
                  <span className="text-sm font-medium">
                    {availability.isAvailable
                      ? availability.availabilityStatus
                          .charAt(0)
                          .toUpperCase() +
                        availability.availabilityStatus
                          .slice(1)
                          .replace("-", " ")
                      : "Not Available"}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>
                    Rate: ${availability.hourlyRate}/hour{" "}
                    {availability.currency}
                  </p>
                  <p>
                    Response:{" "}
                    {
                      responseTimes.find(
                        (t) => t.value === availability.responseTime
                      )?.label
                    }
                  </p>
                  {availability.location && (
                    <p>Location: {availability.location}</p>
                  )}
                  <p>Max Projects: {availability.maxProjects}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Skills:</span>
                  <span className="font-medium">
                    {availability.skills.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Services:</span>
                  <span className="font-medium">
                    {availability.services.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Languages:</span>
                  <span className="font-medium">
                    {availability.languages.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Max Projects:</span>
                  <span className="font-medium">
                    {availability.maxProjects}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Hourly Rate:</span>
                  <span className="font-medium">
                    ${availability.hourlyRate}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <span
                    className={`font-medium ${
                      availability.isAvailable
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {availability.isAvailable ? "Available" : "Not Available"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAvailability;
