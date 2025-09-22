import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { FilterOptions } from "./FilterPanel";
import { getTagColor, tagColorClasses } from "../utils/tagColors";

interface ActiveFiltersProps {
  activeFilters: FilterOptions;
  onFilterRemove: (category: keyof FilterOptions, value: string) => void;
  onClearAll: () => void;
}

export function ActiveFilters({ activeFilters, onFilterRemove, onClearAll }: ActiveFiltersProps) {
  const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);

  if (!hasActiveFilters) {
    return null;
  }

  const getFilterTypeLabel = (category: keyof FilterOptions) => {
    switch (category) {
      case 'sources': return 'Source';
      case 'researchTypes': return 'Type';
      case 'languages': return 'Language';
      case 'teams': return 'Team';
      default: return category;
    }
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

  const allActiveFilters = Object.entries(activeFilters).flatMap(([category, values]) =>
    values.map(value => ({ category: category as keyof FilterOptions, value }))
  );

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 border border-border/50 rounded-lg">
      <span className="text-sm text-muted-foreground mr-1">Filters:</span>
      {allActiveFilters.map(({ category, value }) => (
        <Badge
          key={`${category}-${value}`}
          variant="secondary"
          className={`text-xs font-normal hover:opacity-80 transition-colors rounded-lg border ${tagColorClasses[getTagColor(value, getFilterColorType(category))]}`}
        >
          <span className="text-muted-foreground">{getFilterTypeLabel(category)}:</span>
          <span className="ml-1">{value}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFilterRemove(category, value)}
            className="h-auto p-0 ml-1 hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-xs text-muted-foreground hover:text-foreground h-6 px-2"
      >
        Clear all
      </Button>
    </div>
  );
}