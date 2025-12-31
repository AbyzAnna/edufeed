import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";
import { calculateSM2 } from "@/lib/generation/flashcard";

// GET - Get cards due for review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const session = await getAuthSession();
    const { deckId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify deck ownership
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        userId: session.user.id,
      },
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const includeNew = searchParams.get("includeNew") !== "false";

    const now = new Date();

    // Get cards due for review (past nextReviewDate)
    const dueCards = await prisma.flashcard.findMany({
      where: {
        deckId,
        nextReviewDate: { lte: now },
      },
      orderBy: { nextReviewDate: "asc" },
      take: limit,
    });

    // If we need more cards and includeNew is true, add new cards
    let cards = dueCards;
    if (includeNew && cards.length < limit) {
      const newCards = await prisma.flashcard.findMany({
        where: {
          deckId,
          repetitions: 0,
          nextReviewDate: { gt: now },
        },
        take: limit - cards.length,
        orderBy: { createdAt: "asc" },
      });
      cards = [...cards, ...newCards];
    }

    return NextResponse.json({
      cards,
      deckTitle: deck.title,
      totalDue: dueCards.length,
    });
  } catch (error) {
    console.error("Error fetching review cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch review cards" },
      { status: 500 }
    );
  }
}

// POST - Submit a card review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
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

    // Fetch the card and verify ownership
    const card = await prisma.flashcard.findFirst({
      where: {
        id: cardId,
        deckId,
        Deck: {
          userId: session.user.id,
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Calculate new SM-2 values
    const sm2Result = calculateSM2(
      quality,
      card.easeFactor,
      card.interval,
      card.repetitions
    );

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + sm2Result.interval);

    // Update the card
    await prisma.flashcard.update({
      where: { id: cardId },
      data: {
        easeFactor: sm2Result.easeFactor,
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions,
        nextReviewDate,
        lastReviewDate: new Date(),
      },
    });

    // Create review record
    await prisma.flashcardReview.create({
      data: {
        id: crypto.randomUUID(),
        flashcardId: cardId,
        userId: session.user.id,
        quality,
        responseMs: responseMs || null,
      },
    });

    return NextResponse.json({
      message: "Review recorded",
      nextReview: {
        easeFactor: sm2Result.easeFactor,
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions,
        nextReviewDate,
      },
    });
  } catch (error) {
    console.error("Error recording review:", error);
    return NextResponse.json(
      { error: "Failed to record review" },
      { status: 500 }
    );
  }
}
