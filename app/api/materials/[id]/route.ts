// app/api/materials/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { headers } from "next/headers";
import { checkAdminAccess } from "@/lib/utils";

const updateMaterialSchema = z.object({
  // English fields (required)
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),

  // Slovenian fields (optional)
  title_sl: z.string().optional().nullable(),
  description_sl: z.string().optional().nullable(),

  // Croatian fields (optional)
  title_hr: z.string().optional().nullable(),
  description_hr: z.string().optional().nullable(),

  // Common fields
  category: z.string().optional().nullable(),
  published: z.boolean(),
  language: z.enum(["en", "sl", "hr"]).default("en"),
  file: z
    .object({
      url: z.string().url(),
      key: z.string(),
      name: z.string(),
      size: z.number(),
    })
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headersObj = await headers();
    const session = await auth.api.getSession({
      headers: headersObj,
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isAdmin = await checkAdminAccess(session.user.id);
    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const validatedData = updateMaterialSchema.parse(body);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updateData: any = {
      title: validatedData.title,
      title_sl: validatedData.title_sl,
      title_hr: validatedData.title_hr,
      description: validatedData.description,
      description_sl: validatedData.description_sl,
      description_hr: validatedData.description_hr,
      category: validatedData.category,
      published: validatedData.published,
      language: validatedData.language,
    };

    if (validatedData.file) {
      const fileExtension = validatedData.file.name
        .split(".")
        .pop()
        ?.toLowerCase();
      let type = "OTHER";

      switch (fileExtension) {
        case "pdf":
          type = "PDF";
          break;
        case "doc":
        case "docx":
          type = "WORD";
          break;
        case "xls":
        case "xlsx":
          type = "EXCEL";
          break;
        case "ppt":
        case "pptx":
          type = "POWERPOINT";
          break;
        default:
          type = "OTHER";
      }

      updateData = {
        ...updateData,
        url: validatedData.file.url,
        filename: validatedData.file.name,
        fileKey: validatedData.file.key,
        size: validatedData.file.size,
        type,
      };
    }

    const material = await prisma.material.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(material);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }
    console.error("[MATERIAL_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Similar update for POST route
export async function POST(req: NextRequest) {
  try {
    const headersObj = await headers();
    const session = await auth.api.getSession({
      headers: headersObj,
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isAdmin = await checkAdminAccess(session.user.id);
    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const validatedData = updateMaterialSchema.parse(body);

    if (!validatedData.file) {
      return new NextResponse("File is required", { status: 400 });
    }

    // Determine material type from file name
    const fileExtension = validatedData.file.name
      .split(".")
      .pop()
      ?.toLowerCase();
    let type = "OTHER";

    switch (fileExtension) {
      case "pdf":
        type = "PDF";
        break;
      case "doc":
      case "docx":
        type = "WORD";
        break;
      case "xls":
      case "xlsx":
        type = "EXCEL";
        break;
      case "ppt":
      case "pptx":
        type = "POWERPOINT";
        break;
      default:
        type = "OTHER";
    }

    const material = await prisma.material.create({
      data: {
        title: validatedData.title,
        title_sl: validatedData.title_sl,
        title_hr: validatedData.title_hr,
        description: validatedData.description,
        description_sl: validatedData.description_sl,
        description_hr: validatedData.description_hr,
        category: validatedData.category,
        published: validatedData.published,
        language: validatedData.language,
        url: validatedData.file.url,
        filename: validatedData.file.name,
        fileKey: validatedData.file.key,
        size: validatedData.file.size,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: type as any,
      },
    });

    return NextResponse.json(material);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }
    console.error("[MATERIALS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE Route Handler
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headersObj = await headers();
    const session = await auth.api.getSession({
      headers: headersObj,
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isAdmin = await checkAdminAccess(session.user.id);
    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Find the material to be deleted
    const material = await prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      return new NextResponse("Material not found", { status: 404 });
    }

    // Delete the material
    await prisma.material.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[MATERIAL_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}