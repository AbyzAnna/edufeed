import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ deckId: string }>;
}

// GET /api/flashcards/decks/[deckId] - Get deck with all cards
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { deckId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        OR: [
          { userId: session.user.id },
          { isPublic: true },
        ],
      },
      include: {
        Flashcard: {
          orderBy: { createdAt: "asc" },
        },
        Source: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        _count: {
          select: { Flashcard: true },
        },
      },
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    return NextResponse.json(deck);
  } catch (error) {
    console.error("Error fetching deck:", error);
    return NextResponse.json(
      { error: "Failed to fetch deck" },
      { status: 500 }
    );
  }
}

// PATCH /api/flashcards/decks/[deckId] - Update deck
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { deckId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existingDeck = await prisma.deck.findFirst({
      where: { id: deckId, userId: session.user.id },
    });

    if (!existingDeck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, color, isPublic } = body;

    const deck = await prisma.deck.update({
      where: { id: deckId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json(deck);
  } catch (error) {
    console.error("Error updating deck:", error);
    return NextResponse.json(
      { error: "Failed to update deck" },
      { status: 500 }
    );
  }
}

// DELETE /api/flashcards/decks/[deckId] - Delete deck
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { deckId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existingDeck = await prisma.deck.findFirst({
      where: { id: deckId, userId: session.user.id },
    });

    if (!existingDeck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    await prisma.deck.delete({
      where: { id: deckId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting deck:", error);
    return NextResponse.json(
      { error: "Failed to delete deck" },
      { status: 500 }
    );
  }
}
