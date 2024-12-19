// app/api/materials/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { headers } from "next/headers";

const materialSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  published: z.boolean().default(true),
  file: z.object({
    url: z.string().url(),
    key: z.string(),
    name: z.string(),
    size: z.number(),
  }),
});

async function checkAdminAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role === "ADMIN";
}

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
    const validatedData = materialSchema.parse(body);

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
        description: validatedData.description,
        category: validatedData.category,
        published: validatedData.published,
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
