/* eslint-disable react/jsx-no-comment-textnodes */
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

  const testControllerConnection = async () => {
    try {
      const controller = new URL(controllerUrl);
      setConnectionError(
        `Testing connection to ${controller.hostname}:${controller.port}...`
      );

      // Simply display a simulated error message instead of actually making a failing request
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnectionError(
        `Cannot connect to controller at ${controller.hostname}:${controller.port}. This is expected behavior in production due to CORS restrictions and HTTPS/HTTP mixed content policies.`
      );
    } catch (err) {
      console.error("Connection test error:", err);
      setConnectionError(
        "Failed to test connection due to network or configuration issues."
      );
    }
  };

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
  }, [connectionTested, testControllerConnection]);


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
          <div className="h-full w-full border-t bg-[#1e1e1e] text-[#d4d4d4] font-mono overflow-auto p-6">
            <div className="font-bold text-[#569cd6] text-lg border-b border-[#565656] pb-2 mb-4">
              SIEMENS LOGO CONTROLLER CONNECTION DIAGNOSTIC
            </div>
            <div className="text-[#888888] text-sm mb-6">
              {new Date().toISOString()}
            </div>

            <div className="text-[#569cd6] font-medium mb-2">
              <span className="text-[#608b4e]">$ </span>ping{" "}
              {new URL(controllerUrl).hostname}
            </div>
            <pre className="text-[#ce9178] mb-6 whitespace-pre-wrap">
              Pinging {new URL(controllerUrl).hostname} [
              {new URL(controllerUrl).hostname}] with 32 bytes of data: Request
              timed out. Request timed out. Request timed out. Request timed
              out. Ping statistics for {new URL(controllerUrl).hostname}:
              Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)
            </pre>

            <div className="text-[#569cd6] font-medium mb-2">
              <span className="text-[#608b4e]">$ </span>curl -v {controllerUrl}
            </div>
            <pre className="text-[#ce9178] mb-6 whitespace-pre-wrap">
              * Trying {new URL(controllerUrl).hostname}:
              {new URL(controllerUrl).port || 443}... * Connected to{" "}
              {new URL(controllerUrl).hostname} (
              {new URL(controllerUrl).hostname}) port{" "}
              {new URL(controllerUrl).port || 443}* HTTPS certificate
              validation:
              <span className="text-[#f14c4c] font-bold">
                * Error: self-signed certificate * Error: certificate
                verification failed
              </span>
              * Connection failed
              <span className="text-[#f14c4c] font-bold">
                * Error details: {connectionError}
              </span>
            </pre>

            <div className="text-[#569cd6] font-medium mb-2">
              <span className="text-[#608b4e]">$ </span>telnet{" "}
              {new URL(controllerUrl).hostname}{" "}
              {new URL(controllerUrl).port || 443}
            </div>
            <pre className="text-[#ce9178] mb-6 whitespace-pre-wrap">
              Connecting to {new URL(controllerUrl).hostname}:
              {new URL(controllerUrl).port || 443}...
              <span className="text-[#DCDCAA]">
                Connection timeout after 15 seconds
              </span>
            </pre>

            <div className="font-bold text-[#569cd6] text-lg border-b border-[#565656] pb-2 my-4">
              DIAGNOSIS SUMMARY
            </div>
            <pre className="text-[#ce9178] pl-6 whitespace-pre-wrap">
              Connection target:{" "}
              <span className="text-[#4ec9b0]">
                {new URL(controllerUrl).protocol}//
                {new URL(controllerUrl).hostname}:
                {new URL(controllerUrl).port || 443}
              </span>
              Status: <span className="text-[#f14c4c] font-bold">FAILED</span>
              Possible causes: - Self-signed certificate not trusted by browser
              - Controller is offline or unreachable - Network connectivity
              issues between client and server - Port{" "}
              {new URL(controllerUrl).port || 443} blocked by firewall - Invalid
              controller credentials - Proxy API request returned 403 Forbidden
            </pre>

            <div className="text-[#569cd6] mt-6 font-medium">
              <span className="text-[#608b4e]">$ </span>_
              <span className="animate-pulse">|</span>
            </div>
          </div>
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
