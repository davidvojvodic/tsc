import { NextRequest, NextResponse } from "next/server";
import http from "http";
import crypto from "crypto";

const isDevelopment = process.env.NODE_ENV === 'development';
const CAMERA_HOST = process.env.CAMERA_HOST || (isDevelopment ? "194.249.165.38" : undefined);
const CAMERA_PORT = parseInt(process.env.CAMERA_PORT || (isDevelopment ? "4560" : "")) || 4560;
const CAMERA_USERNAME = process.env.CAMERA_USERNAME || (isDevelopment ? "tsc" : undefined);
const CAMERA_PASSWORD = process.env.CAMERA_PASSWORD || (isDevelopment ? "tscmb2025" : undefined);

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

// Snapshot endpoint - usually more reliable than streams
const SNAPSHOT_ENDPOINT = "/cgi-bin/snapshot.cgi?channel=1";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate camera configuration
    if (!CAMERA_HOST || !CAMERA_USERNAME || !CAMERA_PASSWORD) {
      console.error("Missing camera configuration:", {
        hasHost: !!CAMERA_HOST,
        hasUsername: !!CAMERA_USERNAME,
        hasPassword: !!CAMERA_PASSWORD,
        nodeEnv: process.env.NODE_ENV
      });
      
      const errorPixel = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
        "base64"
      );
      
      return new NextResponse(errorPixel, {
        status: 503,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Try to get a single snapshot directly first
    const result = await getAuthenticatedSnapshot();
    
    if (result.success && result.data) {
      return new NextResponse(result.data, {
        headers: {
          "Content-Type": result.contentType || "image/jpeg",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // If direct access fails, try fallback proxy through working domain
    console.log("Direct camera access failed, trying fallback proxy");
    const fallbackResult = await tryFallbackProxy(request);
    
    if (fallbackResult.success && fallbackResult.data) {
      return new NextResponse(fallbackResult.data, {
        headers: {
          "Content-Type": fallbackResult.contentType || "image/jpeg",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
    
    // Return error image if failed
    const errorPixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "base64"
    );
    
    return new NextResponse(errorPixel, {
      status: 503,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Snapshot error:", error);
    
    const errorPixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "base64"
    );
    
    return new NextResponse(errorPixel, {
      status: 503,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache",
      },
    });
  }
}

async function getAuthenticatedSnapshot(): Promise<{
  success: boolean;
  data?: Buffer;
  contentType?: string;
  error?: string;
}> {
  return new Promise((resolve) => {
    // Try with digest auth
    const challengeOptions = {
      hostname: CAMERA_HOST,
      port: CAMERA_PORT,
      path: SNAPSHOT_ENDPOINT,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "image/jpeg,image/*",
      },
    };

    const challengeReq = http.request(challengeOptions, (challengeRes) => {
      if (challengeRes.statusCode === 401 && challengeRes.headers["www-authenticate"]) {
        const authHeader = challengeRes.headers["www-authenticate"];
        const authParams = parseDigestHeader(authHeader);
        
        if (!authParams) {
          resolve({ success: false, error: "Invalid digest header" });
          return;
        }

        const digestAuth = generateDigestAuth(SNAPSHOT_ENDPOINT, authParams);
        
        // Make authenticated request
        const authOptions = {
          hostname: CAMERA_HOST,
          port: CAMERA_PORT,
          path: SNAPSHOT_ENDPOINT,
          method: "GET",
          headers: {
            Authorization: digestAuth,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "image/jpeg,image/*",
          },
        };

        const authReq = http.request(authOptions, (authRes) => {
          if (authRes.statusCode !== 200) {
            resolve({
              success: false,
              error: `Auth failed: ${authRes.statusCode}`,
            });
            return;
          }

          const chunks: Buffer[] = [];
          const contentType = authRes.headers["content-type"] || "image/jpeg";

          authRes.on("data", (chunk) => {
            chunks.push(chunk);
          });

          authRes.on("end", () => {
            const data = Buffer.concat(chunks);
            resolve({
              success: true,
              data,
              contentType,
            });
          });

          authRes.on("error", (error) => {
            resolve({ success: false, error: error.message });
          });
        });

        authReq.on("error", (error) => {
          resolve({ success: false, error: error.message });
        });

        authReq.end();
        
        // Consume challenge response
        challengeRes.on("data", () => {});
        challengeRes.on("end", () => {});
      } else {
        resolve({
          success: false,
          error: `No auth challenge: ${challengeRes.statusCode}`,
        });
      }
    });

    challengeReq.on("error", (error) => {
      resolve({ success: false, error: error.message });
    });

    challengeReq.end();
  });
}

function parseDigestHeader(header: string): Record<string, string> | null {
  try {
    const params: Record<string, string> = {};
    const digestStr = header.replace(/^Digest\s+/, "");
    const pairs = digestStr.split(",");

    for (const pair of pairs) {
      const [key, value] = pair.trim().split("=");
      if (key && value) {
        params[key.trim()] = value.replace(/"/g, "");
      }
    }

    return params;
  } catch {
    return null;
  }
}

function generateDigestAuth(
  uri: string,
  params: Record<string, string>
): string {
  const { realm, nonce, qop, opaque } = params;
  const cnonce = crypto.randomBytes(8).toString("hex");
  const nc = "00000001";

  const ha1 = crypto
    .createHash("md5")
    .update(`${CAMERA_USERNAME}:${realm}:${CAMERA_PASSWORD}`)
    .digest("hex");

  const ha2 = crypto.createHash("md5").update(`GET:${uri}`).digest("hex");

  let response;
  if (qop === "auth") {
    const responseStr = `${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`;
    response = crypto.createHash("md5").update(responseStr).digest("hex");
  } else {
    const responseStr = `${ha1}:${nonce}:${ha2}`;
    response = crypto.createHash("md5").update(responseStr).digest("hex");
  }

  let authHeader = `Digest username="${CAMERA_USERNAME}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}"`;

  if (qop) {
    authHeader += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
  }

  if (opaque) {
    authHeader += `, opaque="${opaque}"`;
  }

  return authHeader;
}

// Fallback proxy function to use working domain when direct access fails
async function tryFallbackProxy(request: NextRequest): Promise<{
  success: boolean;
  data?: Buffer;
  contentType?: string;
  error?: string;
}> {
  try {
    // Check if we're already on tsc-testing.vercel.app to prevent infinite recursion
    const currentHost = request.headers.get('host') || '';
    if (currentHost.includes('tsc-testing.vercel.app')) {
      console.log("Already on tsc-testing.vercel.app, skipping fallback proxy to prevent infinite recursion");
      return {
        success: false,
        error: "Cannot use fallback proxy on the proxy domain itself"
      };
    }
    
    console.log("Attempting fallback proxy through tsc-testing.vercel.app");
    
    // Use the working domain as a proxy
    const response = await fetch("https://tsc-testing.vercel.app/api/camera/snapshot", {
      headers: {
        "User-Agent": "Vercel-Fallback-Proxy",
      },
      // Add a timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Fallback proxy failed: ${response.status} ${response.statusText}`,
      };
    }

    const data = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/jpeg";
    
    console.log(`Fallback proxy success: received ${data.length} bytes`);
    
    return {
      success: true,
      data,
      contentType,
    };
  } catch (error) {
    console.error("Fallback proxy error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown fallback error",
    };
  }
}