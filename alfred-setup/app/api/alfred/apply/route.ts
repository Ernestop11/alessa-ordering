import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { getAlfredStatus, setAlfredStatus } from '../../../../lib/alfred-state';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  noStore();
  
  try {
    const body = await request.json();
    const { suggestionId } = body;

    if (!suggestionId) {
      return NextResponse.json({ error: 'suggestionId is required' }, { status: 400 });
    }

    // Find the suggestion
    const status = getAlfredStatus();
    const suggestion = status.suggestions.find(s => s.id === suggestionId);

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    // Record the application event (if learning system available)
    try {
      const learning = require('../../../../lib/learning/event-recorder');
      const eventRecorder = learning.getEventRecorder();
      await eventRecorder.record({
        type: 'user_action',
        metadata: {
          action: 'apply_suggestion',
          suggestionId,
          suggestionType: suggestion.type,
          suggestionPriority: suggestion.priority,
        },
      });
    } catch (error) {
      console.warn('[Alfred] Could not record event:', error);
    }

    // TODO: Actually apply the suggestion
    // This would involve:
    // 1. Loading the file
    // 2. Making the code change
    // 3. Saving the file
    // 4. Running tests if applicable

    console.log(`[Alfred] Applying suggestion: ${suggestionId}`);
    console.log(`[Alfred] Suggestion: ${suggestion.description}`);

    // For now, just mark as applied
    const updatedSuggestions = status.suggestions.map(s =>
      s.id === suggestionId ? { ...s, applied: true } : s
    );

    setAlfredStatus({
      suggestions: updatedSuggestions,
      lastAction: `Applied suggestion: ${suggestion.description.substring(0, 50)}...`,
      tasksCompleted: status.tasksCompleted + 1,
    });

    return NextResponse.json({
      success: true,
      message: `Suggestion ${suggestionId} applied successfully`,
      suggestion,
    });
  } catch (error) {
    console.error('[Alfred] Error applying suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to apply suggestion' },
      { status: 500 }
    );
  }
}
