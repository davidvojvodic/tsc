import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// app/api/materials/[id]/download/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const material = await prisma.material.update({
      where: { id: params.id },
      data: {
        downloads: {
          increment: 1,
        },
      },
    });

    if (!material) {
      return new NextResponse("Material not found", { status: 404 });
    }

    // Redirect to the actual file URL
    return NextResponse.redirect(material.url);
  } catch (error) {
    console.error("[MATERIAL_DOWNLOAD]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
