import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

const BUCKET_NAME = "uploads";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type (PDF, images, audio) - must match both MIME and extension
    const allowedTypesAndExtensions: Record<string, string[]> = {
      "application/pdf": ["pdf"],
      "image/jpeg": ["jpg", "jpeg"],
      "image/png": ["png"],
      "image/gif": ["gif"],
      "image/webp": ["webp"],
      "audio/mpeg": ["mp3", "mpeg"],
      "audio/wav": ["wav"],
      "audio/mp4": ["m4a", "mp4"],
    };

    const allowedMimeTypes = Object.keys(allowedTypesAndExtensions);
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not supported. Allowed: PDF, images, audio" },
        { status: 400 }
      );
    }

    // Validate that file extension matches MIME type (prevent polyglot attacks)
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const validExtensions = allowedTypesAndExtensions[file.type] || [];
    if (!validExtensions.includes(ext)) {
      return NextResponse.json(
        { error: `File extension must match content type. Expected: ${validExtensions.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 50MB" },
        { status: 400 }
      );
    }

    // Generate unique filename with folder structure
    // ext is already validated above, use it for the filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${session.user.id}/${Date.now()}-${sanitizedName}`;

    // Upload to Supabase Storage using admin client (service role)
    const supabase = await createAdminClient();

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase storage error:", error);

      // If bucket doesn't exist, try to create it (requires admin permissions)
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: "Storage bucket not configured. Please create an 'uploads' bucket in Supabase Storage." },
          { status: 500 }
        );
      }

      // Don't expose internal error details
      return NextResponse.json(
        { error: "Upload failed. Please try again later." },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return NextResponse.json({
      url: publicUrl,
      path: data.path,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    // Don't expose internal error details to prevent information disclosure
    return NextResponse.json(
      { error: "Failed to upload file. Please try again later." },
      { status: 500 }
    );
  }
}
