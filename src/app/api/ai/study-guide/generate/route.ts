import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/supabase/auth';
import { generateStudyGuide } from '@/lib/workers-client';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/ai/study-guide/generate
 * Generate a comprehensive study guide from a source
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request
    const body = await request.json();
    const { sourceId, difficulty = 'intermediate', focusAreas = [] } = body;

    if (!sourceId) {
      return NextResponse.json({ error: 'Missing sourceId' }, { status: 400 });
    }

    // 3. Verify user owns the source
    const source = await prisma.source.findFirst({
      where: {
        id: sourceId,
        userId: session.user.id,
      },
    });

    if (!source) {
      return NextResponse.json(
        { error: 'Source not found or access denied' },
        { status: 404 }
      );
    }

    // 4. Call Workers AI to generate study guide
    const studyGuide = await generateStudyGuide(sourceId, {
      difficulty,
      focusAreas,
    });

    // 5. Store study guide in database (optional - you might want to add a StudyGuide model)
    // For now, just return it to the client

    return NextResponse.json({
      success: true,
      studyGuide,
      source: {
        id: source.id,
        title: source.title,
        type: source.type,
      },
    });
  } catch (error) {
    console.error('Study guide generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate study guide',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
