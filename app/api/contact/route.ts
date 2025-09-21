import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name too long")
    .optional(),
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message too long"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = contactFormSchema.parse(body);

    // Get authenticated user if available
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Create contact submission
    const submission = await prisma.contactSubmission.create({
      data: {
        name: validatedData.name || null,
        email: validatedData.email,
        message: validatedData.message,
        userId: session?.user?.id || null,
        status: "unread",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Contact form submitted successfully",
      submissionId: submission.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.errors.reduce(
            (acc, err) => {
              acc[err.path[0]] = [err.message];
              return acc;
            },
            {} as Record<string, string[]>
          ),
        },
        { status: 400 }
      );
    }

    console.error("Contact form submission error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
