
# B3S Research Repository

A modern, **AI-powered research search application** with local semantic search capabilities that connects to your Atlassian ecosystem using Rovo for real-time data access.

## 🧠 NEW: Local Semantic Search

**Revolutionary document search that understands meaning, not just keywords!**

- 🎯 **Conceptual Understanding**: Search "fruit" → finds documents with "apples", "bananas"
- 🚀 **Local AI**: Works offline, no external APIs needed
- 🔒 **Privacy-First**: Your documents never leave your machine
- ⚡ **Fast**: Sub-second search response times
- 🎨 **Smart**: Combines semantic + keyword matching for best results

**Try it**: Upload a document containing "apples" and search for "fruit" - watch the magic happen!

[📖 **Read the full Semantic Search documentation →**](./SEMANTIC_SEARCH.md)

## Features

### Advanced AI Document Search
- 📄 **Multi-Format Support**: PDF, Word, Excel, PowerPoint, CSV, and text files
- 🧠 **Semantic Search**: Find documents by meaning and concepts
- 🤖 **Smart Text Extraction**: AI-powered content extraction from any document
- 🎯 **Hybrid Matching**: Combines semantic understanding with keyword precision
- 💡 **Auto Keywords**: Automatic keyword extraction and concept mapping
- 🔍 **Unified Results**: Documents appear alongside Atlassian search results

### Core Search Platform
- 🔍 **Unified Search**: Search across multiple data sources from a single interface
- 🚀 **Atlassian Rovo Integration**: Real-time access to Confluence pages and Jira issues
- 🌓 **Dark/Light Mode**: Modern UI with theme switching
- 🎯 **Advanced Filtering**: Filter by source, research type, team, and language
- 📱 **Responsive Design**: Mobile-friendly with drawer navigation
- 🏷️ **Smart Tagging**: Automatic tag extraction and categorization

### AI-Powered Document Search (NEW)
- 📄 **Document Upload**: Support for PDF, Word, Excel, PowerPoint, CSV, and text files
- 🤖 **AI Text Extraction**: Intelligent content extraction from uploaded documents
- 🧠 **Semantic Search**: Find documents by meaning, not just keywords
- 🎯 **Smart Matching**: Keyword and content-based search with relevance scoring
- 💡 **Auto Keywords**: Automatic keyword extraction from document content
- 🔗 **Cross-Platform Results**: Unified search results from Atlassian and documents

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

### Atlassian Integration
When Rovo is configured, the application will search:
- **Confluence**: Pages, documentation, and knowledge base articles
- **Jira**: Issues, tickets, and project data

### Document Upload System
Upload and search through your own documents:
- **PDF Files**: Automatic text extraction and indexing
- **Word Documents**: Content extraction from .docx files
- **Excel Spreadsheets**: Data extraction from .xlsx files  
- **PowerPoint**: Text extraction from .pptx presentations
- **CSV Files**: Structured data processing
- **Text Files**: Direct content indexing

### AI Search Capabilities
- **Semantic Understanding**: Find documents by meaning and context
- **Keyword Matching**: Traditional text search with highlighting
- **Relevance Scoring**: Smart ranking of search results
- **Content Snippets**: Preview matching sections from documents

When Atlassian is not configured, it uses sample data for demonstration.

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