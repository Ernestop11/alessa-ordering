/**
 * Pattern Analyzer - Identifies patterns in user behavior and code changes
 * Uses AI to analyze events and generate insights
 */

import { EventRecorder, LearningEvent } from './event-recorder';
import OpenAI from 'openai';

export interface Pattern {
  id: string;
  type: 'workflow' | 'pain_point' | 'optimization' | 'error_pattern' | 'usage_pattern';
  confidence: number; // 0-1
  description: string;
  frequency: number;
  examples: LearningEvent[];
  suggestion?: string;
  impact?: 'high' | 'medium' | 'low';
}

export class PatternAnalyzer {
  private eventRecorder: EventRecorder;
  private openai: OpenAI | null = null;

  constructor(eventRecorder: EventRecorder) {
    this.eventRecorder = eventRecorder;

    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Analyze events and identify patterns
   */
  async analyzePatterns(events: LearningEvent[]): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    // 1. Analyze error patterns
    const errorPatterns = this.analyzeErrorPatterns(events);
    patterns.push(...errorPatterns);

    // 2. Analyze usage patterns
    const usagePatterns = this.analyzeUsagePatterns(events);
    patterns.push(...usagePatterns);

    // 3. Analyze workflow patterns
    const workflowPatterns = await this.analyzeWorkflowPatterns(events);
    patterns.push(...workflowPatterns);

    // 4. Analyze performance patterns
    const performancePatterns = this.analyzePerformancePatterns(events);
    patterns.push(...performancePatterns);

    // Sort by confidence and frequency
    return patterns.sort((a, b) => {
      const scoreA = a.confidence * a.frequency;
      const scoreB = b.confidence * b.frequency;
      return scoreB - scoreA;
    });
  }

  /**
   * Analyze error patterns
   */
  private analyzeErrorPatterns(events: LearningEvent[]): Pattern[] {
    const errorEvents = events.filter(e => e.type === 'error');
    const patterns: Pattern[] = [];

    // Group by error message
    const errorGroups = new Map<string, LearningEvent[]>();
    for (const event of errorEvents) {
      const errorMsg = event.metadata.error || 'Unknown error';
      if (!errorGroups.has(errorMsg)) {
        errorGroups.set(errorMsg, []);
      }
      errorGroups.get(errorMsg)!.push(event);
    }

    // Create patterns for frequent errors
    for (const [errorMsg, errorEvents] of errorGroups.entries()) {
      if (errorEvents.length >= 3) {
        patterns.push({
          id: `error-${errorMsg.substring(0, 20).replace(/\s/g, '-')}`,
          type: 'error_pattern',
          confidence: Math.min(1, errorEvents.length / 10),
          description: `Error occurs frequently: ${errorMsg}`,
          frequency: errorEvents.length,
          examples: errorEvents.slice(0, 5),
          suggestion: `Investigate and fix: ${errorMsg}`,
          impact: errorEvents.length > 10 ? 'high' : errorEvents.length > 5 ? 'medium' : 'low',
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze usage patterns
   */
  private analyzeUsagePatterns(events: LearningEvent[]): Pattern[] {
    const patterns: Pattern[] = [];
    const userActions = events.filter(e => e.type === 'user_action' || e.type === 'ui_interaction');

    // Most used components/routes
    const componentUsage = new Map<string, number>();
    const routeUsage = new Map<string, number>();

    for (const event of userActions) {
      if (event.metadata.component) {
        componentUsage.set(
          event.metadata.component,
          (componentUsage.get(event.metadata.component) || 0) + 1
        );
      }
      if (event.metadata.route) {
        routeUsage.set(
          event.metadata.route,
          (routeUsage.get(event.metadata.route) || 0) + 1
        );
      }
    }

    // Find most used components
    const topComponents = Array.from(componentUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    for (const [component, count] of topComponents) {
      if (count >= 5) {
        patterns.push({
          id: `usage-component-${component}`,
          type: 'usage_pattern',
          confidence: Math.min(1, count / 50),
          description: `Component "${component}" is heavily used (${count} times)`,
          frequency: count,
          examples: userActions.filter(e => e.metadata.component === component).slice(0, 3),
          suggestion: `Consider optimizing "${component}" for better performance`,
          impact: count > 30 ? 'high' : 'medium',
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze workflow patterns using AI
   */
  private async analyzeWorkflowPatterns(events: LearningEvent[]): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    if (!this.openai || events.length < 10) {
      return patterns;
    }

    try {
      // Group events by session
      const sessionGroups = new Map<string, LearningEvent[]>();
      for (const event of events) {
        const sessionId = event.sessionId || 'default';
        if (!sessionGroups.has(sessionId)) {
          sessionGroups.set(sessionId, []);
        }
        sessionGroups.get(sessionId)!.push(event);
      }

      // Analyze workflows in sessions
      const workflows: string[] = [];
      for (const [sessionId, sessionEvents] of sessionGroups.entries()) {
        if (sessionEvents.length >= 3) {
          const workflow = sessionEvents
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(e => `${e.type}:${e.metadata.action || e.metadata.component || 'unknown'}`)
            .join(' → ');
          workflows.push(workflow);
        }
      }

      if (workflows.length > 0) {
        // Use AI to identify common workflows
        const prompt = `Analyze these user workflows and identify common patterns:\n\n${workflows.slice(0, 20).join('\n')}\n\nIdentify the most common workflow patterns and suggest optimizations.`;

        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a UX analyst. Identify common workflow patterns and suggest optimizations.',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 500,
        });

        const analysis = response.choices[0]?.message?.content || '';
        
        if (analysis) {
          patterns.push({
            id: 'workflow-common',
            type: 'workflow',
            confidence: 0.7,
            description: 'Common workflow pattern identified',
            frequency: workflows.length,
            examples: events.slice(0, 5),
            suggestion: analysis.substring(0, 200),
            impact: 'medium',
          });
        }
      }
    } catch (error) {
      console.error('[PatternAnalyzer] Error analyzing workflows:', error);
    }

    return patterns;
  }

  /**
   * Analyze performance patterns
   */
  private analyzePerformancePatterns(events: LearningEvent[]): Pattern[] {
    const patterns: Pattern[] = [];
    const perfEvents = events.filter(e => e.type === 'performance' && e.metadata.duration);

    if (perfEvents.length === 0) return patterns;

    // Find slow operations
    const slowEvents = perfEvents.filter(e => (e.metadata.duration || 0) > 1000);
    
    if (slowEvents.length > 0) {
      const avgDuration = slowEvents.reduce((sum, e) => sum + (e.metadata.duration || 0), 0) / slowEvents.length;
      
      patterns.push({
        id: 'performance-slow',
        type: 'optimization',
        confidence: Math.min(1, slowEvents.length / 10),
        description: `${slowEvents.length} slow operations detected (avg: ${Math.round(avgDuration)}ms)`,
        frequency: slowEvents.length,
        examples: slowEvents.slice(0, 5),
        suggestion: `Optimize slow operations. Average duration: ${Math.round(avgDuration)}ms`,
        impact: avgDuration > 2000 ? 'high' : 'medium',
      });
    }

    return patterns;
  }

  /**
   * Generate improvement suggestions from patterns
   */
  async generateSuggestions(patterns: Pattern[]): Promise<Array<{
    id: string;
    type: 'ui' | 'code' | 'performance' | 'security';
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
  }>> {
    const suggestions = [];

    for (const pattern of patterns) {
      if (pattern.suggestion && pattern.confidence > 0.3) {
        let type: 'ui' | 'code' | 'performance' | 'security' = 'code';
        
        if (pattern.type === 'workflow' || pattern.type === 'usage_pattern') {
          type = 'ui';
        } else if (pattern.type === 'optimization' || pattern.type === 'error_pattern') {
          type = pattern.type === 'optimization' ? 'performance' : 'code';
        }

        suggestions.push({
          id: `suggestion-${pattern.id}`,
          type,
          priority: pattern.impact || 'medium',
          description: pattern.suggestion,
          impact: pattern.description,
        });
      }
    }

    return suggestions;
  }
}

