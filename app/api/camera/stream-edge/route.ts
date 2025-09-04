import { NextRequest } from "next/server";
import { checkCameraSecurity } from "@/lib/camera-security";

// Use Edge Runtime for streaming support
export const runtime = "edge";

const isDevelopment = process.env.NODE_ENV === 'development';
const CAMERA_HOST = process.env.CAMERA_HOST || (isDevelopment ? "194.249.165.38" : undefined);
const CAMERA_PORT = parseInt(process.env.CAMERA_PORT || (isDevelopment ? "4560" : "")) || 4560;
const CAMERA_USERNAME = process.env.CAMERA_USERNAME || (isDevelopment ? "tsc" : undefined);
const CAMERA_PASSWORD = process.env.CAMERA_PASSWORD || (isDevelopment ? "tscmb2025" : undefined);
const STREAM_ENDPOINT = "/cgi-bin/mjpg/video.cgi?channel=1&subtype=1";

export async function GET(request: NextRequest) {
  try {
    // Security check (rate limiting + logging, auth controlled by CAMERA_REQUIRE_AUTH env var)
    const securityCheck = await checkCameraSecurity(request, "stream-edge");
    if (!securityCheck.allowed) {
      return new Response(
        JSON.stringify({ error: securityCheck.error || "Access denied" }),
        {
          status: securityCheck.status || 503,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate camera configuration
    if (!CAMERA_HOST || !CAMERA_USERNAME || !CAMERA_PASSWORD) {
      console.error("Missing camera configuration:", {
        hasHost: !!CAMERA_HOST,
        hasUsername: !!CAMERA_USERNAME,
        hasPassword: !!CAMERA_PASSWORD,
        nodeEnv: process.env.NODE_ENV
      });
      
      return new Response(
        JSON.stringify({ error: "Camera configuration missing" }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

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

    // Try fallback proxy before giving up
    try {
      // Check if we're already on tsc-testing.vercel.app to prevent infinite recursion
      const currentHost = request.headers.get('host') || '';
      if (currentHost.includes('tsc-testing.vercel.app')) {
        console.log("Already on tsc-testing.vercel.app, skipping fallback proxy to prevent infinite recursion");
        throw new Error("Cannot use fallback proxy on the proxy domain itself");
      }
      
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
