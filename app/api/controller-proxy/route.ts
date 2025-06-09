import { NextRequest, NextResponse } from "next/server";
import https from "https";

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

// This function uses node's built-in https module to create a request
// that bypasses certificate validation, since the fetch API doesn't
// reliably support this in Next.js environments
async function fetchWithSelfSignedCert(url: string): Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      method: "GET",
      headers: {
        "User-Agent": "Next.js Proxy",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      rejectUnauthorized: false, // Bypass certificate validation
    };

    console.log("Requesting with options:", {
      hostname: options.hostname,
      port: options.port,
      path: options.path,
    });

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        // Convert headers to a simple object
        const headers: Record<string, string> = {};
        Object.keys(res.headers).forEach((key) => {
          const value = res.headers[key];
          if (value) {
            headers[key] = Array.isArray(value) ? value.join(", ") : value;
          }
        });

        resolve({
          ok:
            res.statusCode !== undefined &&
            res.statusCode >= 200 &&
            res.statusCode < 300,
          status: res.statusCode || 500,
          statusText: res.statusMessage || "",
          headers,
          body: data,
        });
      });
    });

    req.on("error", (error) => {
      console.error("Request error:", error);
      reject(error);
    });

    req.end();
  });
}

export async function GET(req: NextRequest) {
  try {
    // Get the target URL from query parameters
    const url = req.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Security check - only allow requests to the specific controller
    if (!url.startsWith("https://194.249.165.38:55522/")) {
      return NextResponse.json(
        {
          error: "Invalid URL. Only the Siemens LOGO controller URL is allowed",
        },
        { status: 403 }
      );
    }

    // Get additional params for authentication
    const username = req.nextUrl.searchParams.get("username");
    const password = req.nextUrl.searchParams.get("password");
    const autoLogin = req.nextUrl.searchParams.get("autoLogin") === "true";

    // Use our custom fetch function that properly bypasses certificate validation
    console.log(`Proxying request to: ${url}`);

    // Try our custom HTTPS request function
    const response = await fetchWithSelfSignedCert(url).catch((error) => {
      console.error("Fetch error details:", error.message);
      throw new Error(`Fetch failed: ${error.message}`);
    });

    if (!response.ok) {
      console.error(
        `Proxy error: Response not OK - ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        {
          error: `Failed to fetch from controller: ${response.statusText}`,
          status: response.status,
        },
        { status: response.status }
      );
    }

    const contentType = response.headers["content-type"] || "";
    console.log(`Response content type: ${contentType}`);

    // Handle different content types
    if (contentType.includes("text/html")) {
      let html = response.body;

      // If autoLogin is true, modify the HTML to include auto-login script
      if (autoLogin && username && password) {
        // Insert auto-login script before </body>
        const autoLoginScript = `
          <script>
            window.addEventListener('DOMContentLoaded', function() {
              try {
                console.log("Auto-login script running");
                // Find login form and submit with credentials
                const loginForm = document.querySelector('form');
                if (loginForm) {
                  console.log("Login form found");
                  const usernameInput = document.querySelector('input[name="user"]');
                  const passwordInput = document.querySelector('input[name="password"]');
                  
                  if (usernameInput && passwordInput) {
                    console.log("Login inputs found, filling credentials");
                    usernameInput.value = "${username}";
                    passwordInput.value = "${password}";
                    
                    // Check if there's a "log on to customized site" option
                    const customSiteOption = Array.from(document.querySelectorAll('input[type="radio"]'))
                      .find(el => el.nextSibling?.textContent?.toLowerCase().includes('customized'));
                    
                    if (customSiteOption) {
                      console.log("Custom site option found, selecting it");
                      customSiteOption.checked = true;
                    }
                    
                    // Submit the form after a short delay
                    setTimeout(() => {
                      console.log("Submitting form");
                      loginForm.submit();
                    }, 500);
                  } else {
                    console.log("Username or password input not found");
                  }
                } else {
                  console.log("Login form not found");
                }
              } catch (e) {
                console.error("Auto-login failed:", e);
              }
            });
          </script>
        `;

        // Add the script before the closing body tag
        if (html.includes("</body>")) {
          html = html.replace("</body>", `${autoLoginScript}</body>`);
        } else {
          // If there's no body tag, append it to the end
          html = html + autoLoginScript;
        }
      }

      // Rewrite URLs to use our proxy
      const parsedUrl = new URL(url);
      const baseUrl = parsedUrl.origin;

      // Rewrite relative URLs to absolute URLs through our proxy
      html = html.replace(
        /(href|src)=["'](?!http|https|\/\/|#|data:)([^"']*)["']/g,
        (match, attr, path) => {
          const absolutePath = path.startsWith("/")
            ? `${baseUrl}${path}`
            : `${baseUrl}/${path}`;
          return `${attr}="${req.nextUrl.origin}/api/controller-proxy?url=${encodeURIComponent(absolutePath)}"`;
        }
      );

      // Also rewrite absolute URLs from the same origin
      html = html.replace(
        new RegExp(`(href|src)=["'](${baseUrl})([^"']*)["']`, "g"),
        (match, attr, origin, path) => {
          return `${attr}="${req.nextUrl.origin}/api/controller-proxy?url=${encodeURIComponent(origin + path)}"`;
        }
      );

      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // For non-HTML content, we'll need to handle this differently since we're using a custom fetch
    // Let's return the response body directly
    const data = Buffer.from(response.body);

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Proxy error:", error);
    // Return detailed error information
    return NextResponse.json(
      {
        error: "Failed to proxy request",
        details: error.message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
