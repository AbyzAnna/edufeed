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

    // Verify card belongs to deck
    const card = await prisma.flashcard.findFirst({
      where: {
        id: cardId,
        deckId,
      },
      include: {
        Deck: {
          select: {
            userId: true,
            isPublic: true,
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Check if user has access to the deck
    const isOwner = card.Deck.userId === session.user.id;
    const isPublic = card.Deck.isPublic;

    if (!isOwner && !isPublic) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // SECURITY FIX: Only deck owners can modify the original card's SM2 values
    // Non-owners reviewing public decks get their progress tracked separately
    // without modifying the original card
    if (isOwner) {
      // Owner: Update the card's SM2 values directly
      const sm2Result = calculateSM2({
        quality,
        easeFactor: card.easeFactor,
        interval: card.interval,
        repetitions: card.repetitions,
      });

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
    } else {
      // Non-owner viewing public deck: Track review separately without modifying card
      // Check for existing user-specific review data
      const lastReview = await prisma.flashcardReview.findFirst({
        where: {
          flashcardId: cardId,
          userId: session.user.id,
        },
        orderBy: { createdAt: "desc" },
      });

      // Calculate SM2 based on user's personal progress (not the card's values)
      // Use defaults if this is their first review of this card
      const userEaseFactor = lastReview?.easeFactor ?? 2.5;
      const userInterval = lastReview?.interval ?? 1;
      const userRepetitions = lastReview?.repetitions ?? 0;

      const sm2Result = calculateSM2({
        quality,
        easeFactor: userEaseFactor,
        interval: userInterval,
        repetitions: userRepetitions,
      });

      // Record the review with user-specific SM2 values
      await prisma.flashcardReview.create({
        data: {
          id: crypto.randomUUID(),
          flashcardId: cardId,
          userId: session.user.id,
          quality,
          responseMs,
          // Store user-specific SM2 values in the review record
          easeFactor: sm2Result.easeFactor,
          interval: sm2Result.interval,
          repetitions: sm2Result.repetitions,
        },
      });

      return NextResponse.json({
        success: true,
        card: {
          ...card,
          // Return user-specific values, not the card's original values
          easeFactor: sm2Result.easeFactor,
          interval: sm2Result.interval,
          repetitions: sm2Result.repetitions,
          nextReviewDate: sm2Result.nextReviewDate,
        },
        nextReviewDate: sm2Result.nextReviewDate,
        interval: sm2Result.interval,
        isPublicDeck: true,
        message: "Your progress is tracked separately for this public deck",
      });
    }
  } catch (error) {
    console.error("Error recording review:", error);
    return NextResponse.json(
      { error: "Failed to record review" },
      { status: 500 }
    );
  }
}
