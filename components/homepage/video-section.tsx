"use client";

import { useEffect, useRef } from "react";

interface VideoSectionProps {
  locale?: string;
}

export default function VideoSection({ locale = "en" }: VideoSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = 0.5;
    }
  }, []);

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <video
            ref={videoRef}
            className="absolute top-0 left-0 w-full h-full rounded-xl shadow-2xl"
            controls
            autoPlay={false}
            loop={false}
            playsInline
            style={{ objectFit: 'contain', backgroundColor: '#000' }}
          >
            <source src="/video.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  );
}