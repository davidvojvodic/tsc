"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Camera, RefreshCw, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface WebSocketCameraStreamProps {
  className?: string;
}

interface WebSocketMessage {
  type: "connected" | "frame" | "error";
  data?: string;
  message?: string;
  timestamp?: number;
}

export function WebSocketCameraStream({
  className,
}: WebSocketCameraStreamProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(2);
  const [frameCount, setFrameCount] = useState(0);
  const [actualFps, setActualFps] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fpsCalculationRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(Date.now());

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/camera/websocket`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setIsLoading(false);
        setError(null);

        // Send start streaming message
        if (isPlaying) {
          ws.send(JSON.stringify({ type: "start" }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case "connected":
              console.log("Camera stream connected:", message.message);
              break;

            case "frame":
              if (message.data && imgRef.current && isPlaying) {
                imgRef.current.src = message.data;
                setFrameCount((prev) => prev + 1);

                // Calculate FPS
                const now = Date.now();
                const timeDiff = now - lastFrameTimeRef.current;
                if (timeDiff > 0) {
                  const currentFps = 1000 / timeDiff;
                  fpsCalculationRef.current.push(currentFps);
                  if (fpsCalculationRef.current.length > 10) {
                    fpsCalculationRef.current.shift();
                  }
                  const avgFps =
                    fpsCalculationRef.current.reduce((a, b) => a + b, 0) /
                    fpsCalculationRef.current.length;
                  setActualFps(avgFps);
                }
                lastFrameTimeRef.current = now;

                setIsLoading(false);
                setError(null);
              }
              break;

            case "error":
              console.error("Camera error:", message.message);
              setError(message.message || "Camera error");
              break;
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("WebSocket connection error");
        setIsLoading(false);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        setIsLoading(false);

        // Auto-reconnect after 3 seconds if not manually closed
        if (!error) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("Attempting to reconnect...");
            connect();
          }, 3000);
        }
      };
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      setError("Failed to connect to camera");
      setIsLoading(false);
    }
  }, [isPlaying, error]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => {
      const newPlaying = !prev;

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: newPlaying ? "start" : "stop",
          })
        );
      }

      return newPlaying;
    });
  }, []);

  const changeFPS = useCallback((newFps: number) => {
    setFps(newFps);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "setFPS",
          fps: newFps,
        })
      );
    }
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setFrameCount(0);
    fpsCalculationRef.current = [];
    disconnect();
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPlaying(false);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "stop" }));
        }
      } else if (isConnected && !error) {
        setIsPlaying(true);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "start" }));
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isConnected, error]);

  if (error) {
    return (
      <div
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-lg bg-gray-900",
          className
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">
              WebSocket Camera Stream Unavailable
            </h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={retry}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-lg bg-gray-900",
        className
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-2" />
            <p className="text-gray-400 text-sm">
              {isConnected
                ? "Loading camera feed..."
                : "Connecting to WebSocket..."}
            </p>
          </div>
        </div>
      )}

      <img
        ref={imgRef}
        alt="WebSocket Camera Feed"
        className="w-full h-full object-contain"
        style={{ display: isLoading ? "none" : "block" }}
      />

      {/* Controls */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlayPause}
            className="bg-black/70 hover:bg-black/80 text-white p-2 rounded-md transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>

          <select
            value={fps}
            onChange={(e) => changeFPS(Number(e.target.value))}
            className="bg-black/70 text-white text-xs px-2 py-1 rounded border border-gray-600"
          >
            <option value={1}>1 FPS</option>
            <option value={2}>2 FPS</option>
            <option value={5}>5 FPS</option>
            <option value={10}>10 FPS</option>
          </select>

          <button
            onClick={retry}
            className="bg-black/70 hover:bg-black/80 text-white p-2 rounded-md transition-colors"
            title="Retry connection"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-black/70 text-white text-xs px-3 py-1 rounded-md flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isConnected && isPlaying ? "bg-green-500" : "bg-red-500"
            )}
          />
          <span>
            WebSocket {isConnected ? "Connected" : "Disconnected"} |{frameCount}{" "}
            frames |{actualFps.toFixed(1)} FPS
          </span>
        </div>
      </div>
    </div>
  );
}
