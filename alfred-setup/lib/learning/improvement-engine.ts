/**
 * Improvement Engine - Scans codebase and generates improvements
 * Combines pattern analysis with code scanning
 */

import { EventRecorder } from './event-recorder';
import { PatternAnalyzer, Pattern } from './pattern-analyzer';
import { promises as fs } from 'fs';
import path from 'path';

export interface Improvement {
  id: string;
  type: 'code_cleanup' | 'ui_improvement' | 'performance' | 'security' | 'refactor';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  file?: string;
  line?: number;
  suggestion: string;
  estimatedImpact: string;
  status: 'pending' | 'approved' | 'applied' | 'rejected';
  createdAt: number;
}

export class ImprovementEngine {
  private eventRecorder: EventRecorder;
  private patternAnalyzer: PatternAnalyzer;
  private codebasePath: string;

  constructor(
    eventRecorder: EventRecorder,
    patternAnalyzer: PatternAnalyzer,
    codebasePath: string = '/var/www/alessa-ordering'
  ) {
    this.eventRecorder = eventRecorder;
    this.patternAnalyzer = patternAnalyzer;
    this.codebasePath = codebasePath;
  }

  /**
   * Run full improvement cycle
   */
  async runImprovementCycle(): Promise<{
    patternsFound: number;
    improvementsGenerated: number;
    suggestions: Improvement[];
  }> {
    console.log('[ImprovementEngine] Starting improvement cycle...');

    // 1. Get recent events
    const events = await this.eventRecorder.getRecentEvents(500);
    console.log(`[ImprovementEngine] Analyzing ${events.length} events...`);

    // 2. Analyze patterns
    const patterns = await this.patternAnalyzer.analyzePatterns(events);
    console.log(`[ImprovementEngine] Found ${patterns.length} patterns...`);

    // 3. Scan codebase
    const codeIssues = await this.scanCodebase();
    console.log(`[ImprovementEngine] Found ${codeIssues.length} code issues...`);

    // 4. Generate improvements
    const improvements = await this.generateImprovements(patterns, codeIssues);
    console.log(`[ImprovementEngine] Generated ${improvements.length} improvements...`);

    return {
      patternsFound: patterns.length,
      improvementsGenerated: improvements.length,
      suggestions: improvements,
    };
  }

  /**
   * Scan codebase for common issues
   */
  private async scanCodebase(): Promise<Array<{
    file: string;
    issue: string;
    type: 'unused_import' | 'dead_code' | 'performance' | 'security';
    line?: number;
  }>> {
    const issues: Array<{
      file: string;
      issue: string;
      type: 'unused_import' | 'dead_code' | 'performance' | 'security';
      line?: number;
    }> = [];

    try {
      // Scan TypeScript/JavaScript files
      const files = await this.findSourceFiles(this.codebasePath, ['.ts', '.tsx', '.js', '.jsx']);
      
      for (const file of files.slice(0, 50)) { // Limit to 50 files for performance
        const fileIssues = await this.analyzeFile(file);
        issues.push(...fileIssues);
      }
    } catch (error) {
      console.error('[ImprovementEngine] Error scanning codebase:', error);
    }

    return issues;
  }

  /**
   * Find source files recursively
   */
  private async findSourceFiles(dir: string, extensions: string[]): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip node_modules, .next, .git, etc.
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.findSourceFiles(fullPath, extensions);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
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
   * Analyze a single file for issues
   */
  private async analyzeFile(filePath: string): Promise<Array<{
    file: string;
    issue: string;
    type: 'unused_import' | 'dead_code' | 'performance' | 'security';
    line?: number;
  }>> {
    const issues: Array<{
      file: string;
      issue: string;
      type: 'unused_import' | 'dead_code' | 'performance' | 'security';
      line?: number;
    }> = [];

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Check for unused imports (simple heuristic)
      const importLines = lines
        .map((line, idx) => ({ line, idx }))
        .filter(({ line }) => line.trim().startsWith('import'));

      for (const { line, idx } of importLines) {
        // Simple check: if import is not used in the file
        const importMatch = line.match(/import\s+.*?\s+from\s+['"](.*?)['"]/);
        if (importMatch) {
          const imported = importMatch[1];
          // Check if imported module is used
          const isUsed = content.includes(imported) && !line.includes(imported);
          if (!isUsed && imported.startsWith('.')) {
            // This is a relative import, check if it's actually used
            const importName = line.match(/import\s+{?\s*(\w+)/)?.[1];
            if (importName && !content.includes(importName)) {
              issues.push({
                file: filePath,
                issue: `Potentially unused import: ${line.trim()}`,
                type: 'unused_import',
                line: idx + 1,
              });
            }
          }
        }
      }

      // Check for console.log in production code
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('console.log') && !lines[i].includes('//')) {
          issues.push({
            file: filePath,
            issue: 'console.log found (should be removed in production)',
            type: 'dead_code',
            line: i + 1,
          });
        }
      }

      // Check for TODO/FIXME comments
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/TODO|FIXME|HACK/i)) {
          issues.push({
            file: filePath,
            issue: `TODO/FIXME comment found: ${lines[i].trim()}`,
            type: 'dead_code',
            line: i + 1,
          });
        }
      }
    } catch (error) {
      // Ignore file read errors
    }

    return issues;
  }

  /**
   * Generate improvements from patterns and code issues
   */
  private async generateImprovements(
    patterns: Pattern[],
    codeIssues: Array<{
      file: string;
      issue: string;
      type: 'unused_import' | 'dead_code' | 'performance' | 'security';
      line?: number;
    }>
  ): Promise<Improvement[]> {
    const improvements: Improvement[] = [];

    // Convert code issues to improvements
    for (const issue of codeIssues.slice(0, 20)) { // Limit to top 20
      improvements.push({
        id: `improvement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: this.mapIssueTypeToImprovementType(issue.type),
        priority: issue.type === 'security' ? 'high' : 'medium',
        title: `Fix: ${issue.issue.substring(0, 50)}`,
        description: issue.issue,
        file: issue.file,
        line: issue.line,
        suggestion: this.generateSuggestion(issue),
        estimatedImpact: this.estimateImpact(issue.type),
        status: 'pending',
        createdAt: Date.now(),
      });
    }

    // Convert patterns to improvements
    const patternSuggestions = await this.patternAnalyzer.generateSuggestions(patterns);
    for (const suggestion of patternSuggestions) {
      improvements.push({
        id: suggestion.id,
        type: this.mapSuggestionTypeToImprovementType(suggestion.type),
        priority: suggestion.priority,
        title: suggestion.description.substring(0, 60),
        description: suggestion.description,
        suggestion: suggestion.description,
        estimatedImpact: suggestion.impact,
        status: 'pending',
        createdAt: Date.now(),
      });
    }

    return improvements;
  }

  private mapIssueTypeToImprovementType(
    type: 'unused_import' | 'dead_code' | 'performance' | 'security'
  ): Improvement['type'] {
    switch (type) {
      case 'unused_import':
      case 'dead_code':
        return 'code_cleanup';
      case 'performance':
        return 'performance';
      case 'security':
        return 'security';
      default:
        return 'code_cleanup';
    }
  }

  private mapSuggestionTypeToImprovementType(
    type: 'ui' | 'code' | 'performance' | 'security'
  ): Improvement['type'] {
    switch (type) {
      case 'ui':
        return 'ui_improvement';
      case 'code':
        return 'code_cleanup';
      case 'performance':
        return 'performance';
      case 'security':
        return 'security';
      default:
        return 'code_cleanup';
    }
  }

  private generateSuggestion(issue: {
    file: string;
    issue: string;
    type: 'unused_import' | 'dead_code' | 'performance' | 'security';
    line?: number;
  }): string {
    switch (issue.type) {
      case 'unused_import':
        return `Remove unused import at line ${issue.line}`;
      case 'dead_code':
        return `Clean up: ${issue.issue}`;
      case 'performance':
        return `Optimize performance: ${issue.issue}`;
      case 'security':
        return `Fix security issue: ${issue.issue}`;
      default:
        return `Fix: ${issue.issue}`;
    }
  }

  private estimateImpact(type: string): string {
    switch (type) {
      case 'security':
        return 'High - Security vulnerabilities';
      case 'performance':
        return 'Medium - Performance improvements';
      case 'unused_import':
        return 'Low - Code cleanliness';
      case 'dead_code':
        return 'Low - Code maintenance';
      default:
        return 'Medium - General improvement';
    }
  }
}

