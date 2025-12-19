/**
 * UI Analysis API
 */
import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
// Dynamic imports for CommonJS compatibility
let UIAnalyzer: any;
let setAlfredStatus: any;

try {
  const uiModule = require('../../../../lib/ui/ui-analyzer');
  UIAnalyzer = uiModule.UIAnalyzer;
  const stateModule = require('../../../../lib/alfred-state');
  setAlfredStatus = stateModule.setAlfredStatus;
} catch (error) {
  console.warn('[Alfred] UI analyzer not available:', error);
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  noStore();

  try {
    const body = await request.json();
    const { component } = body;

    const uiAnalyzer = new UIAnalyzer(process.env.CODEBASE_PATH || '/var/www/alessa-ordering');

    setAlfredStatus({
      status: 'thinking',
      currentTask: {
        id: `ui-analyze-${Date.now()}`,
        description: 'Analyzing UI components...',
        progress: 0,
      },
    });

    let analysis;

    if (component) {
      // Analyze specific component
      analysis = await uiAnalyzer.analyzeComponent(component);
    } else {
      // Analyze all components
      const analyses = await uiAnalyzer.analyzeComponents();
      const overallHealth = await uiAnalyzer.getOverallHealth();

      analysis = {
        overall: overallHealth,
        components: analyses,
      };
    }

    setAlfredStatus({
      status: 'active',
      lastAction: `UI analysis complete`,
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
      analysis,
    });
  } catch (error) {
    console.error('[Alfred] Error analyzing UI:', error);
    
    setAlfredStatus({
      status: 'active',
      currentTask: null,
    });

    return NextResponse.json(
      { error: 'Failed to analyze UI', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  noStore();

  try {
    const uiAnalyzer = new UIAnalyzer(process.env.CODEBASE_PATH || '/var/www/alessa-ordering');
    const health = await uiAnalyzer.getOverallHealth();

    return NextResponse.json({
      success: true,
      health,
    });
  } catch (error) {
    console.error('[Alfred] Error getting UI health:', error);
    return NextResponse.json(
      { error: 'Failed to get UI health' },
      { status: 500 }
    );
  }
}

