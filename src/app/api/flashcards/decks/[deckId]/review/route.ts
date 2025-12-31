import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";
import { calculateSM2 } from "@/lib/flashcards/sm2";

interface RouteParams {
  params: Promise<{ deckId: string }>;
}

// POST /api/flashcards/decks/[deckId]/review - Submit card review
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { deckId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cardId, quality, responseMs } = body;

    if (!cardId || quality === undefined) {
      return NextResponse.json(
        { error: "cardId and quality are required" },
        { status: 400 }
      );
    }

    if (quality < 0 || quality > 5) {
      return NextResponse.json(
        { error: "Quality must be between 0 and 5" },
        { status: 400 }
      );
    }

    // Verify card belongs to deck and user has access
    const card = await prisma.flashcard.findFirst({
      where: {
        id: cardId,
        deckId,
        Deck: {
          OR: [{ userId: session.user.id }, { isPublic: true }],
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Calculate new SM-2 values
    const sm2Result = calculateSM2({
      quality,
      easeFactor: card.easeFactor,
      interval: card.interval,
      repetitions: card.repetitions,
    });

    // Update card with new values
    const updatedCard = await prisma.flashcard.update({
      where: { id: cardId },
      data: {
        easeFactor: sm2Result.easeFactor,
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions,
        nextReviewDate: sm2Result.nextReviewDate,
        lastReviewDate: new Date(),
      },
    });

    // Record the review
    await prisma.flashcardReview.create({
      data: {
        id: crypto.randomUUID(),
        flashcardId: cardId,
        userId: session.user.id,
        quality,
        responseMs,
      },
    });

    return NextResponse.json({
      success: true,
      card: updatedCard,
      nextReviewDate: sm2Result.nextReviewDate,
      interval: sm2Result.interval,
    });
  } catch (error) {
    console.error("Error recording review:", error);
    return NextResponse.json(
      { error: "Failed to record review" },
      { status: 500 }
    );
  }
}
