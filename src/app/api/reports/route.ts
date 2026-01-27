import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { ReportContentType, ReportReason, Prisma } from "@prisma/client";
import { moderationService } from "@/lib/moderation";
import { ModerationContentType } from "@prisma/client";

// Map ReportContentType to ModerationContentType
const contentTypeMapping: Partial<Record<ReportContentType, ModerationContentType>> = {
  STUDY_ROOM: ModerationContentType.STUDY_ROOM_MESSAGE,
  NOTEBOOK: ModerationContentType.NOTEBOOK_CONTENT,
  COMMENT: ModerationContentType.COMMENT,
  MESSAGE: ModerationContentType.DIRECT_MESSAGE,
  FEED_ITEM: ModerationContentType.FEED_ITEM,
};

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contentType, contentId, reason, description } = body;

    // Validate required fields
    if (!contentType || !contentId || !reason) {
      return NextResponse.json(
        { error: "Content type, content ID, and reason are required" },
        { status: 400 }
      );
    }

    // Validate content type
    if (!Object.values(ReportContentType).includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Validate reason
    if (!Object.values(ReportReason).includes(reason)) {
      return NextResponse.json(
        { error: "Invalid report reason" },
        { status: 400 }
      );
    }

    // Prevent self-reporting
    const contentOwner = await getContentOwner(contentType, contentId);
    if (contentOwner === session.user.id) {
      return NextResponse.json(
        { error: "You cannot report your own content" },
        { status: 400 }
      );
    }

    // Check if user already reported this content
    const existingReport = await prisma.contentReport.findUnique({
      where: {
        reporterId_contentType_contentId: {
          reporterId: session.user.id,
          contentType,
          contentId,
        },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "You have already reported this content" },
        { status: 409 }
      );
    }

    // Get content for AI analysis
    const content = await getContentForModeration(contentType, contentId);
    // Store AI analysis result for response
    let aiAnalysisResult: {
      flagged: boolean;
      violations: unknown[];
      confidenceScore: number;
      status: string;
    } | null = null;

    if (content) {
      try {
        // Use existing moderation service to analyze the content
        const moderationType = contentTypeMapping[contentType as ReportContentType];
        if (moderationType) {
          const result = await moderationService.moderate({
            content,
            contentType: moderationType,
            userId: contentOwner || "unknown",
            contentId,
          });

          aiAnalysisResult = {
            flagged: !result.approved,
            // Convert violations to plain objects for JSON serialization
            violations: result.violations.map(v => ({
              category: v.category,
              confidence: v.confidence,
              details: v.details,
            })),
            confidenceScore: result.confidenceScore,
            status: result.status,
          };
        }
      } catch (error) {
        console.error("AI analysis failed:", error);
        // Continue without AI analysis
      }
    }

    // Create the report
    const report = await prisma.contentReport.create({
      data: {
        id: crypto.randomUUID(),
        contentType,
        contentId,
        reporterId: session.user.id,
        reason,
        description: description || null,
        // Only include aiAnalysis if it has a value (Prisma JSON type doesn't accept null directly)
        ...(aiAnalysisResult && { aiAnalysis: aiAnalysisResult as Prisma.InputJsonValue }),
        updatedAt: new Date(),
      },
      include: {
        Reporter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Report submitted successfully",
        reportId: report.id,
        aiAnalysis: aiAnalysisResult ? {
          flagged: aiAnalysisResult.flagged,
          violationCount: aiAnalysisResult.violations?.length || 0,
        } : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}

// GET /api/reports - List reports (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin role check
    // For now, allow any authenticated user to view reports for testing

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const contentType = searchParams.get("contentType");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const cursor = searchParams.get("cursor");

    const reports = await prisma.contentReport.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(contentType && { contentType: contentType as ReportContentType }),
      },
      include: {
        Reporter: {
          select: { id: true, name: true, email: true, image: true },
        },
        Reviewer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = reports.length > limit;
    const items = hasMore ? reports.slice(0, -1) : reports;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    // Enrich reports with content details
    const enrichedReports = await Promise.all(
      items.map(async (report) => {
        const contentDetails = await getContentDetails(report.contentType, report.contentId);
        return {
          ...report,
          contentDetails,
        };
      })
    );

    return NextResponse.json({
      reports: enrichedReports,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

// Helper: Get content owner ID
async function getContentOwner(
  contentType: ReportContentType,
  contentId: string
): Promise<string | null> {
  switch (contentType) {
    case "STUDY_ROOM":
      const room = await prisma.studyRoom.findUnique({
        where: { id: contentId },
        select: { hostId: true },
      });
      return room?.hostId || null;

    case "NOTEBOOK":
      const notebook = await prisma.notebook.findUnique({
        where: { id: contentId },
        select: { userId: true },
      });
      return notebook?.userId || null;

    case "COMMENT":
      const comment = await prisma.comment.findUnique({
        where: { id: contentId },
        select: { userId: true },
      });
      return comment?.userId || null;

    case "USER":
      return contentId;

    case "FEED_ITEM":
      const feedItem = await prisma.feedItem.findUnique({
        where: { id: contentId },
        select: { userId: true },
      });
      return feedItem?.userId || null;

    case "MESSAGE":
      const message = await prisma.directMessage.findUnique({
        where: { id: contentId },
        select: { senderId: true },
      });
      return message?.senderId || null;

    default:
      return null;
  }
}

// Helper: Get content for AI moderation
async function getContentForModeration(
  contentType: ReportContentType,
  contentId: string
): Promise<string | null> {
  switch (contentType) {
    case "STUDY_ROOM":
      const room = await prisma.studyRoom.findUnique({
        where: { id: contentId },
        select: { title: true, description: true },
      });
      return room ? `${room.title} ${room.description || ""}`.trim() : null;

    case "NOTEBOOK":
      const notebook = await prisma.notebook.findUnique({
        where: { id: contentId },
        select: { title: true, description: true },
      });
      return notebook
        ? `${notebook.title} ${notebook.description || ""}`.trim()
        : null;

    case "COMMENT":
      const comment = await prisma.comment.findUnique({
        where: { id: contentId },
        select: { content: true },
      });
      return comment?.content || null;

    case "FEED_ITEM":
      const feedItem = await prisma.feedItem.findUnique({
        where: { id: contentId },
        select: { title: true, description: true },
      });
      return feedItem
        ? `${feedItem.title} ${feedItem.description || ""}`.trim()
        : null;

    case "MESSAGE":
      const message = await prisma.directMessage.findUnique({
        where: { id: contentId },
        select: { content: true },
      });
      return message?.content || null;

    default:
      return null;
  }
}

// Helper: Get content details for display
async function getContentDetails(
  contentType: ReportContentType,
  contentId: string
): Promise<any> {
  switch (contentType) {
    case "STUDY_ROOM":
      return prisma.studyRoom.findUnique({
        where: { id: contentId },
        select: {
          id: true,
          title: true,
          description: true,
          isActive: true,
          User: { select: { id: true, name: true, image: true } },
        },
      });

    case "NOTEBOOK":
      return prisma.notebook.findUnique({
        where: { id: contentId },
        select: {
          id: true,
          title: true,
          description: true,
          emoji: true,
          User: { select: { id: true, name: true, image: true } },
        },
      });

    case "COMMENT":
      return prisma.comment.findUnique({
        where: { id: contentId },
        select: {
          id: true,
          content: true,
          User: { select: { id: true, name: true, image: true } },
        },
      });

    case "USER":
      return prisma.user.findUnique({
        where: { id: contentId },
        select: { id: true, name: true, image: true, bio: true },
      });

    case "FEED_ITEM":
      return prisma.feedItem.findUnique({
        where: { id: contentId },
        select: {
          id: true,
          title: true,
          description: true,
          User: { select: { id: true, name: true, image: true } },
        },
      });

    default:
      return null;
  }
}
