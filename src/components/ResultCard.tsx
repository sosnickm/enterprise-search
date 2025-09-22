import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { FileText, Calendar, Users } from "lucide-react";
import { getTagColor, tagColorClasses } from "../utils/tagColors";

export interface ResearchItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  researchType: string;
  language: string;
  team: string;
  tags: string[];
  lastUpdated: string;
  author: string;
}

interface ResultCardProps {
  item: ResearchItem;
}

const sourceIcons: Record<string, React.ReactNode> = {
  "monday.com": (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#FF3D57"/>
      <path d="M7 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm5 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm5 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" fill="white"/>
      <rect x="6" y="13" width="2" height="4" rx="1" fill="white"/>
      <rect x="11" y="15" width="2" height="2" rx="1" fill="white"/>
      <rect x="16" y="14" width="2" height="3" rx="1" fill="white"/>
    </svg>
  ),
  "confluence": (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#172B4D"/>
      <path d="M5.5 16.5c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5v1c0 1.5-1 2.5-2.5 2.5s-2.5-1-2.5-2.5v-1z" fill="#2684FF"/>
      <path d="M13.5 7.5c0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5v-1c0-1.5-1-2.5-2.5-2.5s-2.5 1-2.5 2.5v1z" fill="#2684FF"/>
      <path d="M5.5 7.5L13.5 16.5" stroke="#2684FF" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  "sharepoint": (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#0078D4"/>
      <path d="M12 4L20 8v8l-8 4-8-4V8l8-4z" fill="white"/>
      <path d="M12 4v16M4 8l8 4 8-4" stroke="#0078D4" strokeWidth="1" fill="none"/>
    </svg>
  ),
  "jira": (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#0052CC"/>
      <path d="M12 3L9 6h6l-3-3zM9 6v6l3 3 3-3V6H9z" fill="white"/>
      <path d="M12 12l3 3v6l-3-3-3 3v-6l3-3z" fill="#2684FF"/>
    </svg>
  ),
  "lucid": (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#FF6900"/>
      <path d="M8 6h8v2H8zM6 10h12v2H6zM8 14h8v2H8zM10 18h4v2h-4z" fill="white"/>
      <circle cx="12" cy="8" r="1" fill="#FF6900"/>
    </svg>
  ),
};

export function ResultCard({ item }: ResultCardProps) {
  // Calculate tags for exactly two lines with guaranteed no wrapping:
  // Line 1: Research Type + Language (always 2 badges)
  // Line 2: Content tags (limit to 2 tags + overflow indicator to ensure single line)
  const maxContentTagsForSecondLine = 2; // Conservative limit to guarantee single line
  const contentTagsToShow = Math.min(maxContentTagsForSecondLine, item.tags.length);
  
  return (
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group border border-border bg-card rounded-[10px] h-72 flex flex-col overflow-hidden">
      {/* Source Badge at Top */}
      <div className="px-4 pt-3 pb-0 min-w-0">
        <Badge 
          variant="outline" 
          className="text-xs font-normal bg-muted/30 border-border text-muted-foreground px-2 py-0.5 rounded-[10px] max-w-full"
        >
          {sourceIcons[item.source.toLowerCase()] || <FileText className="w-3 h-3" />}
          <span className="ml-0.5 truncate">{item.source}</span>
        </Badge>
      </div>

      <CardHeader className="pb-0 pt-3 px-4 min-w-0">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <h3 className="group-hover:text-foreground/80 transition-colors text-sm font-medium leading-tight mb-2 whitespace-nowrap overflow-hidden text-ellipsis w-full">
              {item.title}
            </h3>
            <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed overflow-hidden">
              {item.description}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-3 px-4 pb-4 flex-1 flex flex-col min-w-0">
        {/* Tags Section - Exactly Two Lines with No Wrapping */}
        <div className="flex-1 mb-3 min-w-0">
          {/* Line 1: Research Type and Language Tags */}
          <div className="flex items-center gap-1 mb-2 h-6 overflow-hidden">
            <Badge 
              variant="secondary" 
              className={`text-xs font-normal px-2 py-0.5 rounded-[10px] border flex-shrink-0 max-w-32 overflow-hidden ${tagColorClasses[getTagColor(item.researchType, 'researchType')]}`}
            >
              <span className="truncate block">{item.researchType}</span>
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-xs font-normal px-2 py-0.5 rounded-[10px] border flex-shrink-0 max-w-32 overflow-hidden ${tagColorClasses[getTagColor(item.language, 'language')]}`}
            >
              <span className="truncate block">{item.language}</span>
            </Badge>
          </div>
          
          {/* Line 2: Content Tags (limited to ensure single line with overflow) */}
          {item.tags.length > 0 && (
            <div className="flex items-center gap-1 h-6 overflow-hidden">
              {item.tags.slice(0, contentTagsToShow).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className={`text-xs font-normal px-1.5 py-0.5 rounded-[10px] border flex-shrink-0 max-w-28 overflow-hidden ${tagColorClasses[getTagColor(tag, 'content')]}`}
                >
                  <span className="truncate block">{tag}</span>
                </Badge>
              ))}
              {item.tags.length > contentTagsToShow && (
                <Badge 
                  variant="outline" 
                  className="text-xs font-normal bg-muted/50 border-border text-muted-foreground px-1.5 py-0.5 rounded-[10px] border whitespace-nowrap flex-shrink-0"
                >
                  +{item.tags.length - contentTagsToShow}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {/* Footer Section */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border mt-auto">
          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1 min-w-0 max-w-20">
              <Users className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{item.team}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Calendar className="h-3 w-3" />
              <span className="whitespace-nowrap">{item.lastUpdated}</span>
            </div>
          </div>
          <span className="truncate ml-2 flex-shrink-0 max-w-20 text-right">by {item.author}</span>
        </div>
      </CardContent>
    </Card>
  );
}