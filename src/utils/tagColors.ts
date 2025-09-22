// Notion-style tag colors utility
export type TagColorVariant = 
  | 'gray' 
  | 'brown' 
  | 'orange' 
  | 'yellow' 
  | 'green' 
  | 'blue' 
  | 'purple' 
  | 'pink' 
  | 'red';

// Color mappings for different tag types
export const sourceColors: Record<string, TagColorVariant> = {
  'Monday.com': 'orange',
  'Confluence': 'blue',
  'SharePoint': 'green',
  'Jira': 'blue',
  'Lucid': 'yellow',
  'Notion': 'gray',
  'Figma': 'purple',
  'Miro': 'yellow'
};

export const researchTypeColors: Record<string, TagColorVariant> = {
  'User Research': 'green',
  'Survey Analysis': 'blue',
  'Competitive Analysis': 'orange',
  'Technical Investigation': 'purple',
  'Information Architecture': 'blue',
  'Usability Testing': 'green',
  'Requirements Analysis': 'gray',
  'Performance Analysis': 'red',
  'Workshop Summary': 'yellow',
  'Security Analysis': 'red',
  'A/B Testing': 'green',
  'Accessibility Audit': 'blue',
  'Technical Documentation': 'purple',
  'Feature Analysis': 'orange',
  'Market Research': 'brown',
  'Content Analysis': 'yellow',
  'Technical Research': 'purple',
  'Design Guidelines': 'pink',
  'Support Analysis': 'brown',
  'Sentiment Analysis': 'green',
  'Compliance Review': 'red',
  'ML Analysis': 'purple',
  'Design Documentation': 'pink',
  'Campaign Analysis': 'orange',
  'Feedback Analysis': 'green',
  'SEO Analysis': 'brown',
  'Compatibility Testing': 'blue',
  'Churn Analysis': 'red',
  'Localization Testing': 'yellow',
  'Infrastructure Research': 'gray',
  'Conversion Analysis': 'orange',
  'Algorithm Analysis': 'purple',
  'Revenue Analysis': 'green',
  'AI Analysis': 'purple',
  'Technology Research': 'blue'
};

export const languageColors: Record<string, TagColorVariant> = {
  'English': 'blue',
  'Spanish': 'orange',
  'French': 'purple',
  'German': 'red',
  'Italian': 'green',
  'Portuguese': 'brown',
  'Dutch': 'yellow',
  'Russian': 'pink',
  'Chinese': 'red',
  'Japanese': 'purple'
};

// Hash function to consistently assign colors to content tags
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

const contentTagColors: TagColorVariant[] = [
  'gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'
];

export function getContentTagColor(tag: string): TagColorVariant {
  const index = hashCode(tag.toLowerCase()) % contentTagColors.length;
  return contentTagColors[index];
}

export function getTagColor(tag: string, type: 'source' | 'researchType' | 'language' | 'content'): TagColorVariant {
  switch (type) {
    case 'source':
      return sourceColors[tag] || 'gray';
    case 'researchType':
      return researchTypeColors[tag] || 'gray';
    case 'language':
      return languageColors[tag] || 'blue';
    case 'content':
      return getContentTagColor(tag);
    default:
      return 'gray';
  }
}

// Tailwind classes for each color variant - Subtle pastel colors
export const tagColorClasses: Record<TagColorVariant, string> = {
  gray: 'bg-slate-50/70 text-slate-500 border-slate-100/60 dark:bg-slate-800/10 dark:text-slate-500 dark:border-slate-700/20',
  brown: 'bg-amber-50/70 text-amber-600 border-amber-100/60 dark:bg-amber-900/10 dark:text-amber-500 dark:border-amber-800/20',
  orange: 'bg-orange-50/70 text-orange-500 border-orange-100/60 dark:bg-orange-900/10 dark:text-orange-500 dark:border-orange-800/20',
  yellow: 'bg-yellow-50/70 text-yellow-600 border-yellow-100/60 dark:bg-yellow-900/10 dark:text-yellow-500 dark:border-yellow-800/20',
  green: 'bg-emerald-50/70 text-emerald-500 border-emerald-100/60 dark:bg-emerald-900/10 dark:text-emerald-500 dark:border-emerald-800/20',
  blue: 'bg-sky-50/70 text-sky-500 border-sky-100/60 dark:bg-sky-900/10 dark:text-sky-500 dark:border-sky-800/20',
  purple: 'bg-violet-50/70 text-violet-500 border-violet-100/60 dark:bg-violet-900/10 dark:text-violet-500 dark:border-violet-800/20',
  pink: 'bg-rose-50/70 text-rose-500 border-rose-100/60 dark:bg-rose-900/10 dark:text-rose-500 dark:border-rose-800/20',
  red: 'bg-red-50/70 text-red-500 border-red-100/60 dark:bg-red-900/10 dark:text-red-500 dark:border-red-800/20'
};

// Background-only color classes for color indicators
export const colorIndicatorClasses: Record<TagColorVariant, string> = {
  gray: 'bg-slate-300 dark:bg-slate-600/60',
  brown: 'bg-amber-300 dark:bg-amber-600/60',
  orange: 'bg-orange-300 dark:bg-orange-600/60',
  yellow: 'bg-yellow-300 dark:bg-yellow-600/60',
  green: 'bg-emerald-300 dark:bg-emerald-600/60',
  blue: 'bg-sky-300 dark:bg-sky-600/60',
  purple: 'bg-violet-300 dark:bg-violet-600/60',
  pink: 'bg-rose-300 dark:bg-rose-600/60',
  red: 'bg-red-300 dark:bg-red-600/60'
};