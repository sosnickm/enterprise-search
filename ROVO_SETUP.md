# Atlassian Rovo Configuration Guide

## Overview
Your B3S Research Repository now integrates with Atlassian Rovo to fetch real data from your Confluence and Jira instances. This replaces mock data with live content from your Atlassian workspace.

## Setup Steps

### 1. Create an Atlassian API Token
1. Go to [id.atlassian.com](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label like "B3S Research Repository"
4. Copy the generated token (save it securely)

### 2. Configure in the Application
1. Open your B3S Research Repository at `http://localhost:3000`
2. Click the **Settings** (⚙️) button in the top-right corner
3. Fill in the Atlassian Rovo Configuration:
   - **Domain**: Your Atlassian domain name (e.g., "mycompany" for mycompany.atlassian.net)
   - **Email**: Your Atlassian account email address
   - **API Token**: The token you created in step 1

4. Click **Test Connection** to verify the setup
5. Click **Save Configuration** to store the settings

### 3. Start Searching!
Once configured, the application will:
- **Load recent content** from Confluence and Jira on startup
- **Search across both platforms** when you enter search terms
- **Show real-time results** with proper source attribution

## Data Sources

### Confluence Integration
- Searches across all pages you have access to
- Extracts page titles, content excerpts, and metadata
- Categorizes content based on page structure and labels
- Links directly to the original Confluence pages

### Jira Integration  
- Searches issues, stories, bugs, and tasks
- Includes issue summaries and descriptions
- Categorizes by issue type and project
- Maintains links to original Jira tickets

## Features Enabled with Rovo

### 🔍 **Unified Search**
- Search across Confluence pages and Jira issues simultaneously
- Results are merged and sorted by relevance and recency

### 🏷️ **Smart Categorization**
- Automatic research type detection (User Research, Technical Documentation, etc.)
- Team assignment based on Confluence spaces and Jira projects
- Tag extraction from Confluence labels and Jira tags

### 🔒 **Security & Access**
- Respects your Atlassian permissions
- Only shows content you have access to
- Secure API token storage in browser localStorage

### ⚡ **Real-time Updates**
- Fresh data on every search
- Recent content loaded automatically
- No manual sync required

## Troubleshooting

### Connection Issues
- Verify your domain name doesn't include ".atlassian.net"
- Check that your email is correct
- Ensure the API token is valid and not expired
- Confirm you have access to Confluence and Jira in your organization

### No Results
- Check that you have content in your Confluence/Jira
- Verify your permissions allow reading the content
- Try broader search terms

### Performance
- Initial loads may be slower due to API calls
- Results are cached temporarily for better performance
- Large workspaces may take longer to search

## Data Privacy
- Configuration is stored locally in your browser
- No data is sent to external servers except Atlassian APIs
- API tokens are encrypted in browser storage
- You can clear configuration at any time in Settings

## Fallback Mode
If Rovo is not configured, the application automatically falls back to demonstration data, so you can still explore all features even without an Atlassian setup.
