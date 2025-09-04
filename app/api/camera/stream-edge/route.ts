import { NextRequest } from "next/server";

// Use Edge Runtime for streaming support
export const runtime = "edge";

// Camera configuration from environment variables
// In development, use fallbacks if not configured (for testing)
const isDevelopment = process.env.NODE_ENV === 'development';

const CAMERA_HOST = process.env.CAMERA_HOST || (isDevelopment ? "194.249.165.38" : undefined);
const CAMERA_PORT = process.env.CAMERA_PORT || (isDevelopment ? "4560" : undefined);
const CAMERA_USERNAME = process.env.CAMERA_USERNAME || (isDevelopment ? "tsc" : undefined);
const CAMERA_PASSWORD = process.env.CAMERA_PASSWORD || (isDevelopment ? "tscmb2025" : undefined);
const STREAM_ENDPOINT = "/cgi-bin/mjpg/video.cgi?channel=1&subtype=1";

export async function GET(request: NextRequest) {
  // Check if camera is configured
  if (!CAMERA_HOST || !CAMERA_PORT || !CAMERA_USERNAME || !CAMERA_PASSWORD) {
    return new Response("Camera not configured", { status: 503 });
  }

  // Note: Edge runtime doesn't support Better Auth session checks directly
  // You should implement a JWT token check here for production
  // For now, this endpoint should be protected by middleware or disabled

  try {
    // Create basic auth header
    const auth = btoa(`${CAMERA_USERNAME}:${CAMERA_PASSWORD}`);

    // Direct fetch from camera with basic auth
    const response = await fetch(
      `http://${CAMERA_HOST}:${CAMERA_PORT}${STREAM_ENDPOINT}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "*/*",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signal: (request as any).signal, // Edge runtime supports streaming, but TS types may not include signal
      }
    );

    if (!response.ok) {
      throw new Error(`Camera responded with ${response.status}`);
    }

    // Get the content type from the camera
    const contentType =
      response.headers.get("content-type") ||
      "multipart/x-mixed-replace; boundary=myboundary";

    // Create a TransformStream to handle the streaming
    const { readable, writable } = new TransformStream();

    // Pipe the camera stream to our response
    response.body?.pipeTo(writable).catch(() => {
      // Ignore errors when client disconnects
    });

    // Return a streaming response
    return new Response(readable, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Edge stream error:", error);

    // Return error as JSON
    return new Response(
      JSON.stringify({ error: "Failed to connect to camera stream" }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
