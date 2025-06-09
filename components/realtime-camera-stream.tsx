"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Camera, RefreshCw, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface RealtimeCameraStreamProps {
  className?: string;
}

export function RealtimeCameraStream({ className }: RealtimeCameraStreamProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(2);
  const [frameCount, setFrameCount] = useState(0);
  const [actualFps, setActualFps] = useState(0);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const errorCountRef = useRef(0);
  const fpsCalculationRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(Date.now());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Create optimized snapshot URL with cache busting
  const getImageUrl = useCallback(() => {
    const timestamp = Date.now();
    return `/api/camera/snapshot?t=${timestamp}&quality=high`;
  }, []);

  const updateImage = useCallback(async () => {
    if (!isPlaying) return;

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(getImageUrl(), {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      if (imgRef.current && isPlaying) {
        // Clean up previous object URL
        if (imgRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(imgRef.current.src);
        }

        imgRef.current.src = imageUrl;
        
        // Update statistics
        setFrameCount(prev => prev + 1);
        errorCountRef.current = 0;
        setError(null);
        setIsLoading(false);

        // Calculate actual FPS
        const now = Date.now();
        const timeDiff = now - lastFrameTimeRef.current;
        if (timeDiff > 0 && frameCount > 0) {
          const currentFps = 1000 / timeDiff;
          fpsCalculationRef.current.push(currentFps);
          if (fpsCalculationRef.current.length > 5) {
            fpsCalculationRef.current.shift();
          }
          const avgFps = fpsCalculationRef.current.reduce((a, b) => a + b, 0) / fpsCalculationRef.current.length;
          setActualFps(avgFps);
        }
        lastFrameTimeRef.current = now;
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }

      errorCountRef.current++;
      console.error('Failed to load image:', err);
      
      if (errorCountRef.current > 10) {
        setError('Unable to connect to camera after multiple attempts');
        setIsPlaying(false);
        return;
      }

      // Don't show error for first few failures, just retry
      if (errorCountRef.current > 3) {
        setError(`Connection issues (attempt ${errorCountRef.current}/10)`);
      }
    }
  }, [isPlaying, getImageUrl, frameCount]);

  const startStreaming = useCallback(() => {
    if (!isPlaying || intervalRef.current) return;

    // Initial load
    updateImage();
    
    // Set up interval for continuous streaming
    const interval = 1000 / fps;
    intervalRef.current = setInterval(updateImage, interval);
  }, [isPlaying, fps, updateImage]);

  const stopStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const changeFPS = useCallback((newFps: number) => {
    setFps(newFps);
  }, []);

  const retry = useCallback(() => {
    errorCountRef.current = 0;
    setError(null);
    setIsLoading(true);
    setFrameCount(0);
    fpsCalculationRef.current = [];
    
    if (!isPlaying) {
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Effect to start/stop streaming based on isPlaying and fps
  useEffect(() => {
    if (isPlaying) {
      startStreaming();
    } else {
      stopStreaming();
    }

    return () => {
      stopStreaming();
    };
  }, [isPlaying, fps, startStreaming, stopStreaming]);

  // Handle visibility change - pause when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPlaying(false);
      } else if (!error) {
        setIsPlaying(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
      // Clean up any blob URLs
      const imgElement = imgRef.current;
      if (imgElement?.src.startsWith('blob:')) {
        URL.revokeObjectURL(imgElement.src);
      }
    };
  }, [stopStreaming]);

  if (error && errorCountRef.current > 10) {
    return (
      <div className={cn("relative aspect-video w-full overflow-hidden rounded-lg bg-gray-900", className)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">
              Real-time Camera Stream Unavailable
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
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-lg bg-gray-900", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Connecting to camera...</p>
          </div>
        </div>
      )}

      <img
        ref={imgRef}
        alt="Real-time Camera Feed"
        className="w-full h-full object-contain"
        style={{ display: isLoading ? 'none' : 'block' }}
      />

      {/* Error indicator */}
      {error && errorCountRef.current <= 10 && (
        <div className="absolute top-2 left-2 bg-yellow-500/80 text-white text-xs px-2 py-1 rounded">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlayPause}
            className="bg-black/70 hover:bg-black/80 text-white p-2 rounded-md transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          
          <select
            value={fps}
            onChange={(e) => changeFPS(Number(e.target.value))}
            className="bg-black/70 text-white text-xs px-2 py-1 rounded border border-gray-600"
          >
            <option value={1}>1 FPS</option>
            <option value={2}>2 FPS</option>
            <option value={3}>3 FPS</option>
            <option value={5}>5 FPS</option>
            <option value={8}>8 FPS</option>
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
          <div className={cn(
            "w-2 h-2 rounded-full",
            isPlaying && !error ? "bg-green-500" : "bg-red-500"
          )} />
          <span>
            Real-time Polling | 
            {frameCount} frames | 
            {actualFps.toFixed(1)} FPS
          </span>
        </div>
      </div>
    </div>
  );
}