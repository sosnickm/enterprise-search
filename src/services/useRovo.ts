import { useState, useEffect, useCallback, useMemo } from 'react';
import { ResearchItem } from '../components/ResultCard';
import { RovoApiClient, RovoConfig } from './rovoApi';
import { transformRovoResults } from './rovoDataTransformer';

// Hook to manage Rovo configuration and data fetching
export function useRovo() {
  const [config, setConfig] = useState<RovoConfig | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Memoize the client to prevent unnecessary re-creations
  const client = useMemo(() => {
    if (config) {
      return new RovoApiClient(config);
    }
    return null;
  }, [config]);

  // Load configuration from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('rovoConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        setIsConfigured(true);
      } catch (error) {
        console.error('Error loading Rovo config:', error);
      }
    }
  }, []);

  // Save configuration to localStorage
  const saveConfig = useCallback((newConfig: RovoConfig) => {
    setConfig(newConfig);
    setIsConfigured(true);
    localStorage.setItem('rovoConfig', JSON.stringify(newConfig));
  }, []);

  // Clear configuration
  const clearConfig = useCallback(() => {
    setConfig(null);
    setIsConfigured(false);
    localStorage.removeItem('rovoConfig');
  }, []);

  // Search function
  const search = useCallback(async (query: string): Promise<ResearchItem[]> => {
    if (!client || !query.trim()) {
      return [];
    }

    try {
      const results = await client.searchAll(query);
      return transformRovoResults(results);
    } catch (error) {
      console.error('Error searching Rovo:', error);
      return [];
    }
  }, [client]);

  // Get recent content
  const getRecentContent = useCallback(async (): Promise<ResearchItem[]> => {
    if (!client) {
      return [];
    }

    try {
      const results = await client.getRecentContent();
      return transformRovoResults(results);
    } catch (error) {
      console.error('Error fetching recent content:', error);
      return [];
    }
  }, [client]);

  // Test connection
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!client) {
      return false;
    }

    try {
      // Try to fetch a small amount of data to test the connection
      const results = await client.getRecentContent(5);
      return results.confluence.length > 0 || results.jira.length > 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }, [client]);

  return useMemo(() => ({
    config,
    isConfigured,
    saveConfig,
    clearConfig,
    search,
    getRecentContent,
    testConnection,
  }), [config, isConfigured, saveConfig, clearConfig, search, getRecentContent, testConnection]);
}
