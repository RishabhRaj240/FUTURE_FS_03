import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, X, Clock, Filter, SortAsc, SortDesc } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  profiles: Database["public"]["Tables"]["profiles"]["Row"] | null;
  categories: Database["public"]["Tables"]["categories"]["Row"] | null;
};

interface SearchSuggestions {
  projects: Project[];
  users: Database["public"]["Tables"]["profiles"]["Row"][];
  categories: Database["public"]["Tables"]["categories"]["Row"][];
}

interface SearchFilters {
  category: string | null;
  sortBy: 'relevance' | 'newest' | 'oldest' | 'most_liked' | 'most_saved' | 'most_commented';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  mediaType: 'all' | 'images' | 'videos';
}

export const EnhancedSearch = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [suggestions, setSuggestions] = useState<SearchSuggestions>({ projects: [], users: [], categories: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    category: searchParams.get("category") || null,
    sortBy: (searchParams.get("sort") as any) || 'relevance',
    dateRange: (searchParams.get("date") as any) || 'all',
    mediaType: (searchParams.get("media") as any) || 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Debounced search suggestions
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        fetchSearchSuggestions(searchQuery);
      }, 300);
    } else {
      setSuggestions({ projects: [], users: [], categories: [] });
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const fetchSearchSuggestions = async (query: string) => {
    try {
      const [projectsResult, usersResult, categoriesResult] = await Promise.all([
        supabase
          .from("projects")
          .select(`
            *,
            profiles(*),
            categories(*)
          `)
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(5),
        
        supabase
          .from("profiles")
          .select("*")
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
          .limit(3),
        
        supabase
          .from("categories")
          .select("*")
          .ilike("name", `%${query}%`)
          .limit(3)
      ]);

      setSuggestions({
        projects: projectsResult.data || [],
        users: usersResult.data || [],
        categories: categoriesResult.data || []
      });
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const handleSearch = (query: string = searchQuery) => {
    if (!query.trim()) return;

    saveRecentSearch(query);
    setShowSuggestions(false);

    // Build search URL with filters
    const params = new URLSearchParams();
    params.set("search", query);
    
    if (filters.category) params.set("category", filters.category);
    if (filters.sortBy !== 'relevance') params.set("sort", filters.sortBy);
    if (filters.dateRange !== 'all') params.set("date", filters.dateRange);
    if (filters.mediaType !== 'all') params.set("media", filters.mediaType);

    navigate(`/?${params.toString()}`);
  };

  const handleSuggestionClick = (type: 'project' | 'user' | 'category', item: any) => {
    let query = '';
    
    switch (type) {
      case 'project':
        query = item.title;
        break;
      case 'user':
        query = item.username;
        break;
      case 'category':
        query = item.name;
        setFilters(prev => ({ ...prev, category: item.id }));
        break;
    }

    setSearchQuery(query);
    handleSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSuggestions(false);
    navigate("/");
  };

  const applyFilters = () => {
    setShowFilters(false);
    handleSearch();
  };

  const clearFilters = () => {
    setFilters({
      category: null,
      sortBy: 'relevance',
      dateRange: 'all',
      mediaType: 'all'
    });
    setSearchParams({});
  };

  const getDateFilter = (dateRange: string) => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return now.toISOString().split('T')[0];
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString();
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return monthAgo.toISOString();
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return yearAgo.toISOString();
      default:
        return null;
    }
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== null && value !== 'relevance' && value !== 'all'
  ).length;

  return (
    <div className="relative flex-1">
      <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Search Creative Hub..."
            className="pl-10 pr-20 h-10 rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.length >= 2 || recentSearches.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // Delay hiding suggestions to allow clicks
              setTimeout(() => setShowSuggestions(false), 200);
            }}
          />
          
          {/* Clear and Filter buttons */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <Filter className="h-3 w-3" />
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium">Search Filters</h4>
                  
                  {/* Sort By */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort by</label>
                    <Select value={filters.sortBy} onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                        <SelectItem value="most_liked">Most Liked</SelectItem>
                        <SelectItem value="most_saved">Most Saved</SelectItem>
                        <SelectItem value="most_commented">Most Commented</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date range</label>
                    <Select value={filters.dateRange} onValueChange={(value: any) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This week</SelectItem>
                        <SelectItem value="month">This month</SelectItem>
                        <SelectItem value="year">This year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Media Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Media type</label>
                    <Select value={filters.mediaType} onValueChange={(value: any) => setFilters(prev => ({ ...prev, mediaType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All media</SelectItem>
                        <SelectItem value="images">Images only</SelectItem>
                        <SelectItem value="videos">Videos only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button onClick={applyFilters} className="flex-1">
                      Apply Filters
                    </Button>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </form>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-hidden">
          <CardContent className="p-0">
            <Command>
              <CommandList>
                {/* Recent Searches */}
                {searchQuery.length < 2 && recentSearches.length > 0 && (
                  <CommandGroup heading="Recent searches">
                    {recentSearches.map((search, index) => (
                      <CommandItem
                        key={index}
                        onSelect={() => {
                          setSearchQuery(search);
                          handleSearch(search);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {search}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Search Suggestions */}
                {searchQuery.length >= 2 && (
                  <>
                    {/* Projects */}
                    {suggestions.projects.length > 0 && (
                      <CommandGroup heading="Projects">
                        {suggestions.projects.map((project) => (
                          <CommandItem
                            key={project.id}
                            onSelect={() => handleSuggestionClick('project', project)}
                            className="flex items-center gap-3 p-3"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden">
                              {project.image_url && (
                                <img
                                  src={project.image_url}
                                  alt={project.title}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{project.title}</div>
                              <div className="text-sm text-muted-foreground truncate">
                                by {project.profiles?.username}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {/* Users */}
                    {suggestions.users.length > 0 && (
                      <CommandGroup heading="People">
                        {suggestions.users.map((user) => (
                          <CommandItem
                            key={user.id}
                            onSelect={() => handleSuggestionClick('user', user)}
                            className="flex items-center gap-3 p-3"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-full overflow-hidden">
                              {user.avatar_url && (
                                <img
                                  src={user.avatar_url}
                                  alt={user.username}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{user.full_name || user.username}</div>
                              <div className="text-sm text-muted-foreground">@{user.username}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {/* Categories */}
                    {suggestions.categories.length > 0 && (
                      <CommandGroup heading="Categories">
                        {suggestions.categories.map((category) => (
                          <CommandItem
                            key={category.id}
                            onSelect={() => handleSuggestionClick('category', category)}
                            className="flex items-center gap-2 p-3"
                          >
                            <Badge variant="secondary">{category.name}</Badge>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {/* No results */}
                    {suggestions.projects.length === 0 && 
                     suggestions.users.length === 0 && 
                     suggestions.categories.length === 0 && (
                      <CommandEmpty>No results found for "{searchQuery}"</CommandEmpty>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
