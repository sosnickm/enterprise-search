import React from 'react';
import { FileText, Clock, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface DocumentSearchResult {
  document: {
    id: string;
    filename: string;
    fileType: string;
    uploadedAt: string;
    fileSize: number;
    extractedText: string;
    keywords: string[];
    metadata: {
      title?: string;
      author?: string;
      pages?: number;
    };
  };
  score: number;
  matchedSections: Array<{
    text: string;
    context: string;
  }>;
}

interface DocumentSearchResultsProps {
  results: DocumentSearchResult[];
  query: string;
}

export function DocumentSearchResults({ results, query }: DocumentSearchResultsProps) {
  if (results.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFileTypeIcon = (fileType: string) => {
    return <FileText className="h-4 w-4 text-blue-500" />;
  };

  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark> : 
        part
    );
  };

  return (
    <div className="bg-blue-50/30 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="bg-blue-500/10 p-2 rounded-lg">
          <FileText className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Document Search Results</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            AI-powered search found {results.length} relevant document{results.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      
      {results.map((result) => (
        <Card key={result.document.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {getFileTypeIcon(result.document.fileType)}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">
                    {highlightText(result.document.filename, query)}
                  </CardTitle>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(result.document.uploadedAt)}</span>
                    <span>•</span>
                    <span>{formatFileSize(result.document.fileSize)}</span>
                    {result.document.metadata.pages && (
                      <>
                        <span>•</span>
                        <span>{result.document.metadata.pages} pages</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  Match: {Math.round(result.score * 100)}%
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* Matched sections */}
            {result.matchedSections.length > 0 && (
              <div className="space-y-2 mb-3">
                <div className="text-sm font-medium text-muted-foreground">Matched content:</div>
                {result.matchedSections.slice(0, 2).map((section, idx) => (
                  <div key={idx} className="bg-muted/30 p-3 rounded-lg text-sm">
                    <p className="text-muted-foreground">
                      {highlightText(section.text, query)}
                    </p>
                  </div>
                ))}
                {result.matchedSections.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{result.matchedSections.length - 2} more matches
                  </div>
                )}
              </div>
            )}
            
            {/* Keywords */}
            {result.document.keywords.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  <span>Keywords:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {result.document.keywords.slice(0, 6).map((keyword, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {highlightText(keyword, query)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
