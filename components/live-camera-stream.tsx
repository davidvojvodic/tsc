"use client";

import React, { useState, useEffect, useRef } from "react";
import { Camera, RefreshCw, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveCameraStreamProps {
  className?: string;
}

export function LiveCameraStream({ className }: LiveCameraStreamProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(2); // Default 2 FPS
  const imgRef = useRef<HTMLImageElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const errorCountRef = useRef(0);


  useEffect(() => {
    const updateImage = () => {
      if (!imgRef.current || !isPlaying) return;

      const newImg = new Image();
      
      newImg.onload = () => {
        if (imgRef.current && isPlaying) {
          imgRef.current.src = newImg.src;
          errorCountRef.current = 0;
          setError(null);
          setIsLoading(false);
        }
      };

      newImg.onerror = () => {
        errorCountRef.current++;
        console.error('Failed to load image, count:', errorCountRef.current);
        
        if (errorCountRef.current > 5) {
          setError('Unable to connect to camera');
          setIsPlaying(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      };

      const timestamp = new Date().getTime();
      newImg.src = `/api/camera/snapshot?t=${timestamp}`;
    };

    if (isPlaying) {
      // Initial load
      updateImage();
      
      // Set up interval
      const interval = 1000 / fps; // Convert FPS to milliseconds
      intervalRef.current = setInterval(updateImage, interval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [isPlaying, fps]);

  // Pause when tab is not visible
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

  const retry = () => {
    errorCountRef.current = 0;
    setError(null);
    setIsLoading(true);
    setIsPlaying(true);
  };

  if (error) {
    return (
      <div className={cn("relative aspect-video w-full overflow-hidden rounded-lg bg-gray-900", className)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">
              Camera Stream Unavailable
            </h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={retry}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
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

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        alt="Live Camera Feed"
        className="w-full h-full object-contain"
        style={{ display: isLoading ? 'none' : 'block' }}
      />

      {/* Controls */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-black/70 hover:bg-black/80 text-white p-2 rounded-md transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          
          <select
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
            className="bg-black/70 text-white text-xs px-2 py-1 rounded border border-gray-600"
          >
            <option value={1}>1 FPS</option>
            <option value={2}>2 FPS</option>
            <option value={5}>5 FPS</option>
            <option value={10}>10 FPS</option>
          </select>
        </div>

        <div className="bg-black/70 text-white text-xs px-3 py-1 rounded-md flex items-center gap-2">
          <Camera className="h-3 w-3" />
          <span>Live Camera ({fps} FPS)</span>
        </div>
      </div>
    </div>
  );
}