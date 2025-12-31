import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/supabase/auth';
import { chatWithDocument } from '@/lib/workers-client';
import { prisma } from '@/lib/prisma';

/**
 * Example API route showing how to integrate Workers AI
 * POST /api/ai/chat - Chat with a document
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
    const { sourceId, message } = body;

    if (!sourceId || !message) {
      return NextResponse.json(
        { error: 'Missing sourceId or message' },
        { status: 400 }
      );
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

    // 4. Call Workers AI
    const response = await chatWithDocument(sourceId, message);

    // 5. Optional: Log the interaction in your database
    // await prisma.chatMessage.create({
    //   data: {
    //     userId: session.user.id,
    //     sourceId,
    //     message,
    //     response: response.response,
    //   },
    // });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
