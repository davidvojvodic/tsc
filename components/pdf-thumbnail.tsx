"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { FileText } from "lucide-react";

// Configure worker locally to avoid build/CDN issues.
// Note: You must copy the worker file from node_modules/pdfjs-dist/build/pdf.worker.min.mjs
// to public/pdf.worker.min.mjs in your specific Next.js setup, or use a CDN.
// For simplicity and reliability in this environment, we'll try CDN first.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfThumbnailProps {
  url: string;
}

export default function PdfThumbnail({ url }: PdfThumbnailProps) {
  const [numPages, setNumPages] = useState<number>();
  const [error, setError] = useState(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  function onDocumentLoadError() {
    setError(true);
  }

  if (error) {
    return (
        <div className="w-full h-48 bg-muted/10 flex items-center justify-center group-hover:bg-muted/20 transition-colors">
            <FileText className="h-20 w-20 text-muted-foreground/40 result-icon transition-colors" />
        </div>
    );
  }

  return (
    <div className="w-full h-48 bg-muted/30 flex items-center justify-center overflow-hidden relative">
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        className="flex items-center justify-center"
        loading={
            <div className="w-full h-48 bg-muted/10 flex items-center justify-center animate-pulse">
                <FileText className="h-10 w-10 text-muted-foreground/20" />
            </div>
        }
      >
        <Page 
            pageNumber={1} 
            width={300} // Set a fixed width to ensure it fits nicely
            className="w-full h-full object-contain"
            renderAnnotationLayer={false}
            renderTextLayer={false}
        />
      </Document>
    </div>
  );
}
