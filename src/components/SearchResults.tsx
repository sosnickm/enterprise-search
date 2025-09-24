import { ResultCard, ResearchItem } from "./ResultCard";
import { Pagination } from "./Pagination";
import { Alert, AlertDescription } from "./ui/alert";
import { Search } from "lucide-react";

interface SearchResultsProps {
  results: ResearchItem[];
  loading: boolean;
  searchQuery: string;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function SearchResults({ results, loading, searchQuery, currentPage, itemsPerPage, onPageChange }: SearchResultsProps) {
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = results.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-muted/50 animate-pulse rounded w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 bg-muted/30 animate-pulse rounded-lg flex flex-col">
              <div className="px-4 py-4 space-y-3 flex-1 flex flex-col h-32">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted/50 rounded w-4/5" />
                  <div className="h-3 bg-muted/40 rounded w-full" />
                  <div className="h-3 bg-muted/40 rounded w-3/4" />
                  <div className="h-3 bg-muted/40 rounded w-5/6" />
                </div>
              </div>
              <div className="px-4 pb-4 space-y-3 flex-1 flex flex-col">
                <div className="space-y-2 min-h-[3.5rem]">
                  <div className="flex gap-2">
                    <div className="h-5 bg-muted/40 rounded w-16" />
                    <div className="h-5 bg-muted/40 rounded w-12" />
                    <div className="h-5 bg-muted/40 rounded w-10" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 bg-muted/30 rounded w-12" />
                    <div className="h-5 bg-muted/30 rounded w-14" />
                    <div className="h-5 bg-muted/30 rounded w-10" />
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-muted/30">
                  <div className="flex justify-between">
                    <div className="flex gap-3">
                      <div className="h-3 bg-muted/40 rounded w-16" />
                      <div className="h-3 bg-muted/40 rounded w-12" />
                    </div>
                    <div className="h-3 bg-muted/40 rounded w-20" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0 && searchQuery) {
    return (
      <Alert className="max-w-lg border-border/50 bg-card/50 backdrop-blur-sm">
        <Search className="h-4 w-4" />
        <AlertDescription className="text-muted-foreground">
          No research found matching "{searchQuery}". Try adjusting your search terms or filters.
        </AlertDescription>
      </Alert>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/50 dark:border-slate-800/30 rounded-xl p-12">
        <div className="text-center text-muted-foreground">
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full w-fit mx-auto mb-4">
            <Search className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-lg font-medium mb-2">No search results yet</p>
          <p className="text-sm opacity-70 max-w-md mx-auto">
            {searchQuery 
              ? `No results found for "${searchQuery}". Try different keywords or check your filters.`
              : "Start searching to find research from your repository. Search across Monday.com, Confluence, SharePoint, Jira, and Lucid boards."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/50 dark:border-slate-800/30 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-slate-500/10 p-1.5 rounded-md">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">
            {results.length} {results.length === 1 ? 'result' : 'results'} found
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {paginatedResults.map((item) => (
          <div key={item.id} onClick={() => window.open(item.url, '_blank')}>
            <ResultCard item={item} />
          </div>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        totalItems={results.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
}