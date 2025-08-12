import { NextResponse } from "next/server";
import http from "http";
import crypto from "crypto";

const CAMERA_HOST = "194.249.165.38";
const CAMERA_PORT = 4560;
const CAMERA_USERNAME = "tsc";
const CAMERA_PASSWORD = "tscmb2025";

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

// Snapshot endpoint - usually more reliable than streams
const SNAPSHOT_ENDPOINT = "/cgi-bin/snapshot.cgi?channel=1";

export async function GET(): Promise<NextResponse> {
  try {
    // Try to get a single snapshot
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