import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { CheckCircle, XCircle, RefreshCw, Settings, Key, Globe, Mail } from "lucide-react";

interface SettingsPanelProps {
  onClose: () => void;
  rovoConfig?: {
    atlassianDomain: string;
    email: string;
    apiToken: string;
  };
  onRovoConfigChange?: (config: { atlassianDomain: string; email: string; apiToken: string; }) => void;
}



export function SettingsPanel({ rovoConfig, onRovoConfigChange }: SettingsPanelProps) {
  const [config, setConfig] = useState({
    atlassianDomain: rovoConfig?.atlassianDomain || '',
    email: rovoConfig?.email || '',
    apiToken: rovoConfig?.apiToken || ''
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: {
      confluencePages?: number;
      jiraIssues?: number;
    };
  } | null>(null);

  useEffect(() => {
    // Check if all required fields are filled
    setIsConnected(
      config.atlassianDomain.trim() !== '' &&
      config.email.trim() !== '' &&
      config.apiToken.trim() !== ''
    );
    // Clear test results when config changes
    setTestResult(null);
  }, [config]);

  const handleSave = () => {
    if (onRovoConfigChange && isConnected) {
      onRovoConfigChange(config);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Validate config first
      if (!config.atlassianDomain || !config.email || !config.apiToken) {
        throw new Error('Please fill in all required fields');
      }

      // Create a temporary Rovo client with current config
      const { RovoApiClient } = await import('../services/rovoApi');
      const testClient = new RovoApiClient({
        atlassianDomain: config.atlassianDomain.trim(),
        email: config.email.trim(),
        apiToken: config.apiToken.trim()
      });

      // Test both Confluence and Jira connections with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 15000)
      );

      const [confluenceResults, jiraResults] = await Promise.allSettled([
        Promise.race([testClient.getRecentConfluencePages(3), timeoutPromise]),
        Promise.race([testClient.getRecentJiraIssues(3), timeoutPromise])
      ]);

      const confluencePages = confluenceResults.status === 'fulfilled' ? (confluenceResults.value as any[]).length : 0;
      const jiraIssues = jiraResults.status === 'fulfilled' ? (jiraResults.value as any[]).length : 0;

      // Analyze results
      const confluenceError = confluenceResults.status === 'rejected' ? confluenceResults.reason : null;
      const jiraError = jiraResults.status === 'rejected' ? jiraResults.reason : null;

      if (confluencePages > 0 || jiraIssues > 0) {
        setTestResult({
          success: true,
          message: 'Authentication successful! You can now search your Atlassian content.',
          details: {
            confluencePages,
            jiraIssues
          }
        });
      } else if (confluenceError && jiraError) {
        // Both failed - likely auth or domain issue
        const isAuthError = confluenceError.message?.includes('401') || 
                           confluenceError.message?.includes('403') ||
                           jiraError.message?.includes('401') || 
                           jiraError.message?.includes('403');
        
        const isDomainError = confluenceError.message?.includes('404') || 
                             jiraError.message?.includes('404');
        
        if (isAuthError) {
          setTestResult({
            success: false,
            message: 'Authentication failed. Please verify your email and API token are correct.'
          });
        } else if (isDomainError) {
          setTestResult({
            success: false,
            message: 'Domain not found. Please check your Atlassian domain name (without .atlassian.net).'
          });
        } else {
          setTestResult({
            success: false,
            message: 'Unable to connect to Atlassian services. Please check your configuration and try again.'
          });
        }
      } else {
        // Connected but no content found
        setTestResult({
          success: true,
          message: 'Connection successful! No accessible content found - this may be normal for new or restricted workspaces.',
          details: { confluencePages: 0, jiraIssues: 0 }
        });
      }
    } catch (error: any) {
      console.error('Connection test failed:', error);
      
      let errorMessage = 'Connection test failed.';
      if (error.message?.includes('timeout')) {
        errorMessage = 'Connection timeout. Please check your internet connection and Atlassian domain.';
      } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        errorMessage = 'Invalid credentials. Please check your email and API token.';
      } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        errorMessage = 'Access denied. Please ensure your account has access to Confluence and Jira.';
      } else if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        errorMessage = 'Atlassian domain not found. Please verify your domain name.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message?.includes('fill in all required')) {
        errorMessage = error.message;
      }
      
      setTestResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Rovo Configuration */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Atlassian Rovo Configuration</h3>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Atlassian Domain
            </Label>
            <Input
              id="domain"
              placeholder="your-domain (without .atlassian.net)"
              value={config.atlassianDomain}
              onChange={(e) => setConfig(prev => ({ ...prev, atlassianDomain: e.target.value }))}
            />
            <p className="text-sm text-muted-foreground">
              Enter your Atlassian domain name (e.g., "mycompany" for mycompany.atlassian.net)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@company.com"
              value={config.email}
              onChange={(e) => setConfig(prev => ({ ...prev, email: e.target.value }))}
            />
            <p className="text-sm text-muted-foreground">
              Your Atlassian account email address
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiToken" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Token
            </Label>
            <Input
              id="apiToken"
              type="password"
              placeholder="Your Atlassian API token"
              value={config.apiToken}
              onChange={(e) => setConfig(prev => ({ ...prev, apiToken: e.target.value }))}
            />
            <p className="text-sm text-muted-foreground">
              Create an API token at{' '}
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                id.atlassian.com
              </a>
            </p>
          </div>
        </div>

        <Separator />

        {/* Testing Progress */}
        {isTesting && (
          <div className="p-4 rounded-lg border bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200">
            <div className="flex items-center gap-2 font-medium mb-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Testing Connection...
            </div>
            <div className="text-sm space-y-1">
              <div>• Validating credentials with Atlassian</div>
              <div>• Testing Confluence access</div>
              <div>• Testing Jira access</div>
              <div className="text-xs mt-2 opacity-75">This may take up to 15 seconds...</div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResult && !isTesting && (
          <div className={`p-4 rounded-lg border ${
            testResult.success 
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
          }`}>
            <div className="flex items-center gap-2 font-medium mb-1">
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {testResult.success ? 'Connection Test Successful!' : 'Connection Test Failed'}
            </div>
            <div className="text-sm">{testResult.message}</div>
            {testResult.success && testResult.details && (
              <div className="text-sm mt-2 flex gap-4">
                <span>📄 Found {testResult.details.confluencePages} accessible Confluence pages</span>
                <span>🎫 Found {testResult.details.jiraIssues} accessible Jira issues</span>
              </div>
            )}
          </div>
        )}

        {/* Connection Status */}
        <div className="space-y-3">
          <h4 className="font-medium">Connection Status</h4>
          <div className="flex items-center gap-3">
            {testResult ? (
              testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )
            ) : isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div className="flex-1">
              <div className="font-medium">
                {testResult 
                  ? (testResult.success ? 'Connection Successful' : 'Connection Failed')
                  : isConnected 
                    ? 'Ready to Connect' 
                    : 'Configuration Incomplete'
                }
              </div>
              <div className="text-sm text-muted-foreground">
                {testResult 
                  ? testResult.message
                  : isConnected 
                    ? 'All required fields are filled. Click "Test Connection" to verify.'
                    : 'Please fill in all required fields above.'
                }
              </div>
              {testResult?.success && testResult.details && (
                <div className="text-xs text-muted-foreground mt-1 flex gap-4">
                  <span>📄 {testResult.details.confluencePages} Confluence pages</span>
                  <span>🎫 {testResult.details.jiraIssues} Jira issues</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleTest}
            disabled={!isConnected || isTesting}
            variant="outline"
            className="flex-1"
          >
            {isTesting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing Atlassian Access...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isConnected || (testResult && !testResult.success)}
            className="flex-1"
          >
            {testResult?.success ? 'Save & Connect' : 'Save Configuration'}
          </Button>
        </div>
        
        {testResult && !testResult.success && (
          <div className="text-xs text-muted-foreground">
            💡 Tip: Test the connection successfully before saving to ensure your credentials work.
          </div>
        )}
      </div>

      {/* Data Sources Info */}
      <div className="space-y-3 pt-4 border-t border-border">
        <h4 className="font-medium">Available Data Sources</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="font-medium">Confluence</div>
                <div className="text-sm text-muted-foreground">Documentation and pages</div>
              </div>
            </div>
            <Badge variant="secondary">Rovo</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="font-medium">Jira</div>
                <div className="text-sm text-muted-foreground">Issues and tickets</div>
              </div>
            </div>
            <Badge variant="secondary">Rovo</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded opacity-60">
            <div className="flex items-center gap-3">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Monday.com</div>
                <div className="text-sm text-muted-foreground">Coming soon</div>
              </div>
            </div>
            <Badge variant="outline">Soon</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}