import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { searchPodcasts } from "@/lib/media/podcast";

// GET - Search for podcasts
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limitParam = parseInt(searchParams.get("limit") || "10", 10);
    const limit = isNaN(limitParam) ? 10 : Math.min(Math.max(1, limitParam), 25);

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const results = await searchPodcasts(query, Math.min(limit, 25));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching podcasts:", error);
    return NextResponse.json(
      { error: "Failed to search podcasts" },
      { status: 500 }
    );
  }
}
