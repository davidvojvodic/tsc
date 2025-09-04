import { NextRequest, NextResponse } from "next/server";
import http from "http";
import crypto from "crypto";

const CAMERA_HOST = "194.249.165.38";
const CAMERA_PORT = 4560;
const CAMERA_USERNAME = "tsc";
const CAMERA_PASSWORD = "tscmb2025";

// Connection management
let lastRequestTime = 0;
let activeConnections = 0;
const MAX_CONNECTIONS = 2;
const MIN_REQUEST_INTERVAL = 500; // Minimum 500ms between requests

// Stream endpoints to try - keep original working order
const STREAM_ENDPOINTS = [
  "/cgi-bin/mjpg/video.cgi?channel=1&subtype=1", // This was working as endpoint 0
  "/cgi-bin/mjpg/video.cgi?channel=1&subtype=0",
  "/videostream.cgi",
  "/mjpg/video.mjpg",
];

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const endpointIndex = parseInt(searchParams.get("endpoint") || "0");
  const endpoint = STREAM_ENDPOINTS[endpointIndex] || STREAM_ENDPOINTS[0];

  // Rate limiting and connection management
  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    console.log(
      `Rate limited: too many requests (${now - lastRequestTime}ms ago)`
    );
    return createErrorResponse("Rate limited - too many requests");
  }

  if (activeConnections >= MAX_CONNECTIONS) {
    console.log(
      `Connection limit reached: ${activeConnections} active connections`
    );
    return createErrorResponse("Connection limit reached");
  }

  activeConnections++;
  lastRequestTime = now;
  console.log(
    `Proxying camera stream: ${endpoint} (connection ${activeConnections}/${MAX_CONNECTIONS})`
  );

  try {
    const result = await getAuthenticatedStream(endpoint);

    if (result.success) {
      const contentType = result.contentType || "image/jpeg";

      // Handle MJPEG stream - return continuous video stream
      if (result.stream && contentType.includes("multipart")) {
        console.log(`Streaming live MJPEG video for ${endpoint}`);

        // Create a ReadableStream from the camera response
        const stream = new ReadableStream({
          start(controller) {
            result.stream!.on("data", (chunk: Buffer) => {
              controller.enqueue(chunk);
            });

            result.stream!.on("end", () => {
              activeConnections--;
              controller.close();
            });

            result.stream!.on("error", (error: Error) => {
              activeConnections--;
              controller.error(error);
            });
          },
          cancel() {
            activeConnections--;
            result.stream!.destroy();
          },
        });

        return new NextResponse(stream, {
          headers: {
            "Content-Type": contentType, // Keep original multipart content-type
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Access-Control-Allow-Origin": "*",
            "Transfer-Encoding": "chunked",
          },
        });
      }

      // Handle single image data
      if (result.data) {
        // Check if we got HTML instead of image data
        const dataStr = result.data.toString(
          "utf8",
          0,
          Math.min(200, result.data.length)
        );
        if (
          dataStr.includes("<html") ||
          dataStr.includes("<!DOCTYPE") ||
          dataStr.includes("<title>")
        ) {
          console.log(`Received HTML instead of image data for ${endpoint}`);
          console.log(`HTML content: ${dataStr}`);
          return createErrorResponse(
            `HTML received instead of image for ${endpoint}`
          );
        }

        // Check if data is too small to be a valid image
        if (result.data.length < 100) {
          console.log(
            `Data too small (${result.data.length} bytes) for ${endpoint}`
          );
          return createErrorResponse(`Data too small for ${endpoint}`);
        }

        activeConnections--;
        return new NextResponse(result.data, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } else {
      // Try fallback proxy before giving up
      console.log("Direct stream access failed, trying fallback proxy");
      try {
        const fallbackResult = await tryStreamFallbackProxy(endpointIndex, request);
        
        if (fallbackResult.success && fallbackResult.data) {
          activeConnections--;
          return new NextResponse(fallbackResult.data, {
            headers: {
              "Content-Type": fallbackResult.contentType || "image/jpeg",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } catch (fallbackError) {
        console.error("Fallback proxy failed:", fallbackError);
      }

      // Return error response if both direct and fallback failed
      console.log(
        `Endpoint ${endpointIndex} failed: ${result.error || "Unknown error"}`
      );
      activeConnections--;
      return createErrorResponse(
        `Endpoint ${endpointIndex} failed: ${result.error || "Unknown error"}`
      );
    }
  } catch (error) {
    console.error("Stream proxy error:", error);
    activeConnections--;
    return createErrorResponse("Stream error");
  }

  // Default return for any unexpected cases
  return createErrorResponse("Unexpected error occurred");
}

async function getAuthenticatedStream(endpoint: string): Promise<{
  success: boolean;
  data?: Buffer | undefined;
  contentType?: string;
  error?: string;
  stream?: http.IncomingMessage;
}> {
  return new Promise((resolve) => {
    // First try with URL parameters
    const urlWithAuth = `${endpoint}${endpoint.includes("?") ? "&" : "?"}user=${CAMERA_USERNAME}&pwd=${CAMERA_PASSWORD}`;

    const options = {
      hostname: CAMERA_HOST,
      port: CAMERA_PORT,
      path: urlWithAuth,
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "*/*",
      },
    };

    const req = http.request(options, (res) => {
      console.log(`Stream response: ${res.statusCode} for ${endpoint}`);

      if (res.statusCode === 401) {
        console.log("Got 401, trying basic auth first...");
        // Consume the response body first
        res.on("data", () => {});
        res.on("end", () => {
          // Try basic auth first, then digest auth if that fails
          tryBasicAuth(endpoint, resolve);
        });
        return;
      }

      if (res.statusCode !== 200) {
        console.log(`Non-200 response: ${res.statusCode} ${res.statusMessage}`);
        resolve({
          success: false,
          error: `${res.statusCode} ${res.statusMessage}`,
        });
        return;
      }

      const chunks: Buffer[] = [];
      const contentType = res.headers["content-type"] || "image/jpeg";

      res.on("data", (chunk) => {
        chunks.push(chunk);
      });

      res.on("end", () => {
        const data = Buffer.concat(chunks);
        console.log(`Received ${data.length} bytes from ${endpoint}`);
        resolve({
          success: true,
          data,
          contentType,
        });
      });

      res.on("error", (error) => {
        resolve({ success: false, error: error.message });
      });
    });

    req.on("error", (error) => {
      resolve({ success: false, error: error.message });
    });

    req.end();
  });
}

function tryBasicAuth(
  endpoint: string,
  resolve: (result: {
    success: boolean;
    data?: Buffer;
    contentType?: string;
    error?: string;
  }) => void
) {
  console.log("Attempting basic auth for:", endpoint);

  const basicAuth = Buffer.from(
    `${CAMERA_USERNAME}:${CAMERA_PASSWORD}`
  ).toString("base64");

  const options = {
    hostname: CAMERA_HOST,
    port: CAMERA_PORT,
    path: endpoint,
    method: "GET",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "*/*",
    },
  };

  const req = http.request(options, (res) => {
    console.log(`Basic auth response: ${res.statusCode} for ${endpoint}`);

    if (res.statusCode === 401) {
      console.log("Basic auth failed, trying digest auth...");
      // Consume the response body first
      res.on("data", () => {});
      res.on("end", () => {
        tryDigestAuth(endpoint, resolve);
      });
      return;
    }

    if (res.statusCode !== 200) {
      resolve({
        success: false,
        error: `Basic auth failed: ${res.statusCode} ${res.statusMessage}`,
      });
      return;
    }

    const chunks: Buffer[] = [];
    const contentType = res.headers["content-type"] || "image/jpeg";

    res.on("data", (chunk) => {
      chunks.push(chunk);
    });

    res.on("end", () => {
      const data = Buffer.concat(chunks);
      console.log(
        `Basic auth success: received ${data.length} bytes, content-type: ${contentType}`
      );
      console.log(`First 100 bytes: ${data.toString("hex", 0, 100)}`);
      resolve({
        success: true,
        data,
        contentType,
      });
    });

    res.on("error", (error) => {
      resolve({ success: false, error: error.message });
    });
  });

  req.on("error", (error) => {
    resolve({ success: false, error: error.message });
  });

  req.end();
}

function tryDigestAuth(
  endpoint: string,
  resolve: (result: {
    success: boolean;
    data?: Buffer;
    contentType?: string;
    error?: string;
    stream?: http.IncomingMessage;
  }) => void
) {
  console.log("Attempting digest auth for:", endpoint);

  // First make a request to get the digest challenge
  const challengeOptions = {
    hostname: CAMERA_HOST,
    port: CAMERA_PORT,
    path: endpoint,
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "*/*",
    },
  };

  const challengeReq = http.request(challengeOptions, (challengeRes) => {
    console.log(`Digest challenge response: ${challengeRes.statusCode}`);

    if (
      challengeRes.statusCode === 401 &&
      challengeRes.headers["www-authenticate"]
    ) {
      const authHeader = challengeRes.headers["www-authenticate"];
      console.log("Got digest challenge:", authHeader);

      const authParams = parseDigestHeader(authHeader);
      if (!authParams) {
        resolve({ success: false, error: "Invalid digest header" });
        return;
      }

      const digestAuth = generateDigestAuth(endpoint, authParams);
      console.log("Generated digest auth");

      // Now make the authenticated request
      const authOptions = {
        hostname: CAMERA_HOST,
        port: CAMERA_PORT,
        path: endpoint,
        method: "GET",
        headers: {
          Authorization: digestAuth,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "*/*",
        },
      };

      const authReq = http.request(authOptions, (authRes) => {
        console.log(
          `Digest auth response: ${authRes.statusCode} for ${endpoint}`
        );
        console.log(
          `Response headers:`,
          JSON.stringify(authRes.headers, null, 2)
        );

        if (authRes.statusCode !== 200) {
          console.log(
            `Digest auth failed with status: ${authRes.statusCode} ${authRes.statusMessage}`
          );
          resolve({
            success: false,
            error: `Digest auth failed: ${authRes.statusCode} ${authRes.statusMessage}`,
          });
          return;
        }

        const contentType = authRes.headers["content-type"] || "image/jpeg";
        console.log(`Content-Type: ${contentType}`);

        // Handle MJPEG streams differently - they're continuous
        if (contentType.includes("multipart")) {
          console.log("Detected MJPEG stream, passing through directly");
          // For MJPEG streams, we need to pipe the response directly
          resolve({
            success: true,
            data: undefined, // We'll handle this in the main function
            contentType,
            stream: authRes, // Pass the response stream
          });
        } else {
          // For single images, collect all data
          const chunks: Buffer[] = [];

          authRes.on("data", (chunk) => {
            chunks.push(chunk);
          });

          authRes.on("end", () => {
            const data = Buffer.concat(chunks);
            console.log(
              `Digest auth success: received ${data.length} bytes, content-type: ${contentType}`
            );
            if (data.length > 0) {
              console.log(
                `First 100 bytes: ${data.toString("hex", 0, Math.min(100, data.length))}`
              );
              console.log(
                `Data starts with: ${data.toString("utf8", 0, Math.min(200, data.length))}`
              );
            } else {
              console.log("No data received!");
            }
            resolve({
              success: true,
              data,
              contentType,
            });
          });

          authRes.on("error", (error) => {
            resolve({ success: false, error: error.message });
          });
        }
      });

      authReq.on("error", (error) => {
        resolve({ success: false, error: error.message });
      });

      authReq.end();

      // Consume the challenge response
      challengeRes.on("data", () => {});
      challengeRes.on("end", () => {});
    } else {
      resolve({
        success: false,
        error: `No digest challenge: ${challengeRes.statusCode}`,
      });
    }
  });

  challengeReq.on("error", (error) => {
    resolve({ success: false, error: error.message });
  });

  challengeReq.end();
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createErrorResponse(message: string): NextResponse {
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

// Fallback proxy function for stream endpoints
async function tryStreamFallbackProxy(endpointIndex: number, request: NextRequest): Promise<{
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
    
    console.log(`Attempting stream fallback proxy through tsc-testing.vercel.app (endpoint ${endpointIndex})`);
    
    // Use the working domain as a proxy
    const response = await fetch(`https://tsc-testing.vercel.app/api/camera/stream-proxy?endpoint=${endpointIndex}`, {
      headers: {
        "User-Agent": "Vercel-Stream-Fallback-Proxy",
      },
      // Add a timeout to prevent hanging
      signal: AbortSignal.timeout(15000), // 15 second timeout for streams
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Stream fallback proxy failed: ${response.status} ${response.statusText}`,
      };
    }

    const data = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/jpeg";
    
    console.log(`Stream fallback proxy success: received ${data.length} bytes`);
    
    return {
      success: true,
      data,
      contentType,
    };
  } catch (error) {
    console.error("Stream fallback proxy error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown stream fallback error",
    };
  }
}
