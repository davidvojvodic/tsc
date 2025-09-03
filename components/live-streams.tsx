/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Camera, RefreshCw } from "lucide-react";

interface StreamProps {
  cameraUrl?: string;
  isLoading?: boolean;
  error?: string;
}

export default function LiveStreams({
  cameraUrl = "http://194.249.165.38:4560",
  isLoading = false,
  error,
}: StreamProps) {
  const CAMERA_HOST = "194.249.165.38:4560";
  const CAMERA_USERNAME = "tsc";
  const CAMERA_PASSWORD = "tscmb2025";
  const [isStreamLoading, setIsStreamLoading] = useState(true);
  const [streamError, setStreamError] = useState(false);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const handleStreamLoad = () => {
    setIsStreamLoading(false);
    setStreamError(false);
  };

  const handleStreamError = () => {
    setIsStreamLoading(false);
    setStreamError(true);
  };

  const retryStream = () => {
    setStreamError(false);
    setIsStreamLoading(true);
    // Force iframe reload by changing src temporarily
    const iframe = document.querySelector(
      "#camera-iframe"
    ) as HTMLIFrameElement;
    if (iframe) {
      const currentSrc = iframe.src;
      iframe.src = "";
      setTimeout(() => {
        iframe.src = currentSrc;
      }, 100);
    }
  };

  if (streamError) {
    return (
      <div className="relative aspect-video w-full overflow-hidden max-w-screen-xl mx-auto rounded-lg bg-muted mb-10">
        <div className="absolute inset-0 h-full w-full bg-gray-900 flex items-center justify-center">
          <div className="text-center p-8">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">
              Camera Stream Unavailable
            </h3>
            <p className="text-gray-400 mb-4">
              Unable to connect to the camera stream
            </p>
            <div className="space-y-2">
              <div className="space-x-2">
                <button
                  onClick={retryStream}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Live Stream
                </button>
                <button
                  onClick={() => {
                    window.open("/api/camera/pwa-stream", "_blank");
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  PWA Stream
                </button>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    window.open("/api/camera/interface", "_blank");
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Camera Interface
                </button>
                {/**<button
                  onClick={() => {
                    window.open(`${cameraUrl}`, "_blank");
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Direct Access
                </button>*/}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Camera: IPC-D6339T-A-IL at {cameraUrl}
            </p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="relative aspect-video w-full overflow-hidden max-w-screen-xl mx-auto rounded-lg bg-gray-900 mb-10">
      {(isLoading || isStreamLoading) && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Connecting to camera...</p>
          </div>
        </div>
      )}

      <div className="absolute inset-0 h-full w-full">
        {/* Use the working live stream iframe */}
        <iframe
          id="camera-iframe"
          src="/api/camera/live-stream"
          className="absolute inset-0 w-full h-full border-0"
          onLoad={handleStreamLoad}
          onError={handleStreamError}
          title="Live Camera Stream"
          sandbox="allow-scripts allow-same-origin"
        />

        {!isStreamLoading && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-3 py-1 rounded-md flex items-center gap-2">
            <Camera className="h-3 w-3" />
            <span>Live Camera Stream</span>
          </div>
        )}

        {!isStreamLoading && (
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={retryStream}
              className="bg-blue-500/80 hover:bg-blue-600/80 text-white text-xs px-3 py-1 rounded-md flex items-center gap-2"
              title="Refresh live stream"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
            {/*<button
                onClick={() => {
                  window.open(
                    `http://${CAMERA_USERNAME}:${CAMERA_PASSWORD}@${CAMERA_HOST}/`,
                    "_blank"
                  );
                }}
                className="bg-gray-600/80 hover:bg-gray-700/80 text-white text-xs px-3 py-1 rounded-md"
                title="Open camera interface directly"
              >
                Direct Access
              </button> */}
          </div>
        )}
      </div>
    </div>
  );
}
