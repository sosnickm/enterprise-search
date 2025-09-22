import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { getTagColor, tagColorClasses, colorIndicatorClasses } from "../utils/tagColors";

export interface FilterOptions {
  sources: string[];
  researchTypes: string[];
  languages: string[];
  teams: string[];
}

interface FilterPanelProps {
  filters: FilterOptions;
  activeFilters: FilterOptions;
  onFilterChange: (category: keyof FilterOptions, value: string) => void;
  onClearFilters: () => void;
  onClose?: () => void;
}

// Shortened research type display names
const researchTypeDisplayMap: Record<string, string> = {
  "User Research": "User Research",
  "Survey Analysis": "Survey",
  "Competitive Analysis": "Competitive",
  "Technical Investigation": "Tech Investigation",
  "Information Architecture": "Info Architecture",
  "Usability Testing": "Usability",
  "Requirements Analysis": "Requirements",
  "Performance Analysis": "Performance",
  "Workshop Summary": "Workshop",
  "Security Analysis": "Security",
  "A/B Testing": "A/B Testing",
  "Accessibility Audit": "Accessibility",
  "Technical Documentation": "Tech Docs",
  "Feature Analysis": "Feature",
  "Market Research": "Market Research",
  "Content Analysis": "Content",
  "Technical Research": "Tech Research",
  "Design Guidelines": "Design Guide",
  "Support Analysis": "Support",
  "Sentiment Analysis": "Sentiment",
  "Compliance Review": "Compliance",
  "ML Analysis": "ML Analysis",
  "Design Documentation": "Design Docs",
  "Campaign Analysis": "Campaign",
  "Feedback Analysis": "Feedback",
  "SEO Analysis": "SEO",
  "Compatibility Testing": "Compatibility",
  "Churn Analysis": "Churn",
  "Localization Testing": "Localization",
  "Infrastructure Research": "Infrastructure",
  "Conversion Analysis": "Conversion",
  "Algorithm Analysis": "Algorithm",
  "Revenue Analysis": "Revenue",
  "AI Analysis": "AI Analysis",
  "Technology Research": "Technology"
};

export function FilterPanel({ filters, activeFilters, onFilterChange, onClearFilters, onClose }: FilterPanelProps) {
  const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);

  const getDisplayName = (category: keyof FilterOptions, option: string) => {
    if (category === 'researchTypes') {
      return researchTypeDisplayMap[option] || option;
    }
    return option;
  };

  const getFilterColorType = (category: keyof FilterOptions): 'source' | 'researchType' | 'language' | 'content' => {
    switch (category) {
      case 'sources': return 'source';
      case 'researchTypes': return 'researchType';
      case 'languages': return 'language';
      case 'teams': return 'content';
      default: return 'content';
    }
  };

  const renderFilterSection = (title: string, category: keyof FilterOptions, options: string[]) => (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const isActive = activeFilters[category].includes(option);
          const displayName = getDisplayName(category, option);
          const colorClass = tagColorClasses[getTagColor(option, getFilterColorType(category))];
          return (
            <button
              key={option}
              className={`text-xs px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 text-left border relative ${
                isActive 
                  ? colorClass + ' font-medium shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-border/40 hover:border-border/60'
              }`}
              onClick={() => onFilterChange(category, option)}
              title={option} // Show full name on hover
            >
              {!isActive && (
                <div className={`absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${colorIndicatorClasses[getTagColor(option, getFilterColorType(category))]}`} />
              )}
              <span className={isActive ? '' : 'ml-4'}>{displayName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderFilterSection("Source", "sources", filters.sources)}
      {renderFilterSection("Research Type", "researchTypes", filters.researchTypes)}
      {renderFilterSection("Language", "languages", filters.languages)}
      {renderFilterSection("Team", "teams", filters.teams)}
      
      {hasActiveFilters && (
        <div className="flex justify-center pt-6 border-t border-border/30">
          <Button 
            variant="outline" 
            onClick={onClearFilters} 
            className="text-sm rounded-lg px-6 py-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}