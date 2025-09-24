import image_83ea97928e2287e868486d2ffe25d2fdc33a6ca5 from './assets/83ea97928e2287e868486d2ffe25d2fdc33a6ca5.png';
import { useState, useMemo, useEffect, useCallback } from "react";
import { SearchBar } from "./components/SearchBar";
import { FilterPanel, FilterOptions } from "./components/FilterPanel";
import { SearchResults } from "./components/SearchResults";
import { ActiveFilters } from "./components/ActiveFilters";
import { SettingsPanel } from "./components/SettingsPanel";
import { DocumentUpload, DocumentList } from "./components/DocumentManager";
import { DocumentSearchResults } from "./components/DocumentSearchResults";
import { Button } from "./components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "./components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Filter, Moon, Sun, X, Settings, FileText, Search } from "lucide-react";
import { mockResearchData, filterOptions } from "./data/mockData";
import { useRovo } from "./services/useRovo";
import { simpleEmbeddingService } from "./services/simpleEmbeddingService";
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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
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

  // Initialize embedding service on startup
  useEffect(() => {
    const initializeEmbeddings = async () => {
      try {
        console.log('🚀 Initializing local AI embedding service...');
        await simpleEmbeddingService.initialize();
        console.log('✅ Local AI embedding service ready for semantic search');
        console.log('📊 Model info:', simpleEmbeddingService.getModelInfo());
      } catch (error) {
        console.warn('⚠️ Local embedding service initialization failed:', error);
      }
    };

    // Initialize immediately (no download needed)
    initializeEmbeddings();
  }, []);

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load recent content from Rovo on startup if configured
  useEffect(() => {
    const loadRecentContent = async () => {
      if (rovo.isConfigured && !debouncedSearchQuery) {
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
  }, [rovo.isConfigured, debouncedSearchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.trim() && rovo.isConfigured) {
        setLoading(true);
        try {
          const searchResults = await rovo.search(debouncedSearchQuery);
          setRovoResults(searchResults);
        } catch (error) {
          console.error('Error searching:', error);
        } finally {
          setLoading(false);
        }
      } else if (debouncedSearchQuery.trim()) {
        setLoading(true);
        // Search both mock data and documents
        try {
          // Search documents if we have any uploaded
          if (uploadedDocuments.length > 0) {
            const { simpleDocumentService } = await import('./services/simpleDocumentService');
            const documentResults = await simpleDocumentService.searchDocuments(debouncedSearchQuery);
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

    performSearch();
  }, [debouncedSearchQuery, uploadedDocuments.length, rovo.isConfigured]);

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

    // Add document search results to the main results if we have them
    // Document results are already filtered by the search query, so don't filter them again
    if (documentSearchResults.length > 0) {
      console.log('🔍 Document search found:', documentSearchResults.length, 'results for query:', debouncedSearchQuery);
      const documentResults: ResearchItem[] = documentSearchResults.map(docResult => ({
        id: `doc_${docResult.document.id}`,
        title: docResult.document.filename,
        description: docResult.matchedSections.length > 0 
          ? docResult.matchedSections[0].text.substring(0, 200) + '...'
          : docResult.document.extractedText.substring(0, 200) + '...',
        url: '#', // Documents don't have URLs, could implement download/view functionality
        source: 'Document',
        researchType: docResult.document.fileType.toUpperCase(),
        language: 'English', // Could be detected from document content
        team: 'Uploaded', // Or could be extracted from metadata
        tags: docResult.document.keywords.slice(0, 5), // Use keywords as tags
        lastUpdated: new Date(docResult.document.uploadedAt).toLocaleDateString(),
        author: docResult.document.metadata.author || 'Unknown'
      }));
      
      console.log('📄 Converted document results:', documentResults);
      
      // Add document results to the beginning of results array
      results = [...documentResults, ...results];
      console.log('📋 Total results after adding documents:', results.length);
    }

    // Apply text search ONLY to non-document results (documents are already searched)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      // Filter out document results from text search since they're already filtered
      const nonDocumentResults = results.filter(item => !item.id.startsWith('doc_'));
      const documentResults = results.filter(item => item.id.startsWith('doc_'));
      
      const filteredNonDocuments = nonDocumentResults.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query)) ||
        item.author.toLowerCase().includes(query)
      );
      
      // Combine: documents (already filtered) + filtered non-documents
      results = [...documentResults, ...filteredNonDocuments];
    }

    // Apply filters (but be more lenient with document results)
    if (activeFilters.sources.length > 0) {
      results = results.filter(item => {
        // Always include document results, they have their own source filtering
        if (item.id.startsWith('doc_')) return true;
        return activeFilters.sources.includes(item.source);
      });
    }

    if (activeFilters.researchTypes.length > 0) {
      results = results.filter(item => {
        // Always include document results, they have their own type filtering  
        if (item.id.startsWith('doc_')) return true;
        return activeFilters.researchTypes.includes(item.researchType);
      });
    }

    if (activeFilters.languages.length > 0) {
      results = results.filter(item => {
        // Always include document results, they have their own language filtering
        if (item.id.startsWith('doc_')) return true;
        return activeFilters.languages.includes(item.language);
      });
    }

    if (activeFilters.teams.length > 0) {
      results = results.filter(item => {
        // Always include document results, they have their own team filtering
        if (item.id.startsWith('doc_')) return true;
        return activeFilters.teams.includes(item.team);
      });
    }

    console.log('🎯 Final filtered results:', results.length, 'items');
    console.log('📊 Active filters:', activeFilters);
    console.log('🔍 Search query:', searchQuery);
    console.log('🔍 Debounced query:', debouncedSearchQuery);
    
    return results;
  }, [debouncedSearchQuery, activeFilters, rovoResults, rovo.isConfigured, documentSearchResults]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on new search
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
        {/* Document Upload Section - Show when no active search */}
        {!searchQuery && !loading && (
          <section className="flex items-center justify-between py-3 px-4 bg-card/30 border border-border/50 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/10 p-1.5 rounded-md">
                <FileText className="h-4 w-4 text-green-500" />
              </div>
              <h2 className="text-lg font-medium text-foreground">Upload Documents</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <DocumentUpload onDocumentUploaded={handleDocumentUploaded} />
              
              {uploadedDocuments.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {uploadedDocuments.length} file{uploadedDocuments.length !== 1 ? 's' : ''}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-0" align="end">
                    <div className="p-4 border-b">
                      <h3 className="font-medium text-foreground">Uploaded Documents</h3>
                      <p className="text-sm text-muted-foreground">Documents available for search</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <DocumentList documents={uploadedDocuments} />
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </section>
        )}

        {/* Search Results Section - Show when there's a search or results */}
        {(searchQuery || loading || filteredResults.length > 0 || documentSearchResults.length > 0) && (
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
              {/* Regular Search Results (now includes documents) */}
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
        )}

        {/* Document List Section - Show when search is active (for context) */}
        {(searchQuery || loading) && uploadedDocuments.length > 0 && (
          <section className="border-t border-border pt-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gray-500/10 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Uploaded Documents</h2>
                  <p className="text-sm text-muted-foreground">
                    Documents available for search
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{uploadedDocuments.length} document{uploadedDocuments.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            
            <DocumentList documents={uploadedDocuments} />
          </section>
        )}
      </div>
    </div>
  );
}