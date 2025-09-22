
# B3S Research Repository

A modern, AI-powered research search application that connects to your Atlassian ecosystem using Rovo to search across Confluence and Jira for real-time data access.

## Features

- 🔍 **Unified Search**: Search across multiple data sources from a single interface
- 🚀 **Atlassian Rovo Integration**: Real-time access to Confluence pages and Jira issues
- 🌓 **Dark/Light Mode**: Modern UI with theme switching
- 🎯 **Advanced Filtering**: Filter by source, research type, team, and language
- 📱 **Responsive Design**: Mobile-friendly with drawer navigation
- 🏷️ **Smart Tagging**: Automatic tag extraction and categorization

## Quick Start

### Installation

```bash
npm install
npm run dev
```

### Atlassian Rovo Setup

1. **Click the Settings button** in the top-right corner of the application
2. **Configure your Atlassian credentials**:
   - **Domain**: Your Atlassian domain (e.g., "mycompany" for mycompany.atlassian.net)
   - **Email**: Your Atlassian account email
   - **API Token**: Create one at [id.atlassian.com](https://id.atlassian.com/manage-profile/security/api-tokens)

3. **Test the connection** and save your configuration

### Alternative: Environment Variables

Create a `.env.local` file with your Atlassian credentials:

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

## Data Sources

When Rovo is configured, the application will search:

- **Confluence**: Pages, documentation, and knowledge base articles
- **Jira**: Issues, tickets, and project data

When not configured, it uses sample data for demonstration.

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Atlassian REST APIs** via Rovo integration

## Development

### Running the Application

1. **Install dependencies:**
```bash
npm install
```

2. **Start the proxy server** (required for Atlassian API calls):
```bash
# Install proxy dependencies
cd hackathon-make
cp proxy-package.json package-proxy.json
npm install --package-lock-only -f package-proxy.json

# Start the proxy server in a separate terminal
node proxy-server.js
```

3. **Start the main application:**
```bash
# In the main project directory
npm run dev
```

The application will be available at `http://localhost:3000` and the proxy server at `http://localhost:3001`.

### Build for production
```bash
npm run build

# Type checking
npx tsc --noEmit
```

## API Integration

The application uses the Atlassian REST APIs to fetch data:
- Confluence REST API v2
- Jira REST API v3

All data is transformed into a unified format for consistent search and filtering across sources.  