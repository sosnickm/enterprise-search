// Embedding service using Hugging Face Transformers for local vector embeddings
// Provides free, privacy-preserving semantic search capabilities

import { pipeline } from '@xenova/transformers';

class EmbeddingService {
  private model: any = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.model) {
      return; // Already initialized
    }

    if (this.isInitializing) {
      // If initialization is in progress, wait for it
      return this.initPromise!;
    }

    this.isInitializing = true;
    console.log('🤖 Initializing embedding model (all-MiniLM-L6-v2)...');
    console.log('📥 This may take a moment for the first download (~50MB)...');

    this.initPromise = this._doInitialize();
    await this.initPromise;
    this.isInitializing = false;
  }

  private async _doInitialize(): Promise<void> {
    try {
      console.log('🔄 Attempting to load embedding model...');
      
      // Try different model loading strategies
      const modelStrategies = [
        {
          name: 'all-MiniLM-L6-v2',
          config: {
            quantized: true,
            local_files_only: false,
            cache_dir: './.cache',
            revision: 'main'
          }
        },
        {
          name: 'Xenova/all-MiniLM-L6-v2',
          config: {
            quantized: false,
            local_files_only: false,
            cache_dir: './.cache'
          }
        },
        {
          name: 'sentence-transformers/all-MiniLM-L6-v2',
          config: {
            quantized: true,
            local_files_only: false
          }
        }
      ];

      for (const strategy of modelStrategies) {
        try {
          console.log(`🔄 Trying model: ${strategy.name}`);
          
          this.model = await pipeline(
            'feature-extraction', 
            strategy.name,
            {
              ...strategy.config,
              progress_callback: (progress: any) => {
                if (progress.status === 'downloading') {
                  console.log(`📥 Downloading ${strategy.name}: ${Math.round(progress.progress || 0)}%`);
                } else if (progress.status === 'loading') {
                  console.log(`📦 Loading ${strategy.name}...`);
                }
              }
            }
          );
          
          if (this.model) {
            console.log(`✅ Successfully loaded model: ${strategy.name}`);
            return;
          }
        } catch (strategyError) {
          console.warn(`⚠️ Failed to load ${strategy.name}:`, strategyError);
          continue;
        }
      }

      // If all strategies failed, throw error
      throw new Error('All model loading strategies failed');
      
    } catch (error) {
      console.error('💥 Failed to initialize any embedding model:', error);
      
      // Check if it's a network/JSON parsing error
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.error('🌐 Network or JSON parsing error - this usually means:');
        console.error('   - Hugging Face Hub is temporarily unavailable');
        console.error('   - Network connectivity issues');
        console.error('   - CORS or firewall blocking the request');
        console.error('💡 The system will fall back to keyword-only search');
      }
      
      this.model = null;
      this.isInitializing = false;
      throw error;
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    if (!this.model) {
      await this.initialize();
    }

    if (!this.model) {
      throw new Error('Embedding model not available');
    }

    try {
      // Preprocess text for better embeddings
      const cleanText = this.preprocessText(text);
      
      if (cleanText.length === 0) {
        // Return zero vector for empty text
        return new Array(384).fill(0);
      }

      // Generate embedding with mean pooling
      const output = await this.model(cleanText, { 
        pooling: 'mean',
        normalize: true
      });

      // Convert to regular array
      const embedding: number[] = Array.from(output.data);
      
      console.log(`🔢 Generated embedding for text (${cleanText.length} chars) -> ${embedding.length}D vector`);
      return embedding;
    } catch (error) {
      console.error('💥 Error generating embedding:', error);
      // Return zero vector as fallback
      return new Array(384).fill(0);
    }
  }

  private preprocessText(text: string): string {
    // Clean and prepare text for embedding
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?;:()\-'"]/g, ' ') // Remove special characters
      .trim()
      .substring(0, 512); // Limit length for performance (model has 512 token limit)
  }

  cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      console.warn('⚠️ Vector dimension mismatch for similarity calculation');
      return 0;
    }

    if (vectorA.length === 0) {
      return 0;
    }

    try {
      // Calculate dot product
      const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
      
      // Calculate magnitudes
      const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
      const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));
      
      // Avoid division by zero
      if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
      }

      // Calculate cosine similarity
      const similarity = dotProduct / (magnitudeA * magnitudeB);
      
      // Clamp to [-1, 1] range due to floating point precision
      return Math.max(-1, Math.min(1, similarity));
    } catch (error) {
      console.error('💥 Error calculating cosine similarity:', error);
      return 0;
    }
  }

  async batchGetEmbeddings(texts: string[]): Promise<number[][]> {
    // Process multiple texts efficiently
    const embeddings: number[][] = [];
    
    console.log(`🔄 Generating embeddings for ${texts.length} texts...`);
    
    for (let i = 0; i < texts.length; i++) {
      const embedding = await this.getEmbedding(texts[i]);
      embeddings.push(embedding);
      
      if (i % 5 === 0 && i > 0) {
        console.log(`📊 Progress: ${i}/${texts.length} embeddings generated`);
      }
    }
    
    console.log(`✅ Generated all ${embeddings.length} embeddings`);
    return embeddings;
  }

  isReady(): boolean {
    return this.model !== null;
  }

  getDimensions(): number {
    // all-MiniLM-L6-v2 produces 384-dimensional vectors
    return 384;
  }

  getModelInfo(): { name: string; dimensions: number; quantized: boolean } {
    return {
      name: 'all-MiniLM-L6-v2',
      dimensions: this.getDimensions(),
      quantized: true
    };
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
export default embeddingService;
