import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ deckId: string; cardId: string }>;
}

// GET /api/flashcards/decks/[deckId]/cards/[cardId] - Get single card
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { deckId, cardId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    return NextResponse.json(card);
  } catch (error) {
    console.error("Error fetching card:", error);
    return NextResponse.json(
      { error: "Failed to fetch card" },
      { status: 500 }
    );
  }
}

// PATCH /api/flashcards/decks/[deckId]/cards/[cardId] - Update card
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { deckId, cardId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existingCard = await prisma.flashcard.findFirst({
      where: {
        id: cardId,
        deckId,
        Deck: { userId: session.user.id },
      },
    });

    if (!existingCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const body = await request.json();
    const { front, back, hint, imageUrl, audioUrl } = body;

    const card = await prisma.flashcard.update({
      where: { id: cardId },
      data: {
        ...(front && { front }),
        ...(back && { back }),
        ...(hint !== undefined && { hint }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(audioUrl !== undefined && { audioUrl }),
      },
    });

    return NextResponse.json(card);
  } catch (error) {
    console.error("Error updating card:", error);
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 }
    );
  }
}

// DELETE /api/flashcards/decks/[deckId]/cards/[cardId] - Delete card
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { deckId, cardId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existingCard = await prisma.flashcard.findFirst({
      where: {
        id: cardId,
        deckId,
        Deck: { userId: session.user.id },
      },
    });

    if (!existingCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    await prisma.flashcard.delete({
      where: { id: cardId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting card:", error);
    return NextResponse.json(
      { error: "Failed to delete card" },
      { status: 500 }
    );
  }
}
