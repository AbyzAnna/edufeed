import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ deckId: string }>;
}

// GET /api/flashcards/decks/[deckId]/cards - List cards in deck
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { deckId } = await params;

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

    const cards = await prisma.flashcard.findMany({
      where: { deckId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 }
    );
  }
}

// POST /api/flashcards/decks/[deckId]/cards - Create card(s)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { deckId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify deck ownership
    const deck = await prisma.deck.findFirst({
      where: { id: deckId, userId: session.user.id },
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const body = await request.json();

    // Support both single card and bulk creation
    const cardsToCreate = Array.isArray(body) ? body : [body];

    // Validate cards
    for (const card of cardsToCreate) {
      if (!card.front || !card.back) {
        return NextResponse.json(
          { error: "Front and back are required for each card" },
          { status: 400 }
        );
      }
    }

    // Create cards
    const cards = await prisma.flashcard.createMany({
      data: cardsToCreate.map((card) => ({
        id: crypto.randomUUID(),
        deckId,
        front: card.front,
        back: card.back,
        hint: card.hint || null,
        imageUrl: card.imageUrl || null,
        audioUrl: card.audioUrl || null,
        updatedAt: new Date(),
      })),
    });

    // Fetch created cards
    const createdCards = await prisma.flashcard.findMany({
      where: { deckId },
      orderBy: { createdAt: "desc" },
      take: cardsToCreate.length,
    });

    return NextResponse.json(
      cardsToCreate.length === 1 ? createdCards[0] : createdCards,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating card:", error);
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 }
    );
  }
}
