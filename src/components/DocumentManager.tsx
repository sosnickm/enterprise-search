import React, { useState, useCallback } from 'react';
import { Upload, File, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';

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

interface DocumentUploadProps {
  onDocumentUploaded: (document: UploadedDocument) => void;
}

export function DocumentUpload({ onDocumentUploaded }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      // Validate file type
      const allowedTypes = ['.pdf', '.docx', '.csv', '.txt', '.xlsx', '.pptx'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        throw new Error(`Unsupported file type. Allowed types: ${allowedTypes.join(', ')}`);
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }

      // Use the simple document service for POC
      const { simpleDocumentService } = await import('../services/simpleDocumentService');
      const result = await simpleDocumentService.uploadDocument(file);

      if (result.success && result.document) {
        onDocumentUploaded(result.document);
        setUploadStatus({ 
          type: 'success', 
          message: `Successfully uploaded and processed "${file.name}"` 
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setIsUploading(false);
    }
  };



  return (
    <Card className="w-full max-w-md bg-green-50/50 dark:bg-green-950/20 border-green-200/50 dark:border-green-800/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
          <div className="bg-green-500/10 p-1.5 rounded-md">
            <Upload className="h-4 w-4 text-green-500" />
          </div>
          Upload Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${isDragging ? 'border-green-400 bg-green-50 dark:bg-green-950/30' : 'border-green-200 dark:border-green-700'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-950/30'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!isUploading) {
              document.getElementById('file-input')?.click();
            }
          }}
        >
          <input
            id="file-input"
            type="file"
            className="hidden"
            accept=".pdf,.docx,.csv,.txt,.xlsx,.pptx"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          
          <div className="space-y-2">
            {isUploading ? (
              <>
                <Loader2 className="h-12 w-12 text-green-500 animate-spin mx-auto" />
                <p className="text-sm text-green-600 dark:text-green-400">Processing document...</p>
              </>
            ) : (
              <>
                <FileText className="h-12 w-12 text-green-400 mx-auto" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Drop your document here or click to browse
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    PDF, Word, CSV, Excel, PowerPoint, Text files
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {uploadStatus.type && (
          <Alert className={uploadStatus.type === 'error' ? 'border-destructive' : 'border-green-500'}>
            {uploadStatus.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={uploadStatus.type === 'error' ? 'text-destructive' : 'text-green-700'}>
              {uploadStatus.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-green-600 dark:text-green-400 space-y-2">
          <p className="font-medium">Supported formats:</p>
          <div className="flex flex-wrap gap-1">
            {['PDF', 'Word', 'Excel', 'PowerPoint', 'CSV', 'Text'].map(format => (
              <Badge key={format} variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                {format}
              </Badge>
            ))}
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs">
            <p className="font-medium text-green-800 dark:text-green-200 mb-1">💡 PDF Tips:</p>
            <ul className="text-green-700 dark:text-green-300 space-y-0.5 text-xs">
              <li>• Text-based PDFs work best</li>
              <li>• Test: Can you select/copy text in the PDF?</li>
              <li>• Scanned PDFs may need conversion</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DocumentListProps {
  documents: UploadedDocument[];
}

export function DocumentList({ documents }: DocumentListProps) {
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
    switch (fileType) {
      case 'pdf':
        return <File className="h-4 w-4 text-red-500" />;
      case 'docx':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'xlsx':
        return <File className="h-4 w-4 text-green-500" />;
      case 'pptx':
        return <File className="h-4 w-4 text-orange-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  if (documents.length === 0) {
    return (
      <Card className="bg-green-50/30 dark:bg-green-950/20 border-green-200/50 dark:border-green-800/30">
        <CardContent className="p-8 text-center">
          <div className="bg-green-100 dark:bg-green-800 p-4 rounded-full w-fit mx-auto mb-4">
            <FileText className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-green-800 dark:text-green-200 font-medium mb-1">No documents uploaded yet</p>
          <p className="text-sm text-green-600 dark:text-green-300">
            Upload your first document to start building your AI-searchable knowledge base
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="bg-green-500/10 p-1.5 rounded-md">
          <FileText className="h-4 w-4 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
          Uploaded Documents
        </h3>
      </div>
      <div className="grid gap-3">
        {documents.map((doc) => (
          <Card key={doc.id} className="hover:shadow-md transition-all duration-200 bg-white dark:bg-card border border-green-100 dark:border-green-900/20 hover:border-green-200 dark:hover:border-green-800/30">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="bg-green-50 dark:bg-green-950/50 p-2 rounded-lg">
                    {getFileTypeIcon(doc.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-green-900 dark:text-green-100">{doc.filename}</p>
                    <div className="flex items-center space-x-2 text-xs text-green-600 dark:text-green-400 mt-1">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>•</span>
                      <span>{formatDate(doc.uploadedAt)}</span>
                      {doc.metadata.pages && (
                        <>
                          <span>•</span>
                          <span>{doc.metadata.pages} pages</span>
                        </>
                      )}
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-xs text-green-700 dark:text-green-300 line-clamp-2 leading-relaxed">
                        {doc.extractedText.substring(0, 150)}...
                      </p>
                    </div>

                    {doc.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {doc.keywords.slice(0, 4).map((keyword, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                            {keyword}
                          </Badge>
                        ))}
                        {doc.keywords.length > 4 && (
                          <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400">
                            +{doc.keywords.length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}