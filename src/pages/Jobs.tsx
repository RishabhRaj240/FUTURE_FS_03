import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Clock,
  Star,
  Filter,
  Plus,
  CheckCircle,
  Flag,
  Bookmark,
  ExternalLink,
  Building2,
  Briefcase,
  Calendar,
  DollarSign,
  Users,
  Globe,
  ChevronDown,
  X,
  Heart,
  Share2,
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  type: string;
  postedDate: string;
  description: string;
  requirements: string[];
  benefits: string[];
  salary?: string;
  isRemote: boolean;
  isVerified: boolean;
  category: string;
}

// Sample job data based on the images
const sampleJobs: Job[] = [
  {
    id: "1",
    title: "Graphic Designer",
    company: "LeaderInPrint, Inc.",
    companyLogo:
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&crop=center",
    location: "West Palm Beach, FL, USA",
    type: "Fulltime",
    postedDate: "22 days ago",
    description:
      "A Palm Beach based printing and marketing company is seeking a creative, detail-oriented Graphic Designer to join our growing team.",
    requirements: [
      "Proficiency in Adobe Creative Suite (InDesign, Illustrator, and Photoshop required)",
      "Strong understanding of print production and layout design",
      "Experience creating marketing materials for real estate or professional services (a plus)",
      "Creativity, attention to detail, and the ability to adapt designs to different client styles",
      "Ability to work independently and as part of a collaborative team",
    ],
    benefits: [
      "Opportunity to design for some of the top real estate professionals in South Florida",
      "Be part of a creative, fast-paced, and supportive team environment",
    ],
    isRemote: false,
    isVerified: false,
    category: "Design",
  },
  {
    id: "2",
    title: "Staff Designer, Premium Enablement",
    company: "Adobe",
    companyLogo:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Adobe_Systems_logo_and_wordmark.svg/1200px-Adobe_Systems_logo_and_wordmark.svg.png",
    location: "New York, NY, USA",
    type: "Fulltime",
    postedDate: "5 days ago",
    description: "Looking for a strong product designer on our Express team!",
    requirements: [
      "5+ years of product design experience",
      "Strong portfolio showcasing user-centered design",
      "Experience with design systems and component libraries",
      "Proficiency in Figma and Adobe Creative Suite",
    ],
    benefits: [
      "Competitive salary and equity",
      "Comprehensive health benefits",
      "Flexible work arrangements",
    ],
    isRemote: true,
    isVerified: true,
    category: "Design",
  },
  {
    id: "3",
    title: "Spring Content Editor Intern",
    company: "Big Loud Rock",
    companyLogo:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop&crop=center",
    location: "Santa Monica, CA, USA",
    type: "Internship",
    postedDate: "12 days ago",
    description: "Video Content Editing Spring Internship (Record Label)",
    requirements: [
      "Experience with video editing software (Premiere Pro, Final Cut Pro)",
      "Understanding of music industry and content creation",
      "Strong attention to detail and creative vision",
      "Ability to work in a fast-paced environment",
    ],
    benefits: [
      "Hands-on experience in music industry",
      "Mentorship from industry professionals",
      "Portfolio building opportunities",
    ],
    isRemote: false,
    isVerified: false,
    category: "Media",
  },
  {
    id: "4",
    title: "Spring Graphic Design Intern",
    company: "Big Loud Rock",
    companyLogo:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop&crop=center",
    location: "Santa Monica, CA, USA",
    type: "Internship",
    postedDate: "12 days ago",
    description: "Spring Graphic Design Internship @ Rock Music Label",
    requirements: [
      "Proficiency in Adobe Creative Suite",
      "Understanding of music branding and visual identity",
      "Creative portfolio demonstrating design skills",
      "Passion for music and entertainment industry",
    ],
    benefits: [
      "Real-world design projects",
      "Industry networking opportunities",
      "Creative freedom and mentorship",
    ],
    isRemote: false,
    isVerified: false,
    category: "Design",
  },
];

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    setJobs(sampleJobs);
    setFilteredJobs(sampleJobs);
  }, []);

  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((job) => job.category === selectedCategory);
    }

    if (selectedLocation !== "all") {
      filtered = filtered.filter((job) =>
        job.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, selectedCategory, selectedLocation]);

  const toggleSavedJob = (jobId: string) => {
    const newSavedJobs = new Set(savedJobs);
    if (newSavedJobs.has(jobId)) {
      newSavedJobs.delete(jobId);
    } else {
      newSavedJobs.add(jobId);
    }
    setSavedJobs(newSavedJobs);
  };

  const categories = [
    "Logo",
    "Branding",
    "Social",
    "Website",
    "Illustration",
    "Packaging",
    "Landing Page",
    "UI/UX",
    "Architecture",
  ];
  const locations = [
    "New York, NY, USA",
    "West Palm Beach, FL, USA",
    "Santa Monica, CA, USA",
    "Frisco, TX, USA",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <div className="w-80 bg-white rounded-lg shadow-sm border p-6 h-fit sticky top-24">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label
                      key={category}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="category"
                        value={category}
                        checked={selectedCategory === category}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="text-primary"
                      />
                      <span className="text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                  <button className="text-sm text-primary hover:underline">
                    View All
                  </button>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-lg mb-4">Location</h3>
                <Select
                  value={selectedLocation}
                  onValueChange={setSelectedLocation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search jobs, companies, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
            </div>

            {/* Job Listings */}
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Company Logo/Avatar */}
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={job.companyLogo}
                            alt={`${job.company} logo`}
                          />
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                            {job.company[0]}
                          </AvatarFallback>
                        </Avatar>

                        {/* Job Info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-lg">
                              {job.company}
                            </h3>
                            {job.isVerified && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>

                          <div className="flex items-center text-gray-600 text-sm mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {job.location}
                          </div>

                          <h2 className="font-bold text-xl mb-2">
                            {job.title}
                          </h2>
                          <p className="text-gray-700 mb-3">
                            {job.description}
                          </p>

                          <div className="flex items-center text-gray-500 text-sm">
                            <Clock className="h-4 w-4 mr-1" />
                            {job.postedDate}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                          onClick={() => setSelectedJob(job)}
                        >
                          Apply
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center space-x-2"
                          onClick={() => toggleSavedJob(job.id)}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              savedJobs.has(job.id)
                                ? "fill-yellow-400 text-yellow-400"
                                : ""
                            }`}
                          />
                          <span>Save</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Job Detail Modal */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={selectedJob.companyLogo}
                      alt={`${selectedJob.company} logo`}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-xl">
                      {selectedJob.company[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-2xl font-bold">
                      {selectedJob.title}
                    </DialogTitle>
                    <p className="text-lg text-gray-600">
                      {selectedJob.company} – {selectedJob.location}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2"
                    onClick={() => toggleSavedJob(selectedJob.id)}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        savedJobs.has(selectedJob.id)
                          ? "fill-yellow-400 text-yellow-400"
                          : ""
                      }`}
                    />
                    <span>Save</span>
                  </Button>
                </div>

                {/* Job Details Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold">
                      Now Hiring: {selectedJob.title} - Print & Branding
                      Specialist
                    </h3>
                    <p className="text-gray-700">{selectedJob.description}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <span className="text-xs text-gray-500 uppercase">
                        JOB TYPE
                      </span>
                      <p className="font-semibold">{selectedJob.type}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase">
                        JOB LOCATION
                      </span>
                      <p className="font-semibold">{selectedJob.location}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase">
                        ON SITE REQUIRED
                      </span>
                      <p className="font-semibold">
                        {selectedJob.isRemote ? "Remote" : "Onsite Required"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase">
                        JOB POSTED
                      </span>
                      <p className="font-semibold">{selectedJob.postedDate}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Report
                    </Button>
                  </div>
                </div>

                {/* Job Description Sections */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-lg mb-3">What You'll Do:</h4>
                    <ul className="space-y-2">
                      {selectedJob.requirements.map((req, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-lg mb-3">
                      What We're Looking For:
                    </h4>
                    <ul className="space-y-2">
                      {selectedJob.requirements.map((req, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-lg mb-3">
                      Why Work With Us:
                    </h4>
                    <ul className="space-y-2">
                      {selectedJob.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Jobs;
