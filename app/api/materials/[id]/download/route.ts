import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// app/api/materials/[id]/download/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const material = await prisma.material.update({
      where: { id },
      data: {
        downloads: {
          increment: 1,
        },
      },
    });

    if (!material) {
      return new NextResponse("Material not found", { status: 404 });
    }

    // Fetch the file from the external URL
    const fileResponse = await fetch(material.url);
    
    if (!fileResponse.ok) {
      return new NextResponse("File not found", { status: 404 });
    }

    const contentType = fileResponse.headers.get("content-type") || "application/octet-stream";
    const contentLength = fileResponse.headers.get("content-length");
    
    // Create response headers for file download
    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${material.filename}"`,
    });

    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    // Stream the file content
    return new NextResponse(fileResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[MATERIAL_DOWNLOAD]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
