import image_83ea97928e2287e868486d2ffe25d2fdc33a6ca5 from './assets/83ea97928e2287e868486d2ffe25d2fdc33a6ca5.png';
import { useState, useMemo, useEffect } from "react";
import { SearchBar } from "./components/SearchBar";
import { FilterPanel, FilterOptions } from "./components/FilterPanel";
import { SearchResults } from "./components/SearchResults";
import { ActiveFilters } from "./components/ActiveFilters";
import { SettingsPanel } from "./components/SettingsPanel";
import { DocumentUpload, DocumentList } from "./components/DocumentManager";
import { DocumentSearchResults } from "./components/DocumentSearchResults";
import { Button } from "./components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "./components/ui/drawer";
import { Filter, Moon, Sun, X, Settings, FileText, Search } from "lucide-react";
import { mockResearchData, filterOptions } from "./data/mockData";
import { useRovo } from "./services/useRovo";
import type { ResearchItem } from "./components/ResultCard";

interface UploadedDocument {
  id: string;
  filename: string;
  fileType: 'pdf' | 'docx' | 'csv' | 'txt' | 'xlsx' | 'pptx';
  uploadedAt: string;
  fileSize: number;
  extractedText: string;
  keywords: string[];
  metadata: {
    title?: string;
    author?: string;
    pages?: number;
  };
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [rovoResults, setRovoResults] = useState<ResearchItem[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [documentSearchResults, setDocumentSearchResults] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    sources: [],
    researchTypes: [],
    languages: [],
    teams: []
  });

  // Initialize Rovo integration
  const rovo = useRovo();

  // Load recent content from Rovo on startup if configured
  useEffect(() => {
    const loadRecentContent = async () => {
      if (rovo.isConfigured && !searchQuery) {
        setLoading(true);
        try {
          const recentContent = await rovo.getRecentContent();
          setRovoResults(recentContent);
        } catch (error) {
          console.error('Error loading recent content:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadRecentContent();
  }, [rovo.isConfigured, searchQuery]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleFilterChange = (category: keyof FilterOptions, value: string) => {
    setActiveFilters(prev => {
      const currentFilters = prev[category];
      const isActive = currentFilters.includes(value);
      
      return {
        ...prev,
        [category]: isActive 
          ? currentFilters.filter(item => item !== value)
          : [...currentFilters, value]
      };
    });
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleFilterRemove = (category: keyof FilterOptions, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item !== value)
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setActiveFilters({
      sources: [],
      researchTypes: [],
      languages: [],
      teams: []
    });
    setCurrentPage(1);
  };

  const filteredResults = useMemo(() => {
    // Combine mock data with Rovo results
    let results: ResearchItem[] = [];
    
    if (rovo.isConfigured) {
      // Use Rovo results when configured
      results = rovoResults;
    } else {
      // Fall back to mock data when not configured
      results = mockResearchData;
    }

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query)) ||
        item.author.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (activeFilters.sources.length > 0) {
      results = results.filter(item => 
        activeFilters.sources.includes(item.source)
      );
    }

    if (activeFilters.researchTypes.length > 0) {
      results = results.filter(item => 
        activeFilters.researchTypes.includes(item.researchType)
      );
    }

    if (activeFilters.languages.length > 0) {
      results = results.filter(item => 
        activeFilters.languages.includes(item.language)
      );
    }

    if (activeFilters.teams.length > 0) {
      results = results.filter(item => 
        activeFilters.teams.includes(item.team)
      );
    }

    return results;
  }, [searchQuery, activeFilters, rovoResults, rovo.isConfigured]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on new search
    
    if (query.trim() && rovo.isConfigured) {
      setLoading(true);
      try {
        const searchResults = await rovo.search(query);
        setRovoResults(searchResults);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setLoading(false);
      }
    } else if (query.trim()) {
      setLoading(true);
      // Search both mock data and documents
      try {
        // Search documents if we have any uploaded
        if (uploadedDocuments.length > 0) {
          const { simpleDocumentService } = await import('./services/simpleDocumentService');
          const documentResults = await simpleDocumentService.searchDocuments(query);
          setDocumentSearchResults(documentResults);
          console.log('Document search results:', documentResults);
        } else {
          setDocumentSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching documents:', error);
        setDocumentSearchResults([]);
      }
      // Simulate API call delay for mock data
      setTimeout(() => setLoading(false), 500);
    } else {
      setLoading(false);
      setDocumentSearchResults([]);
      // When search is cleared, the useEffect will handle loading recent content
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);

  const handleDocumentUploaded = (document: UploadedDocument) => {
    setUploadedDocuments(prev => [document, ...prev]);
    console.log('Document uploaded:', document);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header and Search Section - Elevated */}
      <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm transition-all duration-300">
        <div className={`max-w-7xl mx-auto px-5 transition-all duration-300 ${isScrolled ? 'py-3' : 'py-6'}`}>
          {/* Header */}
          <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? 'mb-3' : 'mb-8'}`}>
            <div className="flex items-center gap-3">
              <div className={`rounded overflow-hidden bg-slate-800 border border-border flex-shrink-0 transition-all duration-300 ${isScrolled ? 'w-8 h-8' : 'w-12 h-12'}`}>
                <img 
                  src={image_83ea97928e2287e868486d2ffe25d2fdc33a6ca5}
                  alt="B3S Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className={`font-semibold text-foreground transition-all duration-300 ${isScrolled ? 'text-lg mb-0' : 'text-xl mb-1'}`}>
                  B3S Research Repository
                </h1>
                <p className={`text-muted-foreground text-sm transition-all duration-300 ${isScrolled ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
                  Find research from Monday.com, Confluence, SharePoint, Jira, and Lucid boards
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Drawer open={settingsOpen} onOpenChange={setSettingsOpen} direction="right">
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="w-96 max-w-[90vw] bg-card border-l border-border">
                  <DrawerHeader className="border-b border-border bg-background">
                    <div className="flex items-center justify-between">
                      <DrawerTitle className="text-lg font-semibold">Settings & Connections</DrawerTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSettingsOpen(false)}
                        className="h-8 w-8 p-0 hover:bg-muted/50 rounded"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </DrawerHeader>
                  <div className="p-6 pb-8 overflow-y-auto bg-background">
                    <SettingsPanel 
                      rovoConfig={rovo.config || undefined}
                      onRovoConfigChange={rovo.saveConfig}
                      onClose={() => setSettingsOpen(false)} 
                    />
                  </div>
                </DrawerContent>
              </Drawer>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDarkMode}
                className="rounded"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Enhanced Search Section */}
          <div className={`transition-all duration-300 ${isScrolled ? 'space-y-2' : 'space-y-4'}`}>
            {/* Rovo Status Message */}
            {!rovo.isConfigured && (
              <div className="bg-blue-50/70 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                <span className="font-medium">Configure Atlassian Rovo</span> to search your real Confluence and Jira data. 
                Click the settings button to get started with live data from your Atlassian workspace.
              </div>
            )}
            
            {/* Search Bar and Filter Button */}
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <SearchBar 
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder={rovo.isConfigured 
                      ? "Search your Confluence and Jira content..." 
                      : "Search research by title, description, tags, or author..."
                    }
                    isScrolled={isScrolled}
                  />
                </div>
              </div>
              <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
                <DrawerTrigger asChild>
                  <Button variant="outline" className={`flex items-center gap-2 whitespace-nowrap rounded px-4 py-2 border-border hover:bg-muted/50 transition-all duration-300 ${isScrolled ? 'h-10' : 'h-11'}`}>
                    <Filter className="h-4 w-4" />
                    {!isScrolled && "Filters"}
                    {hasActiveFilters && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-lg w-5 h-5 flex items-center justify-center ml-1">
                        {Object.values(activeFilters).reduce((total, arr) => total + arr.length, 0)}
                      </span>
                    )}
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="w-96 max-w-[90vw] bg-card border-l border-border">
                  <DrawerHeader className="border-b border-border bg-background">
                    <div className="flex items-center justify-between">
                      <DrawerTitle className="text-lg font-semibold">Filter Research</DrawerTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDrawerOpen(false)}
                        className="h-8 w-8 p-0 hover:bg-muted/50 rounded"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {hasActiveFilters && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {Object.values(activeFilters).reduce((total, arr) => total + arr.length, 0)} filter{Object.values(activeFilters).reduce((total, arr) => total + arr.length, 0) !== 1 ? 's' : ''} active
                      </p>
                    )}
                  </DrawerHeader>
                  <div className="p-6 pb-8 overflow-y-auto bg-background">
                    <FilterPanel
                      filters={filterOptions}
                      activeFilters={activeFilters}
                      onFilterChange={handleFilterChange}
                      onClearFilters={clearFilters}
                      onClose={() => setDrawerOpen(false)}
                    />
                  </div>
                </DrawerContent>
              </Drawer>
            </div>

            {/* Active Filters */}
            <div className="">
              <ActiveFilters
                activeFilters={activeFilters}
                onFilterRemove={handleFilterRemove}
                onClearAll={clearFilters}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="max-w-7xl mx-auto px-5 py-8 space-y-12">
        {/* Search Results Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Search className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Search Results</h2>
              <p className="text-sm text-muted-foreground">
                {rovo.isConfigured 
                  ? "Search across your Confluence and Jira content" 
                  : "Search through research repository (mock data)"}
              </p>
            </div>
          </div>
          
          <div className="space-y-8">
            {/* Document Search Results */}
            {documentSearchResults.length > 0 && (
              <DocumentSearchResults 
                results={documentSearchResults}
                query={searchQuery}
              />
            )}
            
            {/* Regular Search Results */}
            <SearchResults 
              results={filteredResults}
              loading={loading}
              searchQuery={searchQuery}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        </section>

        {/* Documents Section */}
        <section className="border-t border-border pt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Document Management</h2>
                <p className="text-sm text-muted-foreground">
                  Upload and manage your documents for AI-powered search
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{uploadedDocuments.length} document{uploadedDocuments.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="flex justify-center">
              <DocumentUpload onDocumentUploaded={handleDocumentUploaded} />
            </div>
            
            <DocumentList documents={uploadedDocuments} />
          </div>
        </section>
      </div>
    </div>
  );
}