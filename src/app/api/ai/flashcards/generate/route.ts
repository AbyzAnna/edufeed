import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/supabase/auth';
import { generateFlashcards } from '@/lib/workers-client';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/ai/flashcards/generate
 * Generate flashcards from a source using AI
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
    const { sourceId, count = 20, difficulty = 'medium', topics = [] } = body;

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

    // 4. Call Workers AI to generate flashcards
    const result = await generateFlashcards(sourceId, {
      count,
      difficulty,
      topics,
    });

    // 5. Create a deck in the database
    const deck = await prisma.deck.create({
      data: {
        id: crypto.randomUUID(),
        userId: source.userId,
        sourceId: source.id,
        title: `${source.title} - AI Generated Flashcards`,
        description: `Generated ${result.cards.length} flashcards with ${difficulty} difficulty`,
        updatedAt: new Date(),
        Flashcard: {
          create: result.cards.map((card) => ({
            id: crypto.randomUUID(),
            front: card.front,
            back: card.back,
            hint: card.hint || undefined,
            updatedAt: new Date(),
          })),
        },
      },
      include: {
        Flashcard: true,
      },
    });

    return NextResponse.json({
      success: true,
      deck,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('Flashcard generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate flashcards',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
