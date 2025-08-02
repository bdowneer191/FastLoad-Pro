

export interface PageSpeedReport {
    lighthouseResult: {
        audits: any;
        categories: {
            performance: {
                score: number;
            };
            accessibility: {
                score: number;
            };
            'best-practices': {
                score: number;
            };
            seo: {
                score: number;
            };
        };
    };
}

export interface Session {
  id?: string;
  url: string;
  startTime: string;
  endTime: string;
  duration: number;
  report: { mobile: PageSpeedReport, desktop: PageSpeedReport };
  beforeScores: { mobile: number, desktop: number, accessibility: number, bestPractices: number, seo: number };
  afterScores: { mobile: number, desktop: number, accessibility: number, bestPractices: number, seo: number };
  userId: string;
  comparisonAnalysis?: any;
}

export interface UserData {
  geminiApiKey: string;
  pageSpeedApiKey: string;
}

export interface CleaningOptions {
  stripComments: boolean;
  collapseWhitespace: boolean;
  minifyInlineCSSJS: boolean;
  removeEmptyAttributes: boolean;
  preserveIframes: boolean;
  preserveLinks: boolean;
  preserveShortcodes: boolean;
  semanticRewrite: boolean;
  lazyLoadEmbeds: boolean;
  lazyLoadImages: boolean;
  optimizeImages: boolean; // Main switch for WebP/AVIF
  convertToAvif: boolean; // Upgrade to AVIF
  addResponsiveSrcset: boolean; // Generate srcset/sizes
  optimizeSvgs: boolean; // Minify inline SVGs
  optimizeCssLoading: boolean;
  optimizeFontLoading: boolean;
  addPrefetchHints: boolean;
  deferScripts: boolean;
  lazyLoadBackgroundImages: boolean;
  progressiveImageLoading: boolean;
  optimizeVideoElements: boolean;
}

export interface ImpactSummary {
  originalBytes: number;
  cleanedBytes: number;
  bytesSaved: number;
  nodesRemoved: number;
  estimatedSpeedGain: string;
  actionLog: string[]; // Detailed log of actions taken
}

export interface Recommendation {
  title: string;
  description: string;
  priority?: 'High' | 'Medium' | 'Low';
}