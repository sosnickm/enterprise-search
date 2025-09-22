import { ResearchItem } from '../components/ResultCard';
import { ConfluencePage, JiraIssue, RovoSearchResult } from './rovoApi';

// Transform Confluence page to ResearchItem
export function transformConfluencePage(page: ConfluencePage): ResearchItem {
  // Extract plain text description from Confluence content
  const getDescription = (page: ConfluencePage): string => {
    // If there's an excerpt, use it
    if (page.excerpt) {
      return page.excerpt;
    }
    
    // Otherwise return a generic description
    return `Confluence page from ${page.space.name} space`;
  };

  // Determine research type based on page type and title
  const getResearchType = (page: ConfluencePage): string => {
    const title = page.title.toLowerCase();
    const type = page.type.toLowerCase();

    if (title.includes('research') || title.includes('study')) return 'User Research';
    if (title.includes('analysis') || title.includes('report')) return 'Technical Documentation';
    if (title.includes('requirements') || title.includes('spec')) return 'Requirements Analysis';
    if (title.includes('design') || title.includes('wireframe')) return 'Design Guidelines';
    if (title.includes('test') || title.includes('testing')) return 'Usability Testing';
    if (title.includes('workshop') || title.includes('meeting')) return 'Workshop Summary';
    if (title.includes('guidelines') || title.includes('standards')) return 'Design Guidelines';
    
    return type === 'blogpost' ? 'Technical Documentation' : 'Technical Documentation';
  };

  // Extract tags from labels and title
  const getTags = (page: ConfluencePage): string[] => {
    const tags: string[] = [];
    
    // Add labels as tags
    if (page.labels?.results) {
      tags.push(...page.labels.results.map(label => label.name.toLowerCase()));
    }
    
    // Extract additional tags from title
    const title = page.title.toLowerCase();
    const titleTags = [];
    
    if (title.includes('api')) titleTags.push('api');
    if (title.includes('mobile')) titleTags.push('mobile');
    if (title.includes('web')) titleTags.push('web');
    if (title.includes('design')) titleTags.push('design');
    if (title.includes('user')) titleTags.push('user-research');
    if (title.includes('security')) titleTags.push('security');
    if (title.includes('performance')) titleTags.push('performance');
    if (title.includes('testing')) titleTags.push('testing');
    if (title.includes('documentation')) titleTags.push('documentation');
    
    tags.push(...titleTags);
    
    return [...new Set(tags)]; // Remove duplicates
  };

  // Determine team based on space name
  const getTeam = (page: ConfluencePage): string => {
    const spaceName = page.space.name.toLowerCase();
    
    if (spaceName.includes('engineering') || spaceName.includes('dev')) return 'Engineering';
    if (spaceName.includes('product')) return 'Product Management';
    if (spaceName.includes('design') || spaceName.includes('ux')) return 'UX Design';
    if (spaceName.includes('research')) return 'UX Research';
    if (spaceName.includes('marketing')) return 'Marketing Research';
    if (spaceName.includes('security')) return 'Security';
    if (spaceName.includes('qa') || spaceName.includes('quality')) return 'QA Engineering';
    
    return 'Engineering'; // Default
  };

  return {
    id: `confluence-${page.id}`,
    title: page.title,
    description: getDescription(page),
    url: `${page._links.base}${page._links.webui}`,
    source: 'Confluence',
    researchType: getResearchType(page),
    language: 'English', // Default to English, could be enhanced with detection
    team: getTeam(page),
    tags: getTags(page),
    lastUpdated: new Date(page.version.when).toISOString().split('T')[0], // Format as YYYY-MM-DD
    author: page.version.by.displayName,
  };
}

// Transform Jira issue to ResearchItem
export function transformJiraIssue(issue: JiraIssue): ResearchItem {
  // Extract plain text description from Jira content
  const getDescription = (issue: JiraIssue): string => {
    if (issue.fields.description?.content) {
      const textContent = issue.fields.description.content
        .map(block => 
          block.content
            ?.map(content => content.text)
            .join(' ')
        )
        .join(' ')
        .trim();
      
      if (textContent) {
        return textContent.length > 200 ? textContent.substring(0, 200) + '...' : textContent;
      }
    }
    
    return `${issue.fields.issuetype.name} from ${issue.fields.project.name} project`;
  };

  // Determine research type based on issue type and summary
  const getResearchType = (issue: JiraIssue): string => {
    const issueType = issue.fields.issuetype.name.toLowerCase();
    const summary = issue.fields.summary.toLowerCase();

    if (issueType.includes('bug') || summary.includes('bug')) return 'Technical Investigation';
    if (issueType.includes('security') || summary.includes('security')) return 'Security Analysis';
    if (issueType.includes('research') || summary.includes('research')) return 'Technical Research';
    if (issueType.includes('analysis') || summary.includes('analysis')) return 'Technical Investigation';
    if (issueType.includes('performance') || summary.includes('performance')) return 'Performance Analysis';
    if (issueType.includes('test') || summary.includes('test')) return 'Compatibility Testing';
    if (issueType.includes('story') || issueType.includes('feature')) return 'Requirements Analysis';
    if (issueType.includes('task')) return 'Technical Documentation';
    
    return 'Technical Investigation';
  };

  // Extract tags from labels and summary
  const getTags = (issue: JiraIssue): string[] => {
    const tags: string[] = [];
    
    // Add Jira labels as tags
    if (issue.fields.labels) {
      tags.push(...issue.fields.labels.map(label => label.toLowerCase()));
    }
    
    // Extract additional tags from summary and issue type
    const summary = issue.fields.summary.toLowerCase();
    const issueType = issue.fields.issuetype.name.toLowerCase();
    
    const extractedTags = [];
    
    if (summary.includes('api') || issueType.includes('api')) extractedTags.push('api');
    if (summary.includes('mobile') || issueType.includes('mobile')) extractedTags.push('mobile');
    if (summary.includes('web') || issueType.includes('web')) extractedTags.push('web');
    if (summary.includes('security') || issueType.includes('security')) extractedTags.push('security');
    if (summary.includes('performance')) extractedTags.push('performance');
    if (summary.includes('bug') || issueType.includes('bug')) extractedTags.push('bug-investigation');
    if (summary.includes('critical')) extractedTags.push('critical');
    if (summary.includes('database')) extractedTags.push('database');
    if (summary.includes('ui') || summary.includes('interface')) extractedTags.push('ui');
    if (issueType.includes('story')) extractedTags.push('user-story');
    
    tags.push(...extractedTags);
    
    return [...new Set(tags)]; // Remove duplicates
  };

  // Determine team based on project name
  const getTeam = (issue: JiraIssue): string => {
    const projectName = issue.fields.project.name.toLowerCase();
    const issueType = issue.fields.issuetype.name.toLowerCase();
    
    if (projectName.includes('security') || issueType.includes('security')) return 'Security';
    if (projectName.includes('qa') || projectName.includes('test')) return 'QA Engineering';
    if (projectName.includes('product') || issueType.includes('story')) return 'Product Management';
    if (projectName.includes('design') || projectName.includes('ux')) return 'UX Design';
    if (projectName.includes('support') || projectName.includes('service')) return 'Customer Support';
    if (projectName.includes('marketing')) return 'Marketing Research';
    
    return 'Engineering'; // Default
  };

  return {
    id: `jira-${issue.id}`,
    title: `[${issue.key}] ${issue.fields.summary}`,
    description: getDescription(issue),
    url: `${issue.key}`, // This would need to be constructed with the Jira base URL
    source: 'Jira',
    researchType: getResearchType(issue),
    language: 'English', // Default to English
    team: getTeam(issue),
    tags: getTags(issue),
    lastUpdated: new Date(issue.fields.updated).toISOString().split('T')[0],
    author: issue.fields.assignee?.displayName || 'Unassigned',
  };
}

// Transform combined Rovo search results
export function transformRovoResults(results: RovoSearchResult): ResearchItem[] {
  const transformedResults: ResearchItem[] = [];
  
  // Transform Confluence pages
  if (results.confluence) {
    transformedResults.push(...results.confluence.map(transformConfluencePage));
  }
  
  // Transform Jira issues
  if (results.jira) {
    transformedResults.push(...results.jira.map(transformJiraIssue));
  }
  
  // Sort by last updated date (newest first)
  return transformedResults.sort((a, b) => 
    new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );
}
