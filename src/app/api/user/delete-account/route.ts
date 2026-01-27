import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { getAuthSession } from "@/lib/supabase/auth";
import { rateLimiters } from "@/lib/rate-limit";

/**
 * GDPR-compliant account deletion endpoint
 * Permanently deletes all user data including:
 * - User profile and settings
 * - All user-generated content (videos, notebooks, decks, etc.)
 * - Social data (follows, likes, comments, bookmarks)
 * - Messages and conversations
 * - Analytics and usage data
 */
export async function DELETE() {
  try {
    // Use unified auth session (supports both cookie and Bearer token auth)
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Apply rate limiting (5 requests per hour - very sensitive operation)
    const rateLimit = rateLimiters.accountDelete(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many deletion attempts. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetTime / 1000)),
          },
        }
      );
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log(`Starting GDPR deletion for user: ${userId}`);

    // Delete all user data in order (respecting foreign key constraints)
    // Using a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Delete flashcard reviews
      await tx.flashcardReview.deleteMany({ where: { userId } });

      // 2. Delete quiz attempts and answers
      const quizAttempts = await tx.quizAttempt.findMany({
        where: { userId },
        select: { id: true },
      });
      const attemptIds = quizAttempts.map((a) => a.id);
      await tx.answer.deleteMany({
        where: { attemptId: { in: attemptIds } },
      });
      await tx.quizAttempt.deleteMany({ where: { userId } });

      // 3. Delete user's quizzes (with questions and answers)
      const quizzes = await tx.quiz.findMany({
        where: { userId },
        select: { id: true },
      });
      const quizIds = quizzes.map((q) => q.id);
      await tx.answer.deleteMany({
        where: { Question: { quizId: { in: quizIds } } },
      });
      await tx.question.deleteMany({
        where: { quizId: { in: quizIds } },
      });
      await tx.quiz.deleteMany({ where: { userId } });

      // 4. Delete comment likes and comments
      await tx.commentLike.deleteMany({
        where: { Comment: { userId } },
      });
      await tx.comment.deleteMany({ where: { userId } });

      // 5. Delete feed interactions (likes, bookmarks, shares)
      await tx.feedLike.deleteMany({ where: { userId } });
      await tx.feedBookmark.deleteMany({ where: { userId } });
      await tx.share.deleteMany({ where: { userId } });

      // 6. Delete video interactions
      await tx.like.deleteMany({ where: { userId } });
      await tx.bookmark.deleteMany({ where: { userId } });

      // 7. Delete flashcards and decks
      const decks = await tx.deck.findMany({
        where: { userId },
        select: { id: true },
      });
      const deckIds = decks.map((d) => d.id);
      await tx.flashcard.deleteMany({
        where: { deckId: { in: deckIds } },
      });
      await tx.deck.deleteMany({ where: { userId } });

      // 8. Delete media content related data
      await tx.mediaNote.deleteMany({ where: { userId } });
      await tx.mediaBookmark.deleteMany({ where: { userId } });
      await tx.mediaContent.deleteMany({ where: { userId } });

      // 9. Delete notifications
      await tx.notification.deleteMany({ where: { userId } });

      // 10. Delete follows (both as follower and following)
      await tx.follow.deleteMany({
        where: { OR: [{ followerId: userId }, { followingId: userId }] },
      });

      // 11. Delete messages and conversations
      await tx.directMessage.deleteMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      });
      await tx.conversationParticipant.deleteMany({ where: { userId } });

      // 12. Delete study rooms and related data
      await tx.studyRoomMessage.deleteMany({ where: { userId } });
      await tx.studyRoomParticipant.deleteMany({ where: { userId } });
      const studyRooms = await tx.studyRoom.findMany({
        where: { hostId: userId },
        select: { id: true },
      });
      const roomIds = studyRooms.map((r) => r.id);
      await tx.studyRoomAnnotation.deleteMany({
        where: { roomId: { in: roomIds } },
      });
      await tx.studyRoomInvite.deleteMany({
        where: { roomId: { in: roomIds } },
      });
      await tx.studyRoomMessage.deleteMany({
        where: { roomId: { in: roomIds } },
      });
      await tx.studyRoomParticipant.deleteMany({
        where: { roomId: { in: roomIds } },
      });
      await tx.studySession.deleteMany({
        where: { roomId: { in: roomIds } },
      });
      await tx.studyRoom.deleteMany({ where: { hostId: userId } });

      // 13. Delete notebooks and related data
      const notebooks = await tx.notebook.findMany({
        where: { userId },
        select: { id: true },
      });
      const notebookIds = notebooks.map((n) => n.id);

      // Delete notebook sources and their embeddings
      const sources = await tx.notebookSource.findMany({
        where: { notebookId: { in: notebookIds } },
        select: { id: true },
      });
      const sourceIds = sources.map((s) => s.id);
      await tx.sourceEmbedding.deleteMany({
        where: { sourceId: { in: sourceIds } },
      });
      await tx.notebookCitation.deleteMany({
        where: { sourceId: { in: sourceIds } },
      });
      await tx.notebookSource.deleteMany({
        where: { notebookId: { in: notebookIds } },
      });

      // Delete notebook chats
      await tx.notebookChat.deleteMany({
        where: { notebookId: { in: notebookIds } },
      });

      // Delete notebook outputs
      await tx.notebookOutput.deleteMany({
        where: { notebookId: { in: notebookIds } },
      });

      // Delete notebook collaborators
      await tx.notebookCollaborator.deleteMany({
        where: { notebookId: { in: notebookIds } },
      });

      // Delete notebooks
      await tx.notebook.deleteMany({ where: { userId } });

      // 14. Delete podcast feeds and episodes
      const podcasts = await tx.podcastFeed.findMany({
        where: { userId },
        select: { id: true },
      });
      const podcastIds = podcasts.map((p) => p.id);
      await tx.podcastEpisode.deleteMany({
        where: { feedId: { in: podcastIds } },
      });
      await tx.podcastFeed.deleteMany({ where: { userId } });

      // 15. Delete feed items and related content
      const feedItems = await tx.feedItem.findMany({
        where: { userId },
        select: { id: true },
      });
      const feedItemIds = feedItems.map((f) => f.id);
      await tx.summary.deleteMany({
        where: { feedItemId: { in: feedItemIds } },
      });
      await tx.contentTable.deleteMany({
        where: { feedItemId: { in: feedItemIds } },
      });
      await tx.feedItem.deleteMany({ where: { userId } });

      // 16. Delete videos
      await tx.video.deleteMany({ where: { userId } });

      // 17. Delete sources
      await tx.source.deleteMany({ where: { userId } });

      // 18. Delete sessions and accounts
      await tx.session.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });

      // 19. Finally delete the user
      await tx.user.delete({ where: { id: userId } });
    });

    // Also delete from Supabase Auth if applicable
    if (user.email) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Find and delete the Supabase auth user
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const supabaseUser = authUsers?.users?.find(
          (u) => u.email === user.email
        );

        if (supabaseUser) {
          await supabase.auth.admin.deleteUser(supabaseUser.id);
        }
      } catch (supabaseError) {
        // Log but don't fail - the main deletion was successful
        console.error("Error deleting Supabase auth user:", supabaseError);
      }
    }

    console.log(`GDPR deletion completed for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Account and all associated data have been permanently deleted",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account. Please try again or contact support." },
      { status: 500 }
    );
  }
}
