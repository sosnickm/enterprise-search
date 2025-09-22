// Atlassian Rovo API integration for fetching Confluence and Jira data
export interface RovoConfig {
  atlassianDomain: string;
  email: string;
  apiToken: string;
}

export interface ConfluencePage {
  id: string;
  title: string;
  excerpt?: string;
  type: string;
  status: string;
  _links: {
    webui: string;
    base: string;
  };
  version: {
    when: string;
    by: {
      displayName: string;
    };
  };
  space: {
    name: string;
  };
  labels?: {
    results: Array<{
      name: string;
    }>;
  };
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: {
      content: Array<{
        content: Array<{
          text: string;
        }>;
      }>;
    };
    status: {
      name: string;
    };
    issuetype: {
      name: string;
    };
    project: {
      name: string;
    };
    assignee?: {
      displayName: string;
    };
    updated: string;
    labels: string[];
  };
}

export interface RovoSearchResult {
  confluence: ConfluencePage[];
  jira: JiraIssue[];
}

class RovoApiClient {
  private config: RovoConfig;
  private baseUrl: string;
  private useCorsProxy: boolean;

  constructor(config: RovoConfig, useCorsProxy: boolean = true) {
    this.config = config;
    this.baseUrl = `https://${config.atlassianDomain}.atlassian.net`;
    this.useCorsProxy = useCorsProxy;
  }

  private getProxiedUrl(url: string): string {
    if (this.useCorsProxy && window.location.hostname === 'localhost') {
      // Use local proxy server for development
      return `http://localhost:3001/api/proxy/${url}`;
    }
    return url;
  }

  private getAuthHeader(): string {
    return `Basic ${btoa(`${this.config.email}:${this.config.apiToken}`)}`;
  }

  async searchConfluence(query: string, limit: number = 25): Promise<ConfluencePage[]> {
    try {
      // Try only 2 search approaches
      const searchApproaches = [
        // Method 1: CQL text search
        `${this.baseUrl}/wiki/rest/api/content/search?cql=text~"${encodeURIComponent(query)}"&expand=version,space,metadata.labels&limit=${limit}`,
        // Method 2: CQL title search as fallback
        `${this.baseUrl}/wiki/rest/api/content/search?cql=title~"${encodeURIComponent(query)}"&expand=version,space,metadata.labels&limit=${limit}`
      ];
      
      for (const url of searchApproaches) {
        console.log('Trying Confluence search URL:', url);
        
        const response = await fetch(this.getProxiedUrl(url), {
          method: 'GET',
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json',
          },
        });

        console.log('Confluence search response:', response.status, response.statusText);

        if (response.ok) {
          const data = await response.json();
          console.log('Confluence search results:', {
            totalSize: data.totalSize,
            resultsCount: data.results?.length || 0
          });
          
          if (data.results && data.results.length > 0) {
            return data.results;
          }
        } else {
          const errorText = await response.text();
          console.error(`Confluence search error for ${url}:`, response.status, errorText);
        }
      }

      console.log('No Confluence search results found');
      return [];
    } catch (error) {
      console.error('Error searching Confluence:', error);
      throw error;
    }
  }

  async searchJira(query: string, limit: number = 25): Promise<JiraIssue[]> {
    try {
      // Use bounded JQL search queries
      const jqlQueries = [
        `(text ~ "${query}" OR summary ~ "${query}" OR description ~ "${query}") AND updated >= -90d ORDER BY updated DESC`,  // Bounded text search (last 90 days)
        `(summary ~ "${query}" OR description ~ "${query}") ORDER BY updated DESC`  // Summary and description search
      ];
      
      for (const jql of jqlQueries) {
        console.log('Trying Jira search JQL:', jql);
        
        // Use the standard Jira search endpoint
        const url = `${this.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${limit}&fields=summary,description,status,issuetype,project,assignee,updated,labels`;
        
        const response = await fetch(this.getProxiedUrl(url), {
          method: 'GET',
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json',
          },
        });

        console.log('Jira search response status:', response.status, response.statusText);

        if (response.ok) {
          const data = await response.json();
          console.log('Jira search data received:', {
            total: data.total,
            maxResults: data.maxResults,
            issuesCount: data.issues?.length || 0
          });
          
          if (data.issues && data.issues.length > 0) {
            return data.issues;
          }
        } else {
          const errorText = await response.text();
          console.error(`Jira search error for JQL "${jql}":`, response.status, errorText);
        }
      }
      
      console.log(`No Jira issues found for query: "${query}"`);
      return [];
    } catch (error) {
      console.error('Error searching Jira:', error);
      throw error;
    }
  }

  async searchAll(query: string): Promise<RovoSearchResult> {
    if (!query || query.trim().length === 0) {
      return { confluence: [], jira: [] };
    }

    const [confluence, jira] = await Promise.all([
      this.searchConfluence(query),
      this.searchJira(query)
    ]);

    return { confluence, jira };
  }

  // Get recent content without search query
  async getRecentContent(limit: number = 50): Promise<RovoSearchResult> {
    const [confluence, jira] = await Promise.all([
      this.getRecentConfluencePages(limit),
      this.getRecentJiraIssues(limit)
    ]);

    return { confluence, jira };
  }

  async getRecentConfluencePages(limit: number): Promise<ConfluencePage[]> {
    try {
      // Try only 2 approaches to get Confluence content
      const urls = [
        // Method 1: All content (most reliable)
        `${this.baseUrl}/wiki/rest/api/content?expand=version,space,metadata.labels&limit=${limit}`,
        // Method 2: Just pages as fallback
        `${this.baseUrl}/wiki/rest/api/content?type=page&expand=version,space,metadata.labels&limit=${limit}`
      ];
      
      for (const url of urls) {
        console.log('Trying Confluence URL:', url);
        
        const response = await fetch(this.getProxiedUrl(url), {
          method: 'GET',
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json',
          },
        });

        console.log('Confluence response status:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Confluence data received:', {
            size: data.size,
            start: data.start,
            limit: data.limit,
            resultsCount: data.results?.length || 0
          });
          
          if (data.results && data.results.length > 0) {
            return data.results;
          }
        } else {
          const errorText = await response.text();
          console.error(`Confluence API error for ${url}:`, response.status, response.statusText, errorText);
        }
      }
      
      console.log('No Confluence content found with any method');
      return [];
    } catch (error) {
      console.error('Error fetching recent Confluence pages:', error);
      throw error; // Re-throw to get better error reporting in the UI
    }
  }

  async getRecentJiraIssues(limit: number): Promise<JiraIssue[]> {
    try {
      // Use bounded JQL queries that Jira allows
      const jqlQueries = [
        'assignee = currentUser() OR reporter = currentUser() OR watcher = currentUser() ORDER BY updated DESC',  // User's issues and watched
        'project is not EMPTY AND updated >= -30d ORDER BY updated DESC'  // Recent issues in any project (last 30 days)
      ];
      
      for (const jql of jqlQueries) {
        console.log('Trying Jira JQL:', jql);
        
        // Use the standard Jira search endpoint
        const url = `${this.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${limit}&fields=summary,description,status,issuetype,project,assignee,updated,labels`;
        
        const response = await fetch(this.getProxiedUrl(url), {
          method: 'GET',
          headers: {
            'Authorization': this.getAuthHeader(),
            'Accept': 'application/json',
          },
        });

        console.log('Jira response status:', response.status, response.statusText);

        if (response.ok) {
          const data = await response.json();
          console.log('Jira data received:', {
            total: data.total,
            maxResults: data.maxResults,
            issuesCount: data.issues?.length || 0
          });
          
          if (data.issues && data.issues.length > 0) {
            return data.issues;
          }
        } else {
          const errorText = await response.text();
          console.error(`Jira API error for JQL "${jql}":`, response.status, errorText);
        }
      }
      
      console.log('No Jira issues found with any query');
      return [];
    } catch (error) {
      console.error('Error fetching recent Jira issues:', error);
      throw error;
    }
  }

  // Test methods for connection validation
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Test basic connectivity with a simple API call
      const url = `${this.baseUrl}/rest/api/3/myself`;
      
      const response = await fetch(this.getProxiedUrl(url), {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        return {
          success: true,
          message: `Connected successfully as ${userData.displayName || userData.emailAddress}`
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText} - ${errorText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async testConfluenceAccess(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.getRecentConfluencePages(1);
      if (result.length > 0) {
        return { success: true, message: `Found ${result.length} Confluence pages` };
      } else {
        return { success: false, message: 'No Confluence pages accessible' };
      }
    } catch (error) {
      return {
        success: false,
        message: `Confluence access error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async testJiraAccess(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.getRecentJiraIssues(1);
      if (result.length > 0) {
        return { success: true, message: `Found ${result.length} Jira issues` };
      } else {
        return { success: false, message: 'No Jira issues accessible' };
      }
    } catch (error) {
      return {
        success: false,
        message: `Jira access error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export { RovoApiClient };
