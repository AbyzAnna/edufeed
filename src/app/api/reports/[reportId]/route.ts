import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { ReportStatus } from "@prisma/client";

// GET /api/reports/[reportId] - Get single report details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reportId } = await params;

    const report = await prisma.contentReport.findUnique({
      where: { id: reportId },
      include: {
        Reporter: {
          select: { id: true, name: true, email: true, image: true },
        },
        Reviewer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

// PATCH /api/reports/[reportId] - Update report status (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reportId } = await params;
    const body = await request.json();
    const { status, reviewNotes, action } = body;

    // Validate status
    if (status && !Object.values(ReportStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const report = await prisma.contentReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Update the report
    const updatedReport = await prisma.contentReport.update({
      where: { id: reportId },
      data: {
        status: status || report.status,
        reviewerId: session.user.id,
        reviewNotes: reviewNotes || report.reviewNotes,
        resolvedAt: status && status !== "PENDING" && status !== "UNDER_REVIEW"
          ? new Date()
          : report.resolvedAt,
        updatedAt: new Date(),
      },
      include: {
        Reporter: {
          select: { id: true, name: true, email: true },
        },
        Reviewer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Handle content action based on resolution
    if (action === "remove_content" && report.contentType && report.contentId) {
      await handleContentRemoval(report.contentType, report.contentId);
    }

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}

// Helper: Handle content removal based on type
async function handleContentRemoval(
  contentType: string,
  contentId: string
): Promise<void> {
  switch (contentType) {
    case "STUDY_ROOM":
      // End the study room (don't delete to preserve history)
      await prisma.studyRoom.update({
        where: { id: contentId },
        data: {
          isActive: false,
          endedAt: new Date(),
        },
      });
      break;

    case "NOTEBOOK":
      // Soft delete by marking as not shared (or implement soft delete field)
      // For now, we'll just log this as the notebook owner should be notified
      console.log(`Notebook ${contentId} marked for removal due to report`);
      break;

    case "COMMENT":
      await prisma.comment.delete({
        where: { id: contentId },
      });
      break;

    case "FEED_ITEM":
      await prisma.feedItem.delete({
        where: { id: contentId },
      });
      break;

    case "MESSAGE":
      await prisma.directMessage.delete({
        where: { id: contentId },
      });
      break;

    default:
      console.log(`Unknown content type for removal: ${contentType}`);
  }
}
