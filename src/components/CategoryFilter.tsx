import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { 
  Grid3X3, 
  Users, 
  Crown, 
  Palette, 
  Video, 
  Figma, 
  Zap, 
  Camera,
  Sparkles,
  Heart,
  Star,
  Code,
  Brush,
  Globe,
  Smartphone,
  Music,
  Gamepad2,
  BookOpen,
  Building2,
  Scissors,
  Layers,
  PenTool,
  Type,
  Image as ImageIcon,
  Monitor,
  Coffee,
  Award,
  Target,
  Rocket,
  Box,
  Home,
  BarChart3,
  Shapes
} from "lucide-react";

type Category = Database["public"]["Tables"]["categories"]["Row"];

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  onSectionChange?: (section: string) => void;
  activeSection?: string;
}

export const CategoryFilter = ({ selectedCategory, onCategoryChange, onSectionChange, activeSection = "all" }: CategoryFilterProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Featured tabs for special sections
  const featuredTabs = [
    { id: "all", label: "All", icon: Grid3X3 },
    { id: "following", label: "Following", icon: Users },
    { id: "best", label: "Best of Creative Hub", icon: Crown }
  ];

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('design')) return Palette;
    if (name.includes('photo')) return Camera;
    if (name.includes('video')) return Video;
    if (name.includes('ui') || name.includes('ux')) return Figma;
    if (name.includes('motion') || name.includes('animation')) return Zap;
    if (name.includes('brand')) return Star;
    if (name.includes('web')) return Grid3X3;
    if (name.includes('mobile')) return Sparkles;
    return Palette; // Default icon
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error loading categories:", error);
      return;
    }

    setCategories(data || []);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div className="border-b bg-background">
      <div className="container px-4 py-4">
        <div className="relative">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent z-10" />

          <Carousel opts={{ align: "start", dragFree: true }} className="px-6">
            <CarouselContent className="-ml-2">
              {/* Featured tabs */}
              {featuredTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <CarouselItem key={tab.id} className="basis-auto pl-2">
                    <Button
                      variant={activeSection === tab.id ? "default" : "secondary"}
                      size="sm"
                      onClick={() => {
                        onSectionChange?.(tab.id);
                        onCategoryChange(null);
                      }}
                      className={activeSection === tab.id 
                        ? "whitespace-nowrap rounded-xl px-4 h-9 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg" 
                        : "whitespace-nowrap rounded-xl px-4 h-9 bg-white/80 backdrop-blur hover:bg-white shadow-sm gap-2 hover:shadow-md transition-all duration-200"
                      }
                    >
                      <IconComponent className="h-4 w-4" />
                      {tab.label}
                    </Button>
                  </CarouselItem>
                );
              })}

              {/* Database categories */}
              {categories.map((category) => {
                const CategoryIcon = getCategoryIcon(category.name);
                const isSelected = activeSection === "category" && selectedCategory === category.id;
                return (
                  <CarouselItem key={category.id} className="basis-auto pl-2">
                    <Button
                      variant={isSelected ? "default" : "secondary"}
                      size="sm"
                      onClick={() => {
                        onSectionChange?.("category");
                        onCategoryChange(category.id);
                      }}
                      className={isSelected 
                        ? "whitespace-nowrap rounded-xl px-4 h-9 gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg"
                        : "whitespace-nowrap rounded-xl px-4 h-9 bg-white/80 backdrop-blur hover:bg-white shadow-sm gap-2 hover:shadow-md transition-all duration-200"
                      }
                    >
                      <CategoryIcon className="h-4 w-4" />
                      {category.name}
                    </Button>
                  </CarouselItem>
                );
              })}
            </CarouselContent>

            <CarouselPrevious className="-left-1 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-sm border" />
            <CarouselNext className="-right-1 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-sm border" />
          </Carousel>
        </div>
      </div>
    </div>
  );
};
