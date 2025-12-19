/**
 * UI Analyzer - Analyzes UI components for improvements
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface UIIssue {
  file: string;
  line: number;
  type: 'accessibility' | 'performance' | 'ux' | 'responsive' | 'semantic';
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
  code: string;
}

export interface UIAnalysis {
  component: string;
  issues: UIIssue[];
  score: number; // 0-100
  recommendations: string[];
}

export class UIAnalyzer {
  private codebasePath: string;

  constructor(codebasePath: string = '/var/www/alessa-ordering') {
    this.codebasePath = codebasePath;
  }

  /**
   * Analyze a UI component file
   */
  async analyzeComponent(filePath: string): Promise<UIAnalysis> {
    const issues: UIIssue[] = [];

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Check for accessibility issues
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Missing alt text on images
        if (trimmed.includes('<img') && !trimmed.includes('alt=')) {
          issues.push({
            file: filePath,
            line: i + 1,
            type: 'accessibility',
            severity: 'high',
            description: 'Image missing alt text',
            suggestion: 'Add alt text for accessibility',
            code: trimmed,
          });
        }

        // Missing aria-label on interactive elements
        if ((trimmed.includes('<button') || trimmed.includes('<a')) && 
            !trimmed.includes('aria-label') && 
            !trimmed.includes('aria-labelledby') &&
            !trimmed.match(/<button[^>]*>.*<\/button>|<a[^>]*>.*<\/a>/)) {
          issues.push({
            file: filePath,
            line: i + 1,
            type: 'accessibility',
            severity: 'medium',
            description: 'Interactive element missing accessible label',
            suggestion: 'Add aria-label or ensure text content is visible',
            code: trimmed,
          });
        }

        // Inline styles (should use Tailwind or CSS modules)
        if (trimmed.includes('style={{') && !trimmed.includes('//')) {
          issues.push({
            file: filePath,
            line: i + 1,
            type: 'performance',
            severity: 'low',
            description: 'Inline styles detected',
            suggestion: 'Move to Tailwind classes or CSS module',
            code: trimmed.substring(0, 100),
          });
        }

        // Missing responsive classes
        if (trimmed.includes('className=') && 
            !trimmed.match(/sm:|md:|lg:|xl:|2xl:/) &&
            (trimmed.includes('w-') || trimmed.includes('h-') || trimmed.includes('p-') || trimmed.includes('m-'))) {
          issues.push({
            file: filePath,
            line: i + 1,
            type: 'responsive',
            severity: 'medium',
            description: 'Fixed sizing without responsive breakpoints',
            suggestion: 'Add responsive classes (sm:, md:, lg:)',
            code: trimmed,
          });
        }

        // Non-semantic HTML
        if (trimmed.match(/<div[^>]*onClick/) && !trimmed.includes('role=')) {
          issues.push({
            file: filePath,
            line: i + 1,
            type: 'semantic',
            severity: 'medium',
            description: 'Clickable div without semantic meaning',
            suggestion: 'Use button element or add role="button"',
            code: trimmed,
          });
        }

        // Missing loading states
        if (trimmed.includes('async') && trimmed.includes('await') && 
            !content.includes('loading') && !content.includes('isLoading')) {
          // Check if there's a loading state nearby
          const nearbyLines = lines.slice(Math.max(0, i - 10), Math.min(lines.length, i + 10)).join('\n');
          if (!nearbyLines.match(/loading|isLoading|pending|spinner/i)) {
            issues.push({
              file: filePath,
              line: i + 1,
              type: 'ux',
              severity: 'medium',
              description: 'Async operation without loading state',
              suggestion: 'Add loading indicator for better UX',
              code: trimmed,
            });
          }
        }
      }

      // Calculate score (100 - (issues.length * severity_points))
      let score = 100;
      for (const issue of issues) {
        switch (issue.severity) {
          case 'high':
            score -= 10;
            break;
          case 'medium':
            score -= 5;
            break;
          case 'low':
            score -= 2;
            break;
        }
      }
      score = Math.max(0, score);

      // Generate recommendations
      const recommendations: string[] = [];
      const highIssues = issues.filter(i => i.severity === 'high');
      const mediumIssues = issues.filter(i => i.severity === 'medium');

      if (highIssues.length > 0) {
        recommendations.push(`Fix ${highIssues.length} high-priority ${highIssues[0].type} issues`);
      }
      if (mediumIssues.length > 0) {
        recommendations.push(`Address ${mediumIssues.length} medium-priority improvements`);
      }
      if (score < 70) {
        recommendations.push('Component needs significant improvements');
      } else if (score < 85) {
        recommendations.push('Component has room for improvement');
      } else {
        recommendations.push('Component is in good shape');
      }

      return {
        component: path.basename(filePath),
        issues,
        score,
        recommendations,
      };
    } catch (error) {
      console.error(`[UIAnalyzer] Error analyzing component ${filePath}:`, error);
      return {
        component: path.basename(filePath),
        issues: [],
        score: 0,
        recommendations: ['Unable to analyze component'],
      };
    }
  }

  /**
   * Analyze all UI components in a directory
   */
  async analyzeComponents(directory: string = this.codebasePath): Promise<UIAnalysis[]> {
    const analyses: UIAnalysis[] = [];
    const componentFiles = await this.findComponentFiles(directory);

    for (const file of componentFiles.slice(0, 50)) { // Limit to 50 components
      const analysis = await this.analyzeComponent(file);
      analyses.push(analysis);
    }

    return analyses;
  }

  /**
   * Find component files
   */
  private async findComponentFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next') {
          continue;
        }

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.findComponentFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Look for component files (tsx, jsx, or files in components directory)
          const ext = path.extname(entry.name);
          if (['.tsx', '.jsx'].includes(ext) || 
              (dir.includes('components') && ['.ts', '.js'].includes(ext))) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }

    return files;
  }

  /**
   * Get overall UI health score
   */
  async getOverallHealth(): Promise<{
    score: number;
    totalIssues: number;
    issuesByType: Record<string, number>;
    recommendations: string[];
  }> {
    const analyses = await this.analyzeComponents();
    
    const totalIssues = analyses.reduce((sum, a) => sum + a.issues.length, 0);
    const avgScore = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length
      : 0;

    const issuesByType: Record<string, number> = {};
    for (const analysis of analyses) {
      for (const issue of analysis.issues) {
        issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
      }
    }

    const recommendations: string[] = [];
    if (issuesByType.accessibility > 0) {
      recommendations.push(`Fix ${issuesByType.accessibility} accessibility issues`);
    }
    if (issuesByType.performance > 0) {
      recommendations.push(`Optimize ${issuesByType.performance} performance issues`);
    }
    if (issuesByType.responsive > 0) {
      recommendations.push(`Improve ${issuesByType.responsive} responsive design issues`);
    }

    return {
      score: Math.round(avgScore),
      totalIssues,
      issuesByType,
      recommendations,
    };
  }
}

