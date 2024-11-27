// app/api/uploadthing/core.ts

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const auth = (req: Request) => ({ id: "fakeId" });

export const ourFileRouter = {
  imageUploader: f({
    image: { maxFileSize: "16MB" }, // Allowed file types and their max sizes
    video: { maxFileSize: "256MB" },
  })
    .middleware(async ({ req }) => {
      // Authentication logic
      const user = await auth(req);

      // If authentication fails, throw an error to prevent upload
      if (!user) throw new UploadThingError("Unauthorized");

      // Return metadata accessible in onUploadComplete
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Server-side logic after upload completes
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      // Return data to be accessible on the client-side
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
