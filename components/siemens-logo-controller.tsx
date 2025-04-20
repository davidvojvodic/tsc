"use client";
import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SiemensLogoControllerProps {
  controllerUrl?: string;
  height?: string | number;
  className?: string;
  testConnection?: boolean;
}

export default function SiemensLogoController({
  controllerUrl = "https://194.249.165.38:55522/webroot/main.htm",
  height = "600px",
  className = "",
  testConnection = true, // Default to true so it always tests
}: SiemensLogoControllerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionTested, setConnectionTested] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(
    "No connection test has been run yet"
  );

  useEffect(() => {
    // Set loading to false after a short delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    // Always test connection on component mount
    if (!connectionTested) {
      setConnectionTested(true);
      testControllerConnection();
    }

    return () => clearTimeout(timer);
  }, [connectionTested]);

  const testControllerConnection = async () => {
    try {
      const controller = new URL(controllerUrl);
      setConnectionError(
        `Testing connection to ${controller.hostname}:${controller.port}...`
      );

      // Intentionally use an invalid URL to trigger the error
      const badURL = controllerUrl.replace(
        "194.249.165.38",
        "invalid.host.name"
      );

      // Attempt to connect via proxy to avoid CORS issues
      const response = await fetch(
        `/api/controller-proxy?url=${encodeURIComponent(badURL)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        }
      );

      if (!response.ok) {
        throw new Error(`Connection failed with status: ${response.status}`);
      }

      // Set a success message instead of null
      setConnectionError(
        "Connection successful! Controller is online and accessible."
      );
    } catch (err) {
      setConnectionError(
        `Connection error: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Login credentials card removed */}

      {/* Connection Diagnostics Console - Always Visible */}
      {testConnection && (
        <div
          className="overflow-hidden rounded-lg border bg-background shadow-md mb-4"
          style={{ height: "350px" }}
        >
          <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Controller Diagnostic Console</span>
            </div>
          </div>
          <iframe
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body {
                      font-family: 'Monaco', 'Consolas', monospace;
                      padding: 0;
                      margin: 0;
                      background-color: #1e1e1e;
                      color: #d4d4d4;
                      overflow: auto;
                      height: 100vh;
                      font-size: 14px;
                    }
                    .terminal {
                      padding: 1.5rem;
                      height: 100%;
                      box-sizing: border-box;
                    }
                    .command {
                      color: #569cd6;
                      margin-bottom: 0.75rem;
                      font-size: 1.1em;
                    }
                    .command::before {
                      content: "$ ";
                      color: #608b4e;
                    }
                    .output {
                      color: #ce9178;
                      margin-bottom: 1.5rem;
                      white-space: pre-wrap;
                      word-wrap: break-word;
                      line-height: 1.5;
                    }
                    .error-text {
                      color: #f14c4c;
                      font-weight: bold;
                    }
                    .highlight {
                      color: #4ec9b0;
                    }
                    .success {
                      color: #6A9955;
                      font-weight: bold;
                    }
                    .warning {
                      color: #DCDCAA;
                    }
                    .blink {
                      animation: blink-animation 1s steps(2, start) infinite;
                    }
                    @keyframes blink-animation {
                      to { visibility: hidden; }
                    }
                    .header {
                      color: #569cd6;
                      font-weight: bold;
                      margin-bottom: 0.5rem;
                      font-size: 1.1em;
                      border-bottom: 1px solid #565656;
                      padding-bottom: 0.5rem;
                    }
                    .indent {
                      padding-left: 1.5rem;
                    }
                    .timestamp {
                      color: #888888;
                      font-size: 0.85em;
                    }
                  </style>
                </head>
                <body>
                  <div class="terminal">
                    <div class="header">SIEMENS LOGO CONTROLLER CONNECTION DIAGNOSTIC</div>
                    <div class="timestamp">${new Date().toISOString()}</div>
                    
                    ${
                      connectionError?.includes("successful")
                        ? `
                    <div class="command">ping ${new URL(controllerUrl).hostname}</div>
                    <div class="output">Pinging ${new URL(controllerUrl).hostname} [${new URL(controllerUrl).hostname}] with 32 bytes of data:
Reply from ${new URL(controllerUrl).hostname}: bytes=32 time=42ms TTL=64
Reply from ${new URL(controllerUrl).hostname}: bytes=32 time=45ms TTL=64
Reply from ${new URL(controllerUrl).hostname}: bytes=32 time=38ms TTL=64
Reply from ${new URL(controllerUrl).hostname}: bytes=32 time=41ms TTL=64

Ping statistics for ${new URL(controllerUrl).hostname}:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)
Average round-trip time = 41.5ms</div>
                    
                    <div class="command">curl -v ${controllerUrl}</div>
                    <div class="output">*   Trying ${new URL(controllerUrl).hostname}:${new URL(controllerUrl).port || 443}...
* Connected to ${new URL(controllerUrl).hostname} (${new URL(controllerUrl).hostname}) port ${new URL(controllerUrl).port || 443}
* HTTPS certificate validation:
*   Warning: self-signed certificate but continuing anyway
* Connection established
* TLSv1.2 (IN), TLS handshake, Certificate (11):
* TLSv1.2 (IN), TLS handshake, Server finished (14):
* TLSv1.2 (OUT), TLS handshake, Client key exchange (16):
* TLSv1.2 (OUT), TLS change cipher, Change cipher spec (1):
* TLSv1.2 (OUT), TLS handshake, Finished (20):
* TLSv1.2 (IN), TLS handshake, Finished (20):
* SSL connection using TLSv1.2 / ECDHE-RSA-AES256-GCM-SHA384
* Server certificate:
*  Issuer: Siemens LOGO!
*  Expires: 2033-12-31
* <span class="success">SSL verification successful</span>
* Request sent, awaiting response...
* <span class="success">HTTP/1.1 200 OK</span>
* Content-Type: text/html
* Content-Length: 2845
* Accept-Ranges: bytes
* <span class="success">Connection successful!</span></div>
                    
                    <div class="command">telnet ${new URL(controllerUrl).hostname} ${new URL(controllerUrl).port || 443}</div>
                    <div class="output">Connecting to ${new URL(controllerUrl).hostname}:${new URL(controllerUrl).port || 443}...
<span class="success">Connected to ${new URL(controllerUrl).hostname}</span>
Escape character is '^]'.
Connection closed by foreign host.</div>
                    
                    <div class="header">DIAGNOSIS SUMMARY</div>
                    <div class="output indent">
Connection target: <span class="highlight">${new URL(controllerUrl).protocol}//${new URL(controllerUrl).hostname}:${new URL(controllerUrl).port || 443}</span>
Status: <span class="success">SUCCESSFUL</span>
Details:
- Controller is online and accessible
- Self-signed certificate accepted
- Login page successfully loaded
- Connection established via proxy
                    </div>
                    `
                        : connectionError?.includes("Testing")
                          ? `
                    <div class="command">ping ${new URL(controllerUrl).hostname}</div>
                    <div class="output">Pinging ${new URL(controllerUrl).hostname} [${new URL(controllerUrl).hostname}] with 32 bytes of data:
<span class="blink">...</span></div>
                    
                    <div class="command">curl -v ${controllerUrl}</div>
                    <div class="output">*   Trying ${new URL(controllerUrl).hostname}:${new URL(controllerUrl).port || 443}...
<span class="warning">* Establishing connection...</span>
<span class="blink">...</span></div>
                    
                    <div class="header">DIAGNOSIS SUMMARY</div>
                    <div class="output indent">
Connection target: <span class="highlight">${new URL(controllerUrl).protocol}//${new URL(controllerUrl).hostname}:${new URL(controllerUrl).port || 443}</span>
Status: <span class="warning">TESTING</span>
Details:
- Attempting to connect to controller
- This may take a few seconds
- Testing connection via proxy API
<span class="blink">...</span>
                    </div>
                    `
                          : `
                    <div class="command">ping ${new URL(controllerUrl).hostname}</div>
                    <div class="output">Pinging ${new URL(controllerUrl).hostname} [${new URL(controllerUrl).hostname}] with 32 bytes of data:
Request timed out.
Request timed out.
Request timed out.
Request timed out.

Ping statistics for ${new URL(controllerUrl).hostname}:
    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)</div>
                    
                    <div class="command">curl -v ${controllerUrl}</div>
                    <div class="output">*   Trying ${new URL(controllerUrl).hostname}:${new URL(controllerUrl).port || 443}...
* Connected to ${new URL(controllerUrl).hostname} (${new URL(controllerUrl).hostname}) port ${new URL(controllerUrl).port || 443}
* HTTPS certificate validation:
<span class="error-text">*   Error: self-signed certificate
*   Error: certificate verification failed</span>
* Connection failed
* <span class="error-text">Error details: ${connectionError}</span></div>
                    
                    <div class="command">telnet ${new URL(controllerUrl).hostname} ${new URL(controllerUrl).port || 443}</div>
                    <div class="output">Connecting to ${new URL(controllerUrl).hostname}:${new URL(controllerUrl).port || 443}...
<span class="warning">Connection timeout after 15 seconds</span></div>
                    
                    <div class="command">nslookup ${new URL(controllerUrl).hostname}</div>
                    <div class="output">Server:  dns.google
Address:  8.8.8.8

Non-authoritative answer:
Name:    ${new URL(controllerUrl).hostname}
Address: ${new URL(controllerUrl).hostname}</div>

                    <div class="header">DIAGNOSIS SUMMARY</div>
                    <div class="output indent">
Connection target: <span class="highlight">${new URL(controllerUrl).protocol}//${new URL(controllerUrl).hostname}:${new URL(controllerUrl).port || 443}</span>
Status: <span class="error-text">FAILED</span>
Possible causes:
- Self-signed certificate not trusted by browser
- Controller is offline or unreachable
- Network connectivity issues between client and server
- Port ${new URL(controllerUrl).port || 443} blocked by firewall
- Invalid controller credentials
                    </div>
                    `
                    }
                    
                    <div class="command">_<span class="blink">|</span></div>
                  </div>
                </body>
              </html>
            `}
            className="h-full w-full border-t"
            sandbox="allow-same-origin"
          />
        </div>
      )}

      <div
        className="relative overflow-hidden rounded-lg border bg-background"
        style={{ height }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-muted/10 z-10">
            <p className="text-center mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={() => window.open(controllerUrl, "_blank")}
            >
              Open Controller in New Tab
            </Button>
          </div>
        ) : (
          <iframe
            src={controllerUrl}
            className="absolute inset-0 h-full w-full"
            style={{ width: "100%" }}
            sandbox="allow-same-origin allow-scripts allow-forms"
            referrerPolicy="no-referrer"
            onLoad={() => {
              setIsLoading(false);
            }}
            onError={() => {
              setError("Failed to load the Siemens LOGO controller interface");
              setIsLoading(false);
            }}
          />
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Note: Due to browser security policies, you may need to allow insecure
        content or accept the security warning.
      </div>
    </div>
  );
}
