// Simple local embedding service using TF-IDF and word vectors
// This provides semantic-like search without requiring external model downloads

interface WordFrequency {
  [word: string]: number;
}

interface DocumentVector {
  tfidf: WordFrequency;
  normalized: number[];
  wordCount: number;
}

class SimpleEmbeddingService {
  private documents: Map<string, DocumentVector> = new Map();
  private globalWordFreq: WordFrequency = {};
  private totalDocuments = 0;
  private vocabulary: string[] = [];
  private isReady = true; // Always ready since it's local

  // Common English stop words to filter out
  private stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'this', 'that', 'these', 'those', 'a', 'an', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'from', 'as', 'it',
    'he', 'she', 'they', 'we', 'you', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
    'his', 'its', 'our', 'their', 'i', 'am', 'not', 'no', 'yes', 'if', 'when', 'where',
    'what', 'who', 'how', 'why', 'which', 'all', 'any', 'some', 'many', 'most', 'few'
  ]);

  // Simple semantic mappings for basic concept understanding
  private semanticMappings: { [key: string]: string[] } = {
    'fruit': ['apple', 'apples', 'banana', 'bananas', 'orange', 'oranges', 'grape', 'grapes', 'berry', 'berries'],
    'food': ['apple', 'apples', 'banana', 'bananas', 'bread', 'meat', 'vegetable', 'vegetables'],
    'color': ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'black', 'white'],
    'animal': ['dog', 'cat', 'bird', 'fish', 'lion', 'tiger', 'elephant', 'horse'],
    'technology': ['computer', 'software', 'app', 'website', 'digital', 'tech', 'internet'],
    'business': ['company', 'corporation', 'startup', 'enterprise', 'organization', 'firm'],
  };

  async initialize(): Promise<void> {
    console.log('🚀 Using Simple Local Embedding Service (no download required)');
    return Promise.resolve();
  }

  preprocessText(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word));
    
    console.log(`🔤 Preprocessed "${text.substring(0, 50)}..." into words:`, words);
    return words;
  }

  // Expand query terms with semantically related words
  private expandSemanticTerms(words: string[]): string[] {
    const expandedWords = [...words];
    const originalCount = words.length;
    
    words.forEach(word => {
      // Check if this word is a semantic concept that maps to other words
      if (this.semanticMappings[word]) {
        console.log(`🧠 Expanding semantic term "${word}" with:`, this.semanticMappings[word]);
        expandedWords.push(...this.semanticMappings[word]);
      }
      
      // Also check if this word is a target of any semantic mapping (reverse lookup)
      Object.entries(this.semanticMappings).forEach(([concept, targets]) => {
        if (targets.includes(word)) {
          console.log(`🧠 Word "${word}" relates to concept "${concept}"`);
          expandedWords.push(concept);
        }
      });
    });
    
    const uniqueExpanded = [...new Set(expandedWords)]; // Remove duplicates
    const addedCount = uniqueExpanded.length - originalCount;
    
    if (addedCount > 0) {
      console.log(`🔄 Query expansion: ${originalCount} original → ${uniqueExpanded.length} expanded (added ${addedCount} semantic terms)`);
      console.log(`📝 Final expanded query:`, uniqueExpanded);
    } else {
      console.log(`📝 No semantic expansion for terms:`, words);
    }
    
    return uniqueExpanded;
  }

  private calculateTFIDF(words: string[]): WordFrequency {
    const wordFreq: WordFrequency = {};
    
    // Calculate term frequency (TF)
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Normalize by document length
    const docLength = words.length;
    Object.keys(wordFreq).forEach(word => {
      wordFreq[word] = wordFreq[word] / docLength;
    });

    return wordFreq;
  }

  private calculateIDF(): void {
    // Calculate inverse document frequency for each word in vocabulary
    this.vocabulary = Array.from(new Set(Object.keys(this.globalWordFreq)));
    
    this.vocabulary.forEach(word => {
      let docCount = 0;
      this.documents.forEach(doc => {
        if (doc.tfidf[word] > 0) docCount++;
      });
      
      // Update global frequency with IDF
      if (docCount > 0) {
        this.globalWordFreq[word] = Math.log(this.totalDocuments / docCount);
      }
    });
  }

  async getEmbedding(text: string, documentId?: string): Promise<number[]> {
    const words = this.preprocessText(text);
    
    // Apply semantic expansion to understand related concepts
    const expandedWords = this.expandSemanticTerms(words);
    
    if (expandedWords.length === 0) {
      return new Array(100).fill(0); // Return zero vector
    }

    // Calculate TF-IDF with semantically expanded terms
    const tfidf = this.calculateTFIDF(expandedWords);

    // Create a simple vector representation
    // Use top 100 most common words as features
    const vector = new Array(100).fill(0);
    
    // Update vocabulary and global frequencies (use original words for vocab)
    Object.keys(tfidf).forEach(word => {
      this.globalWordFreq[word] = (this.globalWordFreq[word] || 0) + 1;
    });

    // If we have a document ID, store it for later TF-IDF calculation
    if (documentId) {
      this.documents.set(documentId, {
        tfidf,
        normalized: [],
        wordCount: expandedWords.length
      });
      this.totalDocuments = this.documents.size;
    }

    // Create vector based on word importance and semantic clustering
    const uniqueWords = Array.from(new Set(expandedWords));
    uniqueWords.forEach((word) => {
      const vectorIndex = this.hashWord(word) % 100;
      const frequency = tfidf[word] || 0;
      
      // Add semantic weight based on word characteristics
      let semanticWeight = 1;
      if (word.length > 6) semanticWeight *= 1.2; // Longer words often more important
      if (word.endsWith('ing') || word.endsWith('tion')) semanticWeight *= 1.1; // Action/process words
      
      // Boost semantic concepts
      if (this.semanticMappings[word]) {
        semanticWeight *= 1.5; // Boost conceptual terms like "fruit", "food", etc.
      }
      
      vector[vectorIndex] += frequency * semanticWeight;
    });

    // Normalize the vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return vector.map(val => val / magnitude);
    }

    return vector;
  }

  private hashWord(word: string): number {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      const char = word.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length || vectorA.length === 0) {
      return 0;
    }

    try {
      const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
      const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
      const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

      if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
      }

      const similarity = dotProduct / (magnitudeA * magnitudeB);
      return Math.max(0, Math.min(1, similarity)); // Clamp between 0-1
    } catch (error) {
      console.warn('Error calculating similarity:', error);
      return 0;
    }
  }

  async batchGetEmbeddings(texts: string[]): Promise<number[][]> {
    console.log(`🔄 Generating local embeddings for ${texts.length} texts...`);
    const embeddings = await Promise.all(
      texts.map((text, i) => this.getEmbedding(text, `batch_${i}`))
    );
    console.log(`✅ Generated ${embeddings.length} local embeddings`);
    return embeddings;
  }

  isModelReady(): boolean {
    return this.isReady;
  }

  getDimensions(): number {
    return 100; // Our simple vector is 100-dimensional
  }

  getModelInfo() {
    return {
      name: 'Simple Local TF-IDF',
      dimensions: this.getDimensions(),
      quantized: false,
      description: 'Local word-frequency based embeddings'
    };
  }

  // Method to improve similarity over time by learning from document relationships
  updateVocabulary(): void {
    if (this.totalDocuments > 1) {
      this.calculateIDF();
      console.log(`📚 Updated vocabulary with ${this.vocabulary.length} unique terms from ${this.totalDocuments} documents`);
    }
  }

  // Get semantic mappings that were triggered for a query
  getSemanticMappings(query: string): { concept: string; matchedWords: string[] } | undefined {
    const queryWords = this.preprocessText(query);
    
    for (const [concept, mappedWords] of Object.entries(this.semanticMappings)) {
      const matchingWords = mappedWords.filter(word => 
        queryWords.includes(word.toLowerCase()) || 
        queryWords.some(qWord => qWord.includes(word.toLowerCase()) || word.toLowerCase().includes(qWord))
      );
      
      if (matchingWords.length > 0) {
        console.log(`🔗 Semantic mapping triggered: "${query}" (${concept}) → [${matchingWords.join(', ')}]`);
        return { concept, matchedWords: matchingWords };
      }
      
      // Also check if the query itself matches a concept
      if (queryWords.includes(concept)) {
        console.log(`🔗 Concept match: "${query}" → ${concept} → [${mappedWords.join(', ')}]`);
        return { concept, matchedWords: mappedWords };
      }
    }
    
    return undefined;
  }
}

export const simpleEmbeddingService = new SimpleEmbeddingService();
export default simpleEmbeddingService;
