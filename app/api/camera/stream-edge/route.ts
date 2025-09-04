import { NextRequest } from "next/server";

// Use Edge Runtime for streaming support
export const runtime = "edge";

const CAMERA_HOST = "194.249.165.38";
const CAMERA_PORT = 4560;
const CAMERA_USERNAME = "tsc";
const CAMERA_PASSWORD = "tscmb2025";
const STREAM_ENDPOINT = "/cgi-bin/mjpg/video.cgi?channel=1&subtype=1";

export async function GET(request: NextRequest) {
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

    // Check current domain to prevent infinite recursion
    const host = request.headers.get('host') || '';
    const isTestingDomain = host.includes('tsc-testing.vercel.app');

    // Try fallback proxy before giving up (but not if we're already on testing domain)
    if (!isTestingDomain) {
      try {
        console.log("Direct edge stream access failed, trying fallback proxy");
        const fallbackResponse = await fetch("https://tsc-testing.vercel.app/api/camera/stream-edge", {
          headers: {
            "User-Agent": "Vercel-Edge-Fallback-Proxy",
          },
          signal: AbortSignal.timeout(15000), // 15 second timeout
        });

        if (fallbackResponse.ok && fallbackResponse.body) {
          const contentType = fallbackResponse.headers.get("content-type") || "multipart/x-mixed-replace";
          
          console.log("Edge stream fallback proxy success");
          
          return new Response(fallbackResponse.body, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Access-Control-Allow-Origin": "*",
              "Transfer-Encoding": "chunked",
            },
          });
        }
      } catch (fallbackError) {
        console.error("Edge stream fallback proxy failed:", fallbackError);
      }
    } else {
      console.log("Skipping fallback proxy - already on testing domain to prevent infinite recursion");
    }

    // Return error as JSON if both direct and fallback failed
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
