/**
 * VPS Observatory - Page Scanner
 * Scans the app/ directory for all page.tsx files
 */

import fs from 'fs/promises';
import path from 'path';
import { VPSPageNode, PageGroup } from './types';

const APP_DIR = path.join(process.cwd(), 'app');

// Group detection based on path patterns
const GROUP_PATTERNS: [RegExp, PageGroup][] = [
  [/^\/admin/, 'admin'],
  [/^\/super-admin/, 'super-admin'],
  [/^\/associate/, 'associate'],
  [/^\/accountant/, 'accountant'],
  [/^\/customer/, 'customer'],
  [/^\/login|^\/owner\/login|^\/admin\/login/, 'auth'],
  [/^\/test/, 'test'],
  [/^\/order|^\/checkout|^\/catalog|^\/bakery|^\/grocery|^\/$/, 'public'],
];

function detectGroup(routePath: string): PageGroup {
  for (const [pattern, group] of GROUP_PATTERNS) {
    if (pattern.test(routePath)) return group;
  }
  return 'public';
}

function extractComponentName(content: string): string {
  // Try to find export default function/const name
  const defaultFuncMatch = content.match(/export\s+default\s+(?:async\s+)?function\s+(\w+)/);
  if (defaultFuncMatch) return defaultFuncMatch[1];

  const defaultConstMatch = content.match(/export\s+default\s+(\w+)/);
  if (defaultConstMatch) return defaultConstMatch[1];

  return 'Page';
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const importRegex = /import\s+(?:(?:\{[^}]+\}|[\w*]+)\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function getDefaultPosition(group: PageGroup, indexInGroup: number): { x: number; y: number } {
  // Grid layout with groups in columns
  const groupColumns: Record<PageGroup, number> = {
    'public': 0,
    'admin': 1,
    'super-admin': 2,
    'associate': 3,
    'accountant': 4,
    'customer': 5,
    'auth': 6,
    'test': 7,
  };

  const col = groupColumns[group] ?? 0;
  const row = indexInGroup;

  return {
    x: 100 + col * 280,
    y: 150 + row * 160,
  };
}

function buildPreviewUrl(route: string, tenant: string = 'lasreinas'): string {
  // For tenant-scoped pages, we'd add tenant context
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alessacloud.com';
  return `${baseUrl}${route}`;
}

export async function scanPages(): Promise<VPSPageNode[]> {
  const pages: VPSPageNode[] = [];
  const groupCounts: Record<PageGroup, number> = {
    'public': 0,
    'admin': 0,
    'super-admin': 0,
    'associate': 0,
    'accountant': 0,
    'customer': 0,
    'auth': 0,
    'test': 0,
  };

  async function walkDir(dir: string, routePath: string = '') {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip system directories
        if (['node_modules', '.next', '.git', 'api'].includes(entry.name)) continue;

        // Handle route groups (parentheses) - they don't add to the URL
        let newRoutePath: string;
        if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
          newRoutePath = routePath;
        } else if (entry.name.startsWith('[') && entry.name.endsWith(']')) {
          // Dynamic routes
          newRoutePath = `${routePath}/${entry.name}`;
        } else {
          newRoutePath = `${routePath}/${entry.name}`;
        }

        await walkDir(fullPath, newRoutePath);
      }

      if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
        try {
          const stat = await fs.stat(fullPath);
          const content = await fs.readFile(fullPath, 'utf-8');

          const group = detectGroup(routePath || '/');
          const route = routePath || '/';

          pages.push({
            id: route.replace(/\//g, '-').replace(/^-/, '') || 'root',
            route,
            filePath: path.relative(process.cwd(), fullPath),
            componentName: extractComponentName(content),
            group,
            lastModified: stat.mtime.toISOString(),
            position: getDefaultPosition(group, groupCounts[group]),
            previewUrl: buildPreviewUrl(route),
            requiresAuth: ['admin', 'super-admin', 'associate', 'accountant'].includes(group),
            hasClientDirective: content.includes('"use client"') || content.includes("'use client'"),
            imports: extractImports(content).slice(0, 10), // Limit to first 10
          });

          groupCounts[group]++;
        } catch (err) {
          console.error(`Error scanning ${fullPath}:`, err);
        }
      }
    }
  }

  await walkDir(APP_DIR);

  // Sort by group and then by route
  pages.sort((a, b) => {
    if (a.group !== b.group) {
      const groupOrder: PageGroup[] = ['public', 'admin', 'super-admin', 'associate', 'accountant', 'customer', 'auth', 'test'];
      return groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group);
    }
    return a.route.localeCompare(b.route);
  });

  return pages;
}

export async function scanApiRoutes(): Promise<{ route: string; methods: string[]; filePath: string }[]> {
  const apiRoutes: { route: string; methods: string[]; filePath: string }[] = [];
  const apiDir = path.join(APP_DIR, 'api');

  async function walkApiDir(dir: string, routePath: string = '/api') {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name.startsWith('[') && entry.name.endsWith(']')) {
          await walkApiDir(fullPath, `${routePath}/${entry.name}`);
        } else {
          await walkApiDir(fullPath, `${routePath}/${entry.name}`);
        }
      }

      if (entry.name === 'route.ts' || entry.name === 'route.js') {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const methods: string[] = [];

          if (content.includes('export async function GET') || content.includes('export function GET')) {
            methods.push('GET');
          }
          if (content.includes('export async function POST') || content.includes('export function POST')) {
            methods.push('POST');
          }
          if (content.includes('export async function PUT') || content.includes('export function PUT')) {
            methods.push('PUT');
          }
          if (content.includes('export async function DELETE') || content.includes('export function DELETE')) {
            methods.push('DELETE');
          }
          if (content.includes('export async function PATCH') || content.includes('export function PATCH')) {
            methods.push('PATCH');
          }

          apiRoutes.push({
            route: routePath,
            methods,
            filePath: path.relative(process.cwd(), fullPath),
          });
        } catch {
          // Skip files we can't read
        }
      }
    }
  }

  await walkApiDir(apiDir);
  return apiRoutes.sort((a, b) => a.route.localeCompare(b.route));
}

export function getPageStats(pages: VPSPageNode[]) {
  const byGroup: Record<PageGroup, number> = {
    'public': 0,
    'admin': 0,
    'super-admin': 0,
    'associate': 0,
    'accountant': 0,
    'customer': 0,
    'auth': 0,
    'test': 0,
  };

  for (const page of pages) {
    byGroup[page.group]++;
  }

  return {
    total: pages.length,
    byGroup,
    clientComponents: pages.filter(p => p.hasClientDirective).length,
    serverComponents: pages.filter(p => !p.hasClientDirective).length,
    protectedPages: pages.filter(p => p.requiresAuth).length,
  };
}
