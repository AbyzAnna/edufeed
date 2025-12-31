import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";
import { getCardsForReview, calculateDeckStats } from "@/lib/flashcards/sm2";

interface RouteParams {
  params: Promise<{ deckId: string }>;
}

// GET /api/flashcards/decks/[deckId]/study - Get cards for study session
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { deckId } = await params;
    const searchParams = request.nextUrl.searchParams;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify deck access
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        OR: [{ userId: session.user.id }, { isPublic: true }],
      },
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const limit = parseInt(searchParams.get("limit") || "20");
    const includeNew = searchParams.get("includeNew") !== "false";

    // Get all cards for the deck
    const allCards = await prisma.flashcard.findMany({
      where: { deckId },
      select: {
        id: true,
        front: true,
        back: true,
        hint: true,
        imageUrl: true,
        audioUrl: true,
        easeFactor: true,
        interval: true,
        repetitions: true,
        nextReviewDate: true,
        lastReviewDate: true,
      },
    });

    // Get due cards
    const dueCards = getCardsForReview(allCards, limit);

    // If we want new cards and have room, add some
    let studyCards = [...dueCards];
    if (includeNew && studyCards.length < limit) {
      const newCards = allCards
        .filter((c) => c.repetitions === 0)
        .filter((c) => !studyCards.find((sc) => sc.id === c.id))
        .slice(0, limit - studyCards.length);
      studyCards = [...studyCards, ...newCards];
    }

    // Shuffle the cards for varied study experience
    studyCards = studyCards.sort(() => Math.random() - 0.5);

    // Calculate deck stats
    const stats = calculateDeckStats(allCards);

    return NextResponse.json({
      cards: studyCards,
      stats,
      totalCards: allCards.length,
    });
  } catch (error) {
    console.error("Error fetching study cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch study cards" },
      { status: 500 }
    );
  }
}
