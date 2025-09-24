// AI-powered document processing service for PDFs and other file types
import * as pdfParse from 'pdf-parse';
import { pipeline, Pipeline } from '@xenova/transformers';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentProcessingResult {
  success: boolean;
  document?: ProcessedDocument;
  error?: string;
}

export interface ProcessedDocument {
  id: string;
  filename: string;
  fileType: 'pdf' | 'docx' | 'csv' | 'txt' | 'xlsx' | 'pptx';
  uploadedAt: string;
  fileSize: number;
  filePath: string;
  
  // Extracted content
  extractedText: string;
  summary?: string;
  keywords: string[];
  
  // Vector embedding for semantic search
  embedding?: number[];
  
  // Metadata
  metadata: {
    title?: string;
    author?: string;
    pages?: number;
    createdDate?: string;
  };
}

export interface SearchMatch {
  document: ProcessedDocument;
  score: number;
  matchedSections: Array<{
    text: string;
    context: string;
    startIndex: number;
  }>;
}

class DocumentService {
  private documentsDir: string;
  private databasePath: string;
  private documents: Map<string, ProcessedDocument>;
  private embedder: Pipeline | null = null;
  private isInitialized = false;

  constructor() {
    this.documentsDir = path.join(process.cwd(), 'uploads', 'documents');
    this.databasePath = path.join(process.cwd(), 'data', 'documents.json');
    this.documents = new Map();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create directories if they don't exist
      await fs.ensureDir(this.documentsDir);
      await fs.ensureDir(path.dirname(this.databasePath));

      // Load existing documents from database
      await this.loadDocuments();

      // Initialize the embedding model (lightweight sentence-transformers model)
      console.log('Initializing embedding model...');
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('Embedding model loaded successfully');

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize DocumentService:', error);
      throw error;
    }
  }

  private async loadDocuments(): Promise<void> {
    try {
      if (await fs.pathExists(this.databasePath)) {
        const data = await fs.readJson(this.databasePath);
        this.documents = new Map(data.documents || []);
        console.log(`Loaded ${this.documents.size} documents from database`);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      this.documents = new Map();
    }
  }

  private async saveDocuments(): Promise<void> {
    try {
      const data = {
        documents: Array.from(this.documents.entries()),
        lastUpdated: new Date().toISOString()
      };
      await fs.writeJson(this.databasePath, data, { spaces: 2 });
    } catch (error) {
      console.error('Error saving documents:', error);
      throw error;
    }
  }

  async uploadDocument(file: File | Buffer, filename: string): Promise<DocumentProcessingResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const documentId = uuidv4();
      const fileExtension = path.extname(filename).toLowerCase();
      const fileType = this.getFileType(fileExtension);
      
      if (!fileType) {
        return {
          success: false,
          error: `Unsupported file type: ${fileExtension}`
        };
      }

      // Save file to disk
      const savedFilePath = path.join(this.documentsDir, `${documentId}${fileExtension}`);
      
      let buffer: Buffer;
      if (file instanceof Buffer) {
        buffer = file;
      } else {
        // Convert File to Buffer (for browser uploads)
        buffer = Buffer.from(await file.arrayBuffer());
      }
      
      await fs.writeFile(savedFilePath, buffer);

      // Extract text based on file type
      const extractionResult = await this.extractText(buffer, fileType);
      
      if (!extractionResult.success || !extractionResult.text) {
        return {
          success: false,
          error: extractionResult.error || 'Failed to extract text from document'
        };
      }

      // Generate embedding
      const embedding = await this.generateEmbedding(extractionResult.text);

      // Extract keywords (simple implementation)
      const keywords = this.extractKeywords(extractionResult.text);

      // Create document object
      const document: ProcessedDocument = {
        id: documentId,
        filename,
        fileType,
        uploadedAt: new Date().toISOString(),
        fileSize: buffer.length,
        filePath: savedFilePath,
        extractedText: extractionResult.text,
        keywords,
        embedding,
        metadata: extractionResult.metadata || {}
      };

      // Store document
      this.documents.set(documentId, document);
      await this.saveDocuments();

      console.log(`Successfully processed document: ${filename} (${document.extractedText.length} characters)`);

      return {
        success: true,
        document
      };

    } catch (error) {
      console.error('Error uploading document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private getFileType(extension: string): ProcessedDocument['fileType'] | null {
    const typeMap: Record<string, ProcessedDocument['fileType']> = {
      '.pdf': 'pdf',
      '.docx': 'docx',
      '.doc': 'docx',
      '.csv': 'csv',
      '.txt': 'txt',
      '.xlsx': 'xlsx',
      '.xls': 'xlsx',
      '.pptx': 'pptx',
      '.ppt': 'pptx'
    };
    return typeMap[extension] || null;
  }

  private async extractText(buffer: Buffer, fileType: ProcessedDocument['fileType']): Promise<{
    success: boolean;
    text?: string;
    metadata?: any;
    error?: string;
  }> {
    try {
      switch (fileType) {
        case 'pdf':
          return await this.extractPdfText(buffer);
        
        case 'txt':
          return {
            success: true,
            text: buffer.toString('utf-8'),
            metadata: {}
          };
        
        default:
          return {
            success: false,
            error: `Text extraction not yet implemented for ${fileType} files`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Text extraction failed'
      };
    }
  }

  private async extractPdfText(buffer: Buffer): Promise<{
    success: boolean;
    text?: string;
    metadata?: any;
    error?: string;
  }> {
    try {
      const data = await pdfParse(buffer);
      
      return {
        success: true,
        text: data.text,
        metadata: {
          pages: data.numpages,
          title: data.info?.Title,
          author: data.info?.Author,
          createdDate: data.info?.CreationDate
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embedder) {
      throw new Error('Embedder not initialized');
    }

    try {
      // Truncate text if too long (model has token limits)
      const maxLength = 500;
      const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
      
      const output = await this.embedder(truncatedText, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    } catch (error) {
      console.error('Error generating embedding:', error);
      return [];
    }
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in production you'd use NLP libraries
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));
    
    // Get word frequency
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Return top 10 most frequent words
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'this', 'that', 'these', 'those', 'a', 'an', 'is', 'are', 'was', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'can', 'shall'
    ]);
    return stopWords.has(word);
  }

  async searchDocuments(query: string, limit: number = 10): Promise<SearchMatch[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!query.trim()) {
      return [];
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      const results: SearchMatch[] = [];
      
      for (const document of this.documents.values()) {
        // Skip documents without embeddings
        if (!document.embedding || document.embedding.length === 0) {
          continue;
        }

        // Calculate cosine similarity
        const similarity = this.cosineSimilarity(queryEmbedding, document.embedding);
        
        // Also do keyword matching for hybrid search
        const keywordScore = this.keywordMatch(query, document);
        
        // Combined score (70% semantic, 30% keyword)
        const combinedScore = (similarity * 0.7) + (keywordScore * 0.3);
        
        if (combinedScore > 0.1) { // Minimum threshold
          const matchedSections = this.findMatchingSections(query, document.extractedText);
          
          results.push({
            document,
            score: combinedScore,
            matchedSections
          });
        }
      }
      
      // Sort by score and return top results
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private keywordMatch(query: string, document: ProcessedDocument): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const documentText = document.extractedText.toLowerCase();
    
    const matches = queryWords.filter(word => 
      documentText.includes(word) || 
      document.keywords.some(keyword => keyword.includes(word))
    );
    
    return matches.length / queryWords.length;
  }

  private findMatchingSections(query: string, text: string): Array<{
    text: string;
    context: string;
    startIndex: number;
  }> {
    const queryWords = query.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const matches: Array<{ text: string; context: string; startIndex: number; }> = [];
    
    let currentIndex = 0;
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const hasMatch = queryWords.some(word => lowerSentence.includes(word));
      
      if (hasMatch) {
        matches.push({
          text: sentence.trim(),
          context: sentence.trim(),
          startIndex: currentIndex
        });
      }
      
      currentIndex += sentence.length + 1; // +1 for the delimiter
      
      if (matches.length >= 3) break; // Limit to top 3 matches
    }
    
    return matches;
  }

  async getAllDocuments(): Promise<ProcessedDocument[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return Array.from(this.documents.values());
  }

  async getDocument(id: string): Promise<ProcessedDocument | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.documents.get(id) || null;
  }

  async deleteDocument(id: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const document = this.documents.get(id);
    if (!document) return false;

    try {
      // Remove file from disk
      if (await fs.pathExists(document.filePath)) {
        await fs.unlink(document.filePath);
      }
      
      // Remove from database
      this.documents.delete(id);
      await this.saveDocuments();
      
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }
}

// Export singleton instance
export const documentService = new DocumentService();
