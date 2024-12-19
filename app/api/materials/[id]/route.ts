import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { headers } from "next/headers";
import { checkAdminAccess } from "@/lib/utils";

const updateMaterialSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  published: z.boolean(),
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
  { params }: { params: { id: string } }
) {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updateData: any = {
      title: validatedData.title,
      description: validatedData.description,
      category: validatedData.category,
      published: validatedData.published,
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
      where: { id: params.id },
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await prisma.material.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[MATERIAL_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
