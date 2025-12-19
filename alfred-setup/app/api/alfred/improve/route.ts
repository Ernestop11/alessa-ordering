import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST() {
  noStore();
  
  // Get state functions from global or require status route
  let getAlfredStatus: any;
  let setAlfredStatus: any;

  if ((global as any).getAlfredStatus) {
    getAlfredStatus = (global as any).getAlfredStatus;
    setAlfredStatus = (global as any).setAlfredStatus;
  } else {
    try {
      const statusModule = require('./status/route');
      getAlfredStatus = statusModule.getAlfredStatus;
      setAlfredStatus = statusModule.setAlfredStatus;
    } catch (error) {
      // Ultimate fallback
      let fallbackStatus: any = {
        status: 'active',
        lastAction: 'Initialized',
        improvementsToday: 0,
        tasksCompleted: 0,
        suggestions: [],
        currentTask: null,
      };
      getAlfredStatus = () => ({ ...fallbackStatus });
      setAlfredStatus = (updates: any) => { fallbackStatus = { ...fallbackStatus, ...updates }; };
    }
  }

  try {
    // Update status to "working"
    setAlfredStatus({
      status: 'working',
      currentTask: {
        id: `improve-${Date.now()}`,
        description: 'Running improvement cycle...',
        progress: 0,
      },
    });

    // Try to load learning system
    let EventRecorder, PatternAnalyzer, ImprovementEngine;
    try {
      const learning = require('../../../../lib/learning/event-recorder');
      EventRecorder = learning.getEventRecorder;
      const patternModule = require('../../../../lib/learning/pattern-analyzer');
      PatternAnalyzer = patternModule.PatternAnalyzer;
      const improvementModule = require('../../../../lib/learning/improvement-engine');
      ImprovementEngine = improvementModule.ImprovementEngine;
    } catch (error) {
      console.warn('[Alfred] Learning system not available, using code cleaner:', error);
      
      // Fallback: Use code cleaner to find issues
      const CodeCleaner = require('../../../../lib/cleaning/code-cleaner').CodeCleaner;
      const codeCleaner = new CodeCleaner(process.env.CODEBASE_PATH || '/var/www/alessa-ordering');
      const issues = await codeCleaner.findIssues();
      
      const suggestions = issues.slice(0, 20).map((issue: any) => ({
        id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: issue.type === 'console_log' ? 'code' : 'code',
        priority: issue.severity === 'high' ? 'high' : issue.severity === 'medium' ? 'medium' : 'low',
        description: issue.fix || issue.description,
        impact: `Found in ${issue.file}:${issue.line}`,
      }));

      setAlfredStatus({
        status: 'active',
        lastAction: `Found ${issues.length} code issues using code cleaner`,
        improvementsToday: issues.length,
        suggestions,
        currentTask: null,
      });

      return NextResponse.json({
        success: true,
        message: 'Improvement cycle completed (using code cleaner)',
        patternsFound: 0,
        improvementsGenerated: issues.length,
        suggestions: suggestions.length,
      });
    }

    // Initialize learning system
    const eventRecorder = EventRecorder();
    const patternAnalyzer = new PatternAnalyzer(eventRecorder);
    const improvementEngine = new ImprovementEngine(
      eventRecorder,
      patternAnalyzer,
      process.env.CODEBASE_PATH || '/var/www/alessa-ordering'
    );

    // Run improvement cycle
    const result = await improvementEngine.runImprovementCycle();

    // Convert improvements to suggestions format
    const suggestions = result.suggestions.slice(0, 20).map((improvement: any) => ({
      id: improvement.id,
      type: improvement.type === 'ui_improvement' ? 'ui' :
            improvement.type === 'code_cleanup' ? 'code' :
            improvement.type === 'performance' ? 'performance' :
            improvement.type === 'security' ? 'security' : 'code',
      priority: improvement.priority,
      description: improvement.suggestion || improvement.description,
      impact: improvement.estimatedImpact,
    }));

    // Update status
    setAlfredStatus({
      status: 'active',
      lastAction: `Found ${result.patternsFound} patterns, generated ${result.improvementsGenerated} improvements`,
      improvementsToday: result.improvementsGenerated,
      suggestions,
      currentTask: null,
    });

    // Broadcast via WebSocket if available
    try {
      if ((global as any).alfredBroadcast) {
        (global as any).alfredBroadcast.improvementComplete(result);
        (global as any).alfredBroadcast.suggestions(suggestions);
      }
    } catch (error) {
      // WebSocket not available, ignore
    }

    return NextResponse.json({
      success: true,
      message: 'Improvement cycle completed',
      patternsFound: result.patternsFound,
      improvementsGenerated: result.improvementsGenerated,
      suggestions: suggestions.length,
    });
  } catch (error) {
    console.error('[Alfred] Error in improvement cycle:', error);
    
    setAlfredStatus({
      status: 'active',
      currentTask: null,
    });

    return NextResponse.json(
      { 
        error: 'Failed to run improvement cycle',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
