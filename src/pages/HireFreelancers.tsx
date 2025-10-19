import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  MapPin,
  Globe,
  Mail,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Star,
  Filter,
  Plus,
  CheckCircle,
  Circle,
  Link,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"] | null;
};

interface FreelancerProfile extends Profile {
  projects: Project[];
  projectCount: number;
}

const HireFreelancers = () => {
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [filteredFreelancers, setFilteredFreelancers] = useState<
    FreelancerProfile[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("all");
  const [selectedFreelancer, setSelectedFreelancer] =
    useState<FreelancerProfile | null>(null);

  // Sample services for demo
  const services = [
    "Logo Design",
    "Branding Services",
    "Website Design",
    "UI/UX Design",
    "Stationery Design",
    "Book Design",
    "Album Cover Design",
    "Poster Design",
    "Photography",
    "Illustration",
    "3D Art",
    "Motion Graphics",
  ];

  useEffect(() => {
    loadFreelancers();
  }, []);

  const loadFreelancers = async () => {
    try {
      setLoading(true);

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
        return;
      }

      // Fetch projects for each profile
      const freelancersWithProjects: FreelancerProfile[] = [];

      for (const profile of profiles || []) {
        const { data: projects } = await supabase
          .from("projects")
          .select(
            `
            *,
            categories(*)
          `
          )
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(6);

        freelancersWithProjects.push({
          ...profile,
          projects: projects || [],
          projectCount: projects?.length || 0,
        });
      }

      setFreelancers(freelancersWithProjects);
    } catch (error) {
      console.error("Error loading freelancers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterFreelancers = useCallback(() => {
    let filtered = freelancers;

    if (searchTerm) {
      filtered = filtered.filter(
        (freelancer) =>
          freelancer.full_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          freelancer.username
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          freelancer.bio?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedService !== "all") {
      filtered = filtered.filter((freelancer) =>
        freelancer.projects.some((project) =>
          project.categories?.name
            .toLowerCase()
            .includes(selectedService.toLowerCase())
        )
      );
    }

    if (selectedLocation !== "all") {
      filtered = filtered.filter((freelancer) =>
        freelancer.location
          ?.toLowerCase()
          .includes(selectedLocation.toLowerCase())
      );
    }

    if (selectedAvailability !== "all") {
      if (selectedAvailability === "available") {
        filtered = filtered.filter((freelancer) => freelancer.is_available);
      } else if (selectedAvailability === "busy") {
        filtered = filtered.filter((freelancer) => !freelancer.is_available);
      }
    }

    setFilteredFreelancers(filtered);
  }, [
    freelancers,
    searchTerm,
    selectedService,
    selectedLocation,
    selectedAvailability,
  ]);

  useEffect(() => {
    filterFreelancers();
  }, [filterFreelancers]);

  const getServiceBadges = (projects: Project[]) => {
    const categories = [
      ...new Set(projects.map((p) => p.categories?.name).filter(Boolean)),
    ];
    return categories.slice(0, 5);
  };

  const getUniqueLocations = () => {
    const locations = freelancers
      .map((f) => f.location)
      .filter(Boolean)
      .filter((location, index, self) => self.indexOf(location) === index);
    return locations;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hire Freelancers
          </h1>
          <p className="text-gray-600">
            Find talented creatives for your next project
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search freelancers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service
              </label>
              <Select
                value={selectedService}
                onValueChange={setSelectedService}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <Select
                value={selectedLocation}
                onValueChange={setSelectedLocation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {getUniqueLocations().map((location) => (
                    <SelectItem key={location} value={location || ""}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <Select
                value={selectedAvailability}
                onValueChange={setSelectedAvailability}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="available">Available Now</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Freelancers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredFreelancers.map((freelancer) => (
              <Card
                key={freelancer.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={freelancer.avatar_url || undefined}
                          alt={freelancer.full_name || freelancer.username}
                        />
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                          {freelancer.full_name?.[0] ||
                            freelancer.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-lg">
                            {freelancer.full_name || freelancer.username}
                          </h3>
                          {freelancer.website && (
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          )}
                        </div>

                        <div className="flex items-center text-gray-600 text-sm mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          {freelancer.location || "Location not specified"}
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {freelancer.is_available ? (
                              <Circle className="h-3 w-3 text-green-500 fill-current mr-1" />
                            ) : (
                              <Circle className="h-3 w-3 text-gray-400 mr-1" />
                            )}
                            <span
                              className={`text-sm ${
                                freelancer.is_available
                                  ? "text-green-600"
                                  : "text-gray-500"
                              }`}
                            >
                              {freelancer.is_available
                                ? "Available now"
                                : "Busy"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {getServiceBadges(freelancer.projects).map(
                        (service, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {service}
                          </Badge>
                        )
                      )}
                      {freelancer.projects.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{freelancer.projects.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Portfolio Carousel */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Work</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View All →
                      </Button>
                    </div>

                    {freelancer.projects.length > 0 ? (
                      <div className="relative">
                        <div className="flex space-x-3 overflow-x-auto pb-2">
                          {freelancer.projects.slice(0, 4).map((project) => (
                            <div key={project.id} className="flex-shrink-0">
                              <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                                <img
                                  src={project.image_url}
                                  alt={project.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 text-sm">
                          No projects yet
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      {freelancer.projectCount} Projects completed on Nexus
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                    >
                      Read Reviews →
                    </Button>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setSelectedFreelancer(freelancer)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Inquiry
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredFreelancers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">
              No freelancers found
            </div>
            <p className="text-gray-400">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* Freelancer Detail Modal */}
      <Dialog
        open={!!selectedFreelancer}
        onOpenChange={() => setSelectedFreelancer(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedFreelancer && (
            <>
              <DialogHeader>
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={selectedFreelancer.avatar_url || undefined}
                      alt={
                        selectedFreelancer.full_name ||
                        selectedFreelancer.username
                      }
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-xl">
                      {selectedFreelancer.full_name?.[0] ||
                        selectedFreelancer.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-bold">
                      {selectedFreelancer.full_name ||
                        selectedFreelancer.username}
                    </DialogTitle>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {selectedFreelancer.location ||
                          "Location not specified"}
                      </div>
                      <div className="flex items-center">
                        {selectedFreelancer.is_available ? (
                          <Circle className="h-3 w-3 text-green-500 fill-current mr-1" />
                        ) : (
                          <Circle className="h-3 w-3 text-gray-400 mr-1" />
                        )}
                        <span
                          className={`text-sm ${
                            selectedFreelancer.is_available
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          {selectedFreelancer.is_available
                            ? "Available now"
                            : "Busy"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Bio */}
                {selectedFreelancer.bio && (
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-gray-700">{selectedFreelancer.bio}</p>
                  </div>
                )}

                {/* Services */}
                <div>
                  <h3 className="font-semibold mb-3">Services</h3>
                  <div className="flex flex-wrap gap-2">
                    {getServiceBadges(selectedFreelancer.projects).map(
                      (service, index) => (
                        <Badge key={index} variant="outline">
                          {service}
                        </Badge>
                      )
                    )}
                  </div>
                </div>

                {/* Portfolio */}
                <div>
                  <h3 className="font-semibold mb-3">Portfolio</h3>
                  {selectedFreelancer.projects.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedFreelancer.projects.map((project) => (
                        <div
                          key={project.id}
                          className="aspect-square bg-gray-200 rounded-lg overflow-hidden"
                        >
                          <img
                            src={project.image_url}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No projects available</p>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    {selectedFreelancer.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <a
                          href={selectedFreelancer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {selectedFreelancer.website}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Send inquiry through Nexus
                      </span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    // Here you would implement the inquiry functionality
                    console.log(
                      "Send inquiry to:",
                      selectedFreelancer.username
                    );
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Inquiry
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HireFreelancers;
