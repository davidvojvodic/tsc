import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const f = createUploadthing();

export const ourFileRouter = {
  materialUploader: f({
    pdf: { maxFileSize: "32MB" },
    text: { maxFileSize: "32MB" },
    image: { maxFileSize: "16MB" },
    video: { maxFileSize: "256MB" },
    audio: { maxFileSize: "32MB" },
    // Add Microsoft Office formats
    "application/msword": { maxFileSize: "32MB" }, // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "32MB",
    }, // .docx
    "application/vnd.ms-excel": { maxFileSize: "32MB" }, // .xls
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      maxFileSize: "32MB",
    }, // .xlsx
    "application/vnd.ms-powerpoint": { maxFileSize: "32MB" }, // .ppt
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      { maxFileSize: "32MB" }, // .pptx
  })
    .middleware(async () => {
      const headersObj = await headers();
  const session = await auth.api.getSession({
    headers: headersObj,
  });

      if (!session) throw new Error("Unauthorized");

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
