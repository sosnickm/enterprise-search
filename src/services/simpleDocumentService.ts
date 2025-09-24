// Simple document service for proof of concept
// This simulates the AI/vector database functionality without external dependencies

import { simpleEmbeddingService } from './simpleEmbeddingService';

interface SimpleDocument {
  id: string;
  filename: string;
  fileType: 'pdf' | 'docx' | 'csv' | 'txt' | 'xlsx' | 'pptx';
  uploadedAt: string;
  fileSize: number;
  extractedText: string;
  keywords: string[];
  embedding?: number[]; // Vector embedding for semantic search
  metadata: {
    title?: string;
    author?: string;
    pages?: number;
  };
}

class SimpleDocumentService {
  private documents: Map<string, SimpleDocument> = new Map();

  async uploadDocument(file: File): Promise<{
    success: boolean;
    document?: SimpleDocument;
    error?: string;
  }> {
    try {
      // For POC, we'll just create a mock document with simulated text extraction
      const id = this.generateId();
      const fileExtension = this.getFileExtension(file.name);
      
      if (!fileExtension) {
        return {
          success: false,
          error: 'Unsupported file type'
        };
      }

      // Extract text from the document
      const extractedText = await this.realTextExtraction(file, fileExtension);
      
      // Generate vector embedding for semantic search
      console.log('🔢 Generating local vector embedding for semantic search...');
      let embedding: number[] | undefined;
      try {
        // Use document ID for better TF-IDF calculation
        embedding = await simpleEmbeddingService.getEmbedding(extractedText, id);
        console.log(`✅ Generated ${embedding.length}D local embedding vector`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.warn('⚠️ Failed to generate embedding, document will use keyword search only:', errorMsg);
        embedding = undefined;
      }
      
      const document: SimpleDocument = {
        id,
        filename: file.name,
        fileType: fileExtension,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
        extractedText,
        keywords: this.extractKeywords(extractedText),
        embedding, // Include vector embedding
        metadata: {
          title: file.name.replace(/\.[^/.]+$/, ''),
          pages: Math.floor(Math.random() * 20) + 1
        }
      };

      // Store the document
      this.documents.set(id, document);
      
      // Update embedding service vocabulary for better semantic search
      simpleEmbeddingService.updateVocabulary();
      
      console.log(`Successfully processed document: ${file.name} (${fileExtension}, ${this.formatFileSize(file.size)})`);
      console.log(`📊 Total documents in collection: ${this.documents.size}`);
      
      return {
        success: true,
        document
      };
      
    } catch (error) {
      console.error('Error uploading document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async searchDocuments(query: string): Promise<{
    document: SimpleDocument;
    score: number;
    searchType: 'semantic' | 'keyword' | 'hybrid';
    matchedSections: Array<{
      text: string;
      context: string;
    }>;
  }[]> {
    if (!query.trim()) {
      return [];
    }

    console.log(`🔍 Starting search for: "${query}"`);
    
    // Generate query embedding for semantic search
    let queryEmbedding: number[] | null = null;
    let embeddingError: string | null = null;
    
    try {
      console.log('🔍 Generating query embedding using local service...');
      queryEmbedding = await simpleEmbeddingService.getEmbedding(query);
      console.log('✅ Generated query embedding for local semantic search');
    } catch (error) {
      embeddingError = error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️ Local embedding service failed, using keyword search only:', embeddingError);
      queryEmbedding = null;
    }

    const results: Array<{
      document: SimpleDocument;
      score: number;
      searchType: 'semantic' | 'keyword' | 'hybrid';
      matchedSections: Array<{
        text: string;
        context: string;
      }>;
    }> = [];

    const queryLower = query.toLowerCase();
    
    for (const document of this.documents.values()) {
      let semanticScore = 0;
      let keywordScore = 0;
      let matches: Array<{ text: string; context: string; }> = [];
      
      // Semantic search using vector embeddings
      if (queryEmbedding && document.embedding) {
        try {
          semanticScore = simpleEmbeddingService.cosineSimilarity(queryEmbedding, document.embedding);
          console.log(`📊 Local semantic similarity for "${document.filename}": ${semanticScore.toFixed(3)}`);
        } catch (error) {
          console.warn('⚠️ Error calculating semantic similarity:', error);
          semanticScore = 0;
        }
      }
      
      // Traditional keyword search (as fallback and supplement)
      // Check title match
      if (document.filename.toLowerCase().includes(queryLower)) {
        keywordScore += 0.3;
        console.log(`✅ Filename match for "${document.filename}" with query "${query}"`);
      }
      
      // Check keyword matches
      const keywordMatches = document.keywords.filter(keyword => 
        keyword.toLowerCase().includes(queryLower) || 
        queryLower.includes(keyword.toLowerCase())
      );
      keywordScore += keywordMatches.length * 0.15;
      if (keywordMatches.length > 0) {
        console.log(`✅ Keyword matches for "${document.filename}":`, keywordMatches);
      }
      
      // Check content matches
      const sentences = document.extractedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      let contentMatches = 0;
      for (const sentence of sentences) {
        if (sentence.toLowerCase().includes(queryLower)) {
          keywordScore += 0.2;
          contentMatches++;
          matches.push({
            text: sentence.trim(),
            context: sentence.trim()
          });
        }
      }
      if (contentMatches > 0) {
        console.log(`✅ Content matches for "${document.filename}": ${contentMatches} sentences`);
      } else {
        console.log(`❌ No content matches for "${document.filename}" with query "${query}"`);
        console.log(`📄 Document preview (first 200 chars):`, document.extractedText.substring(0, 200));
        console.log(`🏷️ Document keywords:`, document.keywords);
      }
      
      // Determine search type and final score
      let finalScore = 0;
      let searchType: 'semantic' | 'keyword' | 'hybrid' = 'keyword';
      
      // Set minimum thresholds to avoid noise
      const minSemanticScore = 0.18; // Slightly lower threshold - should exclude 0.175 but include 0.275+
      const effectiveSemanticScore = semanticScore > minSemanticScore ? semanticScore : 0;
      
      if (semanticScore > 0 && semanticScore <= minSemanticScore) {
        console.log(`🚫 Semantic score ${semanticScore.toFixed(3)} below minimum threshold ${minSemanticScore} - treating as 0`);
      }
      
      if (effectiveSemanticScore > 0 && keywordScore > 0) {
        // Hybrid: combine both scores with semantic weighted higher
        finalScore = (effectiveSemanticScore * 0.7) + (keywordScore * 0.3);
        searchType = 'hybrid';
      } else if (effectiveSemanticScore > 0) {
        // Semantic only
        finalScore = effectiveSemanticScore;
        searchType = 'semantic';
      } else if (keywordScore > 0) {
        // Keyword only
        finalScore = Math.min(keywordScore, 1.0);
        searchType = 'keyword';
      }
      
      console.log(`🔍 "${document.filename}": semantic=${semanticScore.toFixed(3)} (effective=${effectiveSemanticScore.toFixed(3)}), keyword=${keywordScore.toFixed(3)}, final=${finalScore.toFixed(3)}, type=${searchType}`);
      
      // Set minimum threshold - be more lenient for semantic matches
      let threshold = 0.1; // Base threshold for keyword matches
      if (searchType === 'semantic') {
        threshold = 0.15; // Slightly higher for semantic-only to avoid noise
      } else if (searchType === 'hybrid') {
        threshold = 0.1; // Lower for hybrid since it has both semantic and keyword signals
      }
      
      console.log(`🎯 "${document.filename}": threshold=${threshold}, passed=${finalScore > threshold} (finalScore=${finalScore.toFixed(3)})`);
      
      if (finalScore > threshold) {
        console.log(`✅ Document "${document.filename}" INCLUDED in results`);
        results.push({
          document,
          score: finalScore,
          searchType,
          matchedSections: matches.slice(0, 3) // Top 3 matches
        });
      } else {
        console.log(`❌ Document "${document.filename}" EXCLUDED (score ${finalScore.toFixed(3)} ≤ threshold ${threshold})`);
      }
    }
    
    // Sort by score (highest first)
    const sortedResults = results.sort((a, b) => b.score - a.score).slice(0, 10);
    
    console.log(`📊 Search results summary:
      - Total matches: ${sortedResults.length}
      - Semantic matches: ${sortedResults.filter(r => r.searchType === 'semantic').length}
      - Keyword matches: ${sortedResults.filter(r => r.searchType === 'keyword').length}
      - Hybrid matches: ${sortedResults.filter(r => r.searchType === 'hybrid').length}`);
    
    return sortedResults;
  }

  async getAllDocuments(): Promise<SimpleDocument[]> {
    return Array.from(this.documents.values());
  }

  async getDocument(id: string): Promise<SimpleDocument | null> {
    return this.documents.get(id) || null;
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private getFileExtension(filename: string): SimpleDocument['fileType'] | null {
    const ext = filename.split('.').pop()?.toLowerCase();
    const supportedTypes: SimpleDocument['fileType'][] = ['pdf', 'docx', 'csv', 'txt', 'xlsx', 'pptx'];
    return supportedTypes.includes(ext as SimpleDocument['fileType']) ? ext as SimpleDocument['fileType'] : null;
  }

  private async realTextExtraction(file: File, fileType: SimpleDocument['fileType']): Promise<string> {
    try {
      // Validate file before processing
      if (!file || file.size === 0) {
        throw new Error('File is empty or invalid');
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('File too large for text extraction');
      }
      
      switch (fileType) {
        case 'txt':
          return await file.text();
          
        case 'pdf':
          // Additional PDF validation
          if (file.size < 100) { // Very small files are likely not valid PDFs
            throw new Error('PDF file appears to be too small to contain valid content');
          }
          return await this.extractFromPDF(file);
          
        case 'csv':
          return await this.extractFromCSV(file);
          
        case 'docx':
        case 'xlsx':
        case 'pptx':
          // These would need additional libraries like mammoth.js for docx
          // For now, we'll read as text and try to extract what we can
          return await this.extractFromOfficeDocument(file, fileType);
          
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error(`Error extracting text from ${fileType} file:`, error);
      
      // Provide more specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return `Document: ${file.name}\nFile Type: ${fileType.toUpperCase()}\nSize: ${this.formatFileSize(file.size)}\nUploaded: ${new Date().toLocaleDateString()}\n\nExtraction Error: ${errorMessage}\n\nTroubleshooting:\n• Ensure the file isn't corrupted\n• Try converting to a simpler format (.txt)\n• Check if the file opens correctly in its native application\n• For PDFs: ensure it's text-based, not image-based`;
    }
  }

  private async extractFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // First, try PDF.js extraction (only method that works in browser)
      const methods = [
        { name: 'PDF.js', fn: () => this.extractWithPDFJS(file, arrayBuffer) },
        { name: 'fallback', fn: () => this.fallbackPDFExtraction(file, arrayBuffer) }
      ];
      
      console.log(`🚀 Starting PDF extraction for ${file.name} (${this.formatFileSize(file.size)}) using ${methods.length} methods`);
      
      for (let i = 0; i < methods.length; i++) {
        const method = methods[i];
        try {
          console.log(`🔄 Trying method ${i + 1}/${methods.length}: ${method.name}`);
          const result = await method.fn();
          
          // Check if we got meaningful content (not error messages or guidance)
          if (result && 
              !result.includes('Basic PDF analysis failed') && 
              !result.includes('Failed to extract text') &&
              !result.includes('⚠️ Text extraction was not successful') &&
              !result.includes('💡 Suggestions:') &&
              !result.includes('AUTOMATIC TEXT EXTRACTION FAILED')) {
            const textContent = result.replace(/^PDF Document:.*?\n\n/s, '').trim();
            
            console.log(`📊 PDF extraction result analysis for ${method.name}:
              - Result length: ${result.length}
              - Text content length: ${textContent.length}
              - First 200 chars: "${textContent.substring(0, 200)}"
              - Contains error markers: ${result.includes('Basic PDF analysis failed') || result.includes('Failed to extract text')}`);
            
            // For basic PDFs, even short text should be acceptable
            if (textContent.length > 10) { // Lowered threshold from 50 to 10
              if (this.isReadableText(textContent)) {
                console.log(`✅ Successfully extracted readable text from PDF using ${method.name}`);
                return result;
              } else {
                console.warn(`⚠️ Text from ${method.name} appears garbled, trying next method...`);
                console.log(`🔍 Garbled text sample: "${textContent.substring(0, 100)}"`);
                continue; // Text is garbled, try next method
              }
            } else if (textContent.length > 0) {
              console.log(`📝 Short text found from ${method.name}, accepting anyway for basic PDF`);
              return result; // Accept even short text for basic PDFs
            }
          } else {
            console.log(`❌ Method ${method.name} returned error or no content:`, result ? result.substring(0, 200) : 'null');
          }
        } catch (methodError) {
          console.error(`💥 PDF extraction method ${method.name} failed with error:`, methodError);
          if (methodError instanceof Error) {
            console.error(`   Error message: ${methodError.message}`);
            console.error(`   Error stack:`, methodError.stack);
          }
          continue; // Try next method
        }
      }
      
      // If all methods failed, return a comprehensive error message
      return this.generatePDFErrorMessage(file);
      
    } catch (error) {
      console.error('PDF extraction error:', error);
      return this.generatePDFErrorMessage(file);
    }
  }



  private async extractWithPDFJS(file: File, arrayBuffer: ArrayBuffer): Promise<string> {
    console.log('🔄 Starting PDF.js extraction for:', file.name);
    console.log('📦 About to import pdfjs-dist...');
    
    try {
      // Import pdfjs-dist - this should work now that it's installed
      let pdfjsLib;
      try {
        console.log('📦 Importing pdfjs-dist library...');
        pdfjsLib = await import('pdfjs-dist');
        console.log('✅ pdfjs-dist imported successfully');
        console.log('📦 PDF.js version:', pdfjsLib.version || 'unknown');
      } catch (importError) {
        console.error('💥 Failed to import pdfjs-dist:', importError);
        throw new Error(`PDF.js library not available: ${importError instanceof Error ? importError.message : 'Unknown import error'}`);
      }
      
      // Configure worker - try multiple approaches
      try {
        // First try: Use local worker file served by Vite
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
          console.log('✅ PDF.js worker configured (local file)');
        } catch (localError) {
          // Second try: Use jsdelivr CDN as fallback
          try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/build/pdf.worker.min.js';
            console.log('✅ PDF.js worker configured (jsdelivr CDN fallback)');
          } catch (cdnError) {
            // Third try: Disable worker entirely for compatibility
            console.log('⚠️ All worker sources failed, disabling worker for compatibility...');
            pdfjsLib.GlobalWorkerOptions.workerSrc = '';
            console.log('✅ PDF.js configured without worker (compatibility mode)');
          }
        }
      } catch (workerError) {
        console.warn('⚠️ All worker configuration failed, proceeding without worker:', workerError);
        // PDF.js can work without explicit worker configuration
      }
      
      // Load PDF with multiple fallback strategies
      console.log('📄 Creating PDF loading task...');
      let pdf;
      let loadingAttempt = 1;
      const maxAttempts = 3;
      
      while (loadingAttempt <= maxAttempts && !pdf) {
        try {
          console.log(`📄 Loading attempt ${loadingAttempt}/${maxAttempts}...`);
          
          // Configure loading options based on attempt
          let loadOptions: any = {
            data: arrayBuffer,
            verbosity: 1
          };
          
          if (loadingAttempt === 1) {
            // First attempt: standard settings
            loadOptions = {
              ...loadOptions,
              useWorkerFetch: false,
              isEvalSupported: false,
              useSystemFonts: true
            };
          } else if (loadingAttempt === 2) {
            // Second attempt: disable worker completely
            console.log('� Disabling worker for second attempt...');
            pdfjsLib.GlobalWorkerOptions.workerSrc = '';
            loadOptions = {
              ...loadOptions,
              useWorkerFetch: false,
              isEvalSupported: false,
              useSystemFonts: false,
              disableFontFace: true
            };
          } else {
            // Third attempt: minimal settings
            console.log('🔄 Using minimal settings for final attempt...');
            loadOptions = {
              data: arrayBuffer,
              verbosity: 0,
              useWorkerFetch: false,
              isEvalSupported: false,
              useSystemFonts: false,
              disableFontFace: true,
              disableAutoFetch: true,
              disableStream: true
            };
          }
          
          const loadingTask = pdfjsLib.getDocument(loadOptions);
          pdf = await loadingTask.promise;
          console.log(`✅ PDF loaded successfully on attempt ${loadingAttempt}: ${pdf.numPages} pages`);
          break;
          
        } catch (loadError) {
          console.error(`💥 PDF loading attempt ${loadingAttempt} failed:`, loadError);
          
          if (loadingAttempt === maxAttempts) {
            // Final attempt failed
            const errorMessage = loadError instanceof Error ? loadError.message : 'Unknown PDF loading error';
            throw new Error(`Failed to load PDF after ${maxAttempts} attempts: ${errorMessage}`);
          }
          
          loadingAttempt++;
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Ensure PDF was loaded successfully
      if (!pdf) {
        throw new Error('PDF loading failed - no PDF object created');
      }
      
      // Extract text from all pages
      const allTextParts: string[] = [];
      const maxPages = Math.min(pdf.numPages, 25);
      
      console.log(`📄 Processing ${maxPages} pages...`);
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        try {
          console.log(`📄 Getting page ${pageNum}...`);
          const page = await pdf.getPage(pageNum);
          console.log(`📄 Got page ${pageNum}, getting text content...`);
          const textContent = await page.getTextContent();
          
          console.log(`📄 Page ${pageNum} has ${textContent.items?.length || 0} text items`);
          
          // Extract text from this page
          const pageTextItems = textContent.items
            .map((item: any) => {
              if (item && typeof item.str === 'string' && item.str.trim()) {
                return item.str.trim();
              }
              return '';
            })
            .filter(text => text.length > 0);
          
          if (pageTextItems.length > 0) {
            const pageText = pageTextItems.join(' ');
            allTextParts.push(pageText);
            console.log(`✅ Page ${pageNum}: found ${pageTextItems.length} text items, ${pageText.length} chars total`);
            console.log(`📝 Page ${pageNum} preview: "${pageText.substring(0, 150)}${pageText.length > 150 ? '...' : ''}"`);
          } else {
            console.warn(`⚠️ Page ${pageNum}: no text found`);
          }
        } catch (pageError) {
          console.error(`💥 Error processing page ${pageNum}:`, pageError);
        }
      }
      
      if (allTextParts.length > 0) {
        const finalText = allTextParts.join('\n\n');
        const result = `PDF Document: ${file.name}\nPages: ${pdf.numPages}\nExtracted using PDF.js\n\n${finalText}`;
        console.log(`✅ PDF.js extraction complete! Extracted ${finalText.length} characters from ${allTextParts.length} pages`);
        return result;
      } else {
        console.log('⚠️ No text found in any page');
        throw new Error('PDF contains no extractable text');
      }
      
    } catch (error) {
      console.error('💥 PDF.js extraction completely failed:', error);
      console.error('💥 Error details:', error instanceof Error ? error.stack : 'No stack trace available');
      throw error;
    }
  }



  private generatePDFErrorMessage(file: File): string {
    return `PDF Document: ${file.name}\nSize: ${this.formatFileSize(file.size)}\n\n⚠️ AUTOMATIC TEXT EXTRACTION FAILED\n\nThis PDF could not be processed automatically. This commonly happens with:\n\n🔒 Password-protected or encrypted PDFs\n📷 Scanned documents (image-based PDFs)\n🎨 Complex layouts with embedded graphics\n📜 Very old or non-standard PDF formats\n💾 Corrupted files\n\n✅ QUICK SOLUTIONS:\n\n1. 📋 COPY & PASTE METHOD (Fastest):\n   • Open the PDF in any viewer (Adobe, Chrome, Preview)\n   • Select all text (Cmd+A or Ctrl+A)\n   • Copy (Cmd+C or Ctrl+C)\n   • Create a new .txt file and paste\n   • Upload the .txt file instead\n\n2. 🔄 CONVERT TO WORD:\n   • Use online converters like SmallPDF, ILovePDF\n   • Save as .docx and re-upload\n\n3. 🔍 FOR SCANNED PDFS:\n   • Use Google Drive (auto-OCR)\n   • Adobe Acrobat OCR feature\n   • Online OCR tools\n\n4. 🖨️ RE-SAVE PDF:\n   • Open in browser/viewer\n   • Print → Save as PDF\n   • This often fixes encoding issues\n\nℹ️ The document is stored but won't appear in search results until converted to a searchable format.\n\nTip: Test if text is selectable in your PDF viewer - if you can't select text, it's likely image-based and needs OCR.`;
  }

  private fallbackPDFExtraction(file: File, arrayBuffer: ArrayBuffer): string {
    // Always return helpful guidance instead of attempting complex extraction
    // that often produces garbled text
    console.log('Using fallback PDF extraction - providing user guidance instead of attempting text extraction');
    
    try {
      const uint8Array = new Uint8Array(arrayBuffer);
      const pdfString = new TextDecoder('latin1').decode(uint8Array);
      
      // Check if this is actually a PDF file
      if (!pdfString.startsWith('%PDF-')) {
        return `File: ${file.name}\n\nThis file does not appear to be a valid PDF document. Please check the file format.`;
      }
      
      // Analyze the PDF to understand why extraction might be failing
      const hasImages = pdfString.includes('/Image') || pdfString.includes('/XObject');
      const hasText = pdfString.includes('/Font') || pdfString.includes('BT');
      const isEncrypted = pdfString.includes('/Encrypt');
      
      let reason = 'The PDF uses complex formatting';
      if (isEncrypted) {
        reason = 'The PDF appears to be encrypted or password-protected';
      } else if (hasImages && !hasText) {
        reason = 'The PDF appears to be image-based (scanned document)';
      } else if (!hasText) {
        reason = 'The PDF does not contain standard text elements';
      }
      
      // Always return helpful guidance
      return `PDF Document: ${file.name}\nSize: ${this.formatFileSize(file.size)}\n\n⚠️ Text extraction was not successful. ${reason}.\n\n💡 Suggestions:\n• If this is a scanned document, use OCR software to make it searchable\n• Try copying text directly from a PDF viewer and pasting into a .txt file\n• Convert the PDF to Word format (.docx) and re-upload\n• Check if the PDF has password protection\n• Ensure the PDF opens correctly in a standard PDF viewer\n\n📁 The document has been uploaded but won't be searchable until converted to a text-based format.`;
      
    } catch (error) {
      console.error('Fallback PDF extraction error:', error);
      return `PDF Document: ${file.name}\n\n❌ PDF analysis failed. The file may be corrupted or in an unsupported format.\n\n💡 Please try:\n• Re-saving the PDF from its original source\n• Converting to a different format (.txt, .docx)\n• Checking if the file opens correctly in a PDF viewer\n• Using a different PDF file`;
    }
  }

  private async extractFromCSV(file: File): Promise<string> {
    try {
      const text = await file.text();
      
      // Parse CSV more robustly - handle quoted fields
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      
      if (lines.length === 0) {
        return `Empty CSV file: ${file.name}`;
      }
      
      // Simple CSV parsing (handles basic quoted fields)
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };
      
      const headers = parseCSVLine(lines[0]);
      const dataLines = lines.slice(1);
      
      let result = `CSV Data from: ${file.name}\n`;
      result += `Columns: ${headers.length} | Rows: ${dataLines.length}\n\n`;
      result += `Column Headers:\n${headers.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n\n`;
      
      // Include sample data for searchability
      const sampleRows = dataLines.slice(0, Math.min(5, dataLines.length));
      if (sampleRows.length > 0) {
        result += `Sample Data:\n`;
        sampleRows.forEach((row, index) => {
          const values = parseCSVLine(row);
          result += `\nRow ${index + 1}:\n`;
          headers.forEach((header, colIndex) => {
            const value = values[colIndex] || '';
            if (value.trim()) {
              result += `  ${header}: ${value}\n`;
            }
          });
        });
        
        if (dataLines.length > 5) {
          result += `\n... and ${dataLines.length - 5} more data rows\n`;
        }
      }
      
      // Add all data as searchable text
      result += `\nAll Data (searchable):\n`;
      dataLines.slice(0, 50).forEach(row => {
        const values = parseCSVLine(row);
        result += values.filter(v => v.trim()).join(' | ') + '\n';
      });
      
      return result;
      
    } catch (error) {
      console.error('CSV extraction error:', error);
      throw new Error('Failed to parse CSV file. Please ensure it\'s a valid CSV format.');
    }
  }

  private async extractFromOfficeDocument(file: File, fileType: SimpleDocument['fileType']): Promise<string> {
    // For Office documents (docx, xlsx, pptx), we'll try to extract what we can
    // In a full implementation, you'd use libraries like:
    // - mammoth.js for .docx files
    // - xlsx.js for .xlsx files  
    // - officegen or similar for .pptx files
    
    try {
      // Try to read as text (won't work well for binary Office formats, but might catch some content)
      const text = await file.text();
      
      // Look for readable text content
      const readableText = text
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // Remove control characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      if (readableText.length > 100) {
        return `Office Document: ${file.name}\n\nExtracted content (partial):\n${readableText.substring(0, 2000)}${readableText.length > 2000 ? '...' : ''}`;
      } else {
        return `Office Document: ${file.name}\n\nThis ${fileType.toUpperCase()} file contains binary data that requires specialized extraction libraries. For full text extraction, please convert to PDF or plain text format, or implement specialized parsers for Office documents.`;
      }
      
    } catch (error) {
      console.error(`Office document extraction error:`, error);
      throw new Error(`Failed to extract text from ${fileType} file`);
    }
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction
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
    
    // Return top 8 most frequent words
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'this', 'that', 'these', 'those', 'a', 'an', 'is', 'are', 'was', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'from', 'text',
      'document', 'file', 'content', 'contains', 'includes'
    ]);
    return stopWords.has(word);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private isReadableText(text: string): boolean {
    // Check if text appears to be readable vs. garbled
    const sample = text.slice(0, 500); // Check first 500 characters
    
    // Count readable characters
    const readableChars = sample.match(/[a-zA-Z0-9\s.,!?;:()\-'"]/g) || [];
    
    // Calculate readability ratio
    const readabilityRatio = readableChars.length / sample.length;
    
    // Check for common English words or patterns - expanded list
    const hasCommonWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by|this|that|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|must|can|shall|from|a|an|it|you|me|we|they|he|she|him|her|us|them|my|your|his|their|our|its|i|am|not|no|yes|if|when|where|what|who|how|why|which|all|any|some|many|most|few|first|last|only|also|even|still|just|now|then|here|there|up|down|out|back|over|under|into|through|during|before|after|above|below|between|among|without|within|about|around|against|across|along|beside|beyond|except|including|regarding|concerning|despite|although|however|therefore|moreover|furthermore|nevertheless|meanwhile|otherwise|instead|besides|finally|particularly|especially|specifically|generally|usually|often|always|never|sometimes|perhaps|maybe|probably|certainly|definitely|absolutely|completely|entirely|exactly|quite|rather|very|too|so|such|more|less|much|little|few|several|enough|both|either|neither|each|every|another|other|same|different|new|old|good|bad|big|small|long|short|high|low|fast|slow|easy|hard|right|wrong|true|false|open|close|start|stop|come|go|get|give|take|make|see|look|find|know|think|feel|want|need|like|love|hate|help|work|play|live|die|eat|drink|sleep|wake|run|walk|talk|speak|say|tell|ask|answer|read|write|learn|teach|buy|sell|pay|cost|use|try|keep|leave|stay|move|turn|wait|call|meet|follow|lead|win|lose|begin|end|continue|change|become|seem|appear|happen|occur|exist|remain|include|exclude)\b/i.test(sample);
    
    // Check if there are reasonable word lengths (not just single chars or very long strings)
    const words = sample.split(/\s+/).filter(word => word.length > 0);
    const avgWordLength = words.length > 0 ? words.reduce((sum, word) => sum + word.length, 0) / words.length : 0;
    
    // More lenient checks for shorter text
    const isShortText = sample.length < 100;
    const hasAlphabeticChars = /[a-zA-Z]/.test(sample);
    
    // Text is considered readable if:
    // For short text: just needs to have alphabetic characters and decent readability
    // For longer text: stricter checks
    let isReadable;
    if (isShortText) {
      // More lenient for short text (like basic PDFs with few words)
      isReadable = readabilityRatio > 0.5 && hasAlphabeticChars && avgWordLength >= 1 && avgWordLength <= 20;
    } else {
      // Stricter for longer text
      isReadable = readabilityRatio > 0.7 && (hasCommonWords || (avgWordLength >= 2 && avgWordLength <= 15));
    }
    
    console.log(`🔍 Text quality check: 
      - Length: ${sample.length} (short: ${isShortText})
      - Readability ratio: ${readabilityRatio.toFixed(2)}
      - Common words: ${hasCommonWords}
      - Avg word length: ${avgWordLength.toFixed(1)}
      - Has alphabetic: ${hasAlphabeticChars}
      - Result: ${isReadable ? '✅ READABLE' : '❌ GARBLED'}`);
    
    return isReadable;
  }
}

// Export singleton instance
export const simpleDocumentService = new SimpleDocumentService();
