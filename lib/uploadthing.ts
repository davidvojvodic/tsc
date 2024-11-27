// lib/uploadthing.tsx

import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

// Export useUploadThing and uploadFiles for manual handling
export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();
