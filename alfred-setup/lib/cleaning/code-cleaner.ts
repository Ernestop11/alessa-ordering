/**
 * Code Cleaner - Automatically cleans up code issues
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface CodeIssue {
  file: string;
  line: number;
  type: 'unused_import' | 'console_log' | 'todo' | 'dead_code' | 'formatting';
  severity: 'high' | 'medium' | 'low';
  description: string;
  fix: string;
}

export interface CleanupResult {
  file: string;
  issuesFixed: number;
  changes: Array<{
    line: number;
    type: string;
    before: string;
    after: string;
  }>;
}

export class CodeCleaner {
  private codebasePath: string;

  constructor(codebasePath: string = '/var/www/alessa-ordering') {
    this.codebasePath = codebasePath;
  }

  /**
   * Clean a single file
   */
  async cleanFile(filePath: string): Promise<CleanupResult> {
    const issues: CodeIssue[] = [];
    const changes: CleanupResult['changes'] = [];

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const newLines: string[] = [];
      let modified = false;

      // Track imports to check for usage
      const imports: Map<number, { line: string; names: string[] }> = new Map();
      const usedImports = new Set<string>();

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        let newLine = line;

        // Check for imports
        if (trimmed.startsWith('import')) {
          const importMatch = line.match(/import\s+(?:(?:\{([^}]+)\}|(\w+))\s+from\s+)?['"]([^'"]+)['"]/);
          if (importMatch) {
            const namedImports = importMatch[1]?.split(',').map(s => s.trim()) || [];
            const defaultImport = importMatch[2];
            const modulePath = importMatch[3];

            imports.set(i, { line, names: [...namedImports, defaultImport].filter(Boolean) });

            // Check if imports are used (simple check)
            const allImports = [...namedImports, defaultImport].filter(Boolean);
            const isUsed = allImports.some(imp => {
              if (!imp) return false;
              // Check if import name appears in rest of file
              const restOfFile = lines.slice(i + 1).join('\n');
              return restOfFile.includes(imp.split(' as ')[0].trim());
            });

            if (!isUsed && modulePath.startsWith('.')) {
              // Potentially unused relative import
              issues.push({
                file: filePath,
                line: i + 1,
                type: 'unused_import',
                severity: 'medium',
                description: `Potentially unused import: ${line.trim()}`,
                fix: `Remove unused import`,
              });
              // Don't add the line (remove it)
              modified = true;
              continue;
            }
          }
        }

        // Remove console.log in production code
        if (trimmed.includes('console.log') && !trimmed.includes('//')) {
          issues.push({
            file: filePath,
            line: i + 1,
            type: 'console_log',
            severity: 'low',
            description: 'console.log found (should be removed in production)',
            fix: 'Remove console.log statement',
          });
          changes.push({
            line: i + 1,
            type: 'console_log',
            before: line,
            after: `// ${line.trim()} // Removed by Alfred`,
          });
          newLine = `// ${line.trim()} // Removed by Alfred`;
          modified = true;
        }

        // Flag TODO/FIXME comments
        if (trimmed.match(/TODO|FIXME|HACK/i) && !trimmed.startsWith('//')) {
          issues.push({
            file: filePath,
            line: i + 1,
            type: 'todo',
            severity: 'low',
            description: `TODO/FIXME comment: ${trimmed}`,
            fix: 'Address TODO/FIXME',
          });
        }

        // Remove empty lines at end of blocks (formatting)
        if (trimmed === '' && i > 0 && lines[i - 1].trim() === '' && i < lines.length - 1) {
          // Skip extra empty lines
          continue;
        }

        newLines.push(newLine);
      }

      if (modified) {
        const newContent = newLines.join('\n');
        await fs.writeFile(filePath, newContent, 'utf-8');

        return {
          file: filePath,
          issuesFixed: issues.length,
          changes,
        };
      }

      return {
        file: filePath,
        issuesFixed: 0,
        changes: [],
      };
    } catch (error) {
      console.error(`[CodeCleaner] Error cleaning file ${filePath}:`, error);
      return {
        file: filePath,
        issuesFixed: 0,
        changes: [],
      };
    }
  }

  /**
   * Clean multiple files
   */
  async cleanFiles(filePaths: string[]): Promise<CleanupResult[]> {
    const results: CleanupResult[] = [];

    for (const filePath of filePaths) {
      const result = await this.cleanFile(filePath);
      results.push(result);
    }

    return results;
  }

  /**
   * Find files with issues
   */
  async findIssues(directory: string = this.codebasePath): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    const files = await this.findSourceFiles(directory, ['.ts', '.tsx', '.js', '.jsx']);

    for (const file of files.slice(0, 100)) { // Limit to 100 files
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();

          // Check for console.log
          if (trimmed.includes('console.log') && !trimmed.includes('//')) {
            issues.push({
              file,
              line: i + 1,
              type: 'console_log',
              severity: 'low',
              description: 'console.log found',
              fix: 'Remove console.log',
            });
          }

          // Check for TODO/FIXME
          if (trimmed.match(/TODO|FIXME|HACK/i) && !trimmed.startsWith('//')) {
            issues.push({
              file,
              line: i + 1,
              type: 'todo',
              severity: 'low',
              description: `TODO/FIXME: ${trimmed}`,
              fix: 'Address TODO/FIXME',
            });
          }
        }
      } catch (error) {
        // Skip files we can't read
      }
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
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next') {
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
}

