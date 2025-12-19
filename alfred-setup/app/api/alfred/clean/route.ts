/**
 * Code Cleaning API
 */
import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
// Dynamic imports for CommonJS compatibility
let CodeCleaner: any;
let setAlfredStatus: any;

try {
  const cleanerModule = require('../../../../lib/cleaning/code-cleaner');
  CodeCleaner = cleanerModule.CodeCleaner;
  const stateModule = require('../../../../lib/alfred-state');
  setAlfredStatus = stateModule.setAlfredStatus;
} catch (error) {
  console.warn('[Alfred] Code cleaning not available:', error);
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  noStore();

  try {
    const body = await request.json();
    const { files, autoApply } = body;

    const codeCleaner = new CodeCleaner(process.env.CODEBASE_PATH || '/var/www/alessa-ordering');

    setAlfredStatus({
      status: 'working',
      currentTask: {
        id: `clean-${Date.now()}`,
        description: 'Cleaning code...',
        progress: 0,
      },
    });

    let results;

    if (files && Array.isArray(files)) {
      // Clean specific files
      results = await codeCleaner.cleanFiles(files);
    } else {
      // Find and clean all issues
      const issues = await codeCleaner.findIssues();
      const filesToClean = [...new Set(issues.map(i => i.file))];
      results = await codeCleaner.cleanFiles(filesToClean.slice(0, 20)); // Limit to 20 files
    }

    const totalFixed = results.reduce((sum, r) => sum + r.issuesFixed, 0);

    setAlfredStatus({
      status: 'active',
      lastAction: `Cleaned ${results.length} files, fixed ${totalFixed} issues`,
      currentTask: null,
    });

    // Broadcast via WebSocket if available
    try {
      if ((global as any).alfredBroadcast) {
        (global as any).alfredBroadcast.status();
      }
    } catch (error) {
      // WebSocket not available
    }

    return NextResponse.json({
      success: true,
      filesCleaned: results.length,
      issuesFixed: totalFixed,
      results,
    });
  } catch (error) {
    console.error('[Alfred] Error cleaning code:', error);
    
    setAlfredStatus({
      status: 'active',
      currentTask: null,
    });

    return NextResponse.json(
      { error: 'Failed to clean code', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  noStore();

  try {
    const codeCleaner = new CodeCleaner(process.env.CODEBASE_PATH || '/var/www/alessa-ordering');
    const issues = await codeCleaner.findIssues();

    return NextResponse.json({
      success: true,
      totalIssues: issues.length,
      issues: issues.slice(0, 50), // Return top 50
      issuesByType: {
        unused_import: issues.filter(i => i.type === 'unused_import').length,
        console_log: issues.filter(i => i.type === 'console_log').length,
        todo: issues.filter(i => i.type === 'todo').length,
        dead_code: issues.filter(i => i.type === 'dead_code').length,
      },
    });
  } catch (error) {
    console.error('[Alfred] Error finding issues:', error);
    return NextResponse.json(
      { error: 'Failed to find issues' },
      { status: 500 }
    );
  }
}

