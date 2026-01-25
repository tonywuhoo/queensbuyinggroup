import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthProfile } from "@/lib/api-utils";

// Create admin client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/files/labels/[...path] - Download file from storage
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Auth check
    const { profile, error } = await getAuthProfile();
    if (error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pathSegments = params.path;
    if (!pathSegments || pathSegments.length < 2) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    // First segment is bucket name, rest is file path
    const bucket = pathSegments[0];
    const filePath = pathSegments.slice(1).join('/');

    console.log(`Fetching file: bucket=${bucket}, path=${filePath}`);

    // Download file from Supabase
    const { data, error: downloadError } = await supabaseAdmin.storage
      .from(bucket)
      .download(filePath);

    if (downloadError || !data) {
      console.error("Download error:", downloadError);
      return NextResponse.json(
        { error: downloadError?.message || "File not found" },
        { status: 404 }
      );
    }

    // Get content type from file extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
    };
    const contentType = contentTypes[ext || ''] || 'application/octet-stream';

    // Get filename for download
    const fileName = filePath.split('/').pop() || 'download';

    // Return file with proper headers
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e: any) {
    console.error("File download error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
