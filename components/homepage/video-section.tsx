"use client";

import { useEffect, useRef } from "react";
import { WaterSeparator } from "./water-separator";
import { SectionDivider } from "@/components/ui/section-divider";
import { Droplets, Waves } from "lucide-react";

interface VideoSectionProps {
  locale?: "en" | "sl" | "hr";
}

const translations = {
  title: {
    en: "System Overview",
    sl: "Pregled sistema",
    hr: "Pregled sustava"
  },
  description: {
    en: "Watch our advanced water management system in operation, showcasing real-time monitoring and automated irrigation controls.",
    sl: "Oglejte si naš napredni sistem upravljanja vode v delovanju, ki prikazuje spremljanje v realnem času, in avtomatizirano kontrolo namakanja.",
    hr: "Pogledajte naš napredni sustav upravljanja vodom u radu, koji prikazuje praćenje u realnom vremenu, i automatizirane kontrole navodnjavanja."
  }
};

export default function VideoSection({ locale = "en" }: VideoSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = 0.5;
    }
  }, []);

  return (
    <>
      {/* Top Separator */}
      <WaterSeparator variant="wave" height="md" />

      <section className="py-16 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Title and Description Section */}
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 !leading-[1.6] bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              {translations.title[locale]}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {translations.description[locale]}
            </p>
          </div>

          {/* Enhanced Video Container */}
          <div className="relative max-w-5xl mx-auto">
            {/* Glass-morphism container */}
            <div className="relative overflow-hidden rounded-3xl bg-card/40 dark:bg-card/40 backdrop-blur-sm border border-border shadow-2xl p-4">
              {/* Water-themed background decoration */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/20 to-primary/10 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary/10 to-primary/20 rounded-full blur-3xl transform -translate-x-24 translate-y-24" />

                {/* Floating water droplets */}
                <Droplets className="absolute top-8 left-8 w-6 h-6 text-primary/40 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
                <Waves className="absolute top-16 right-16 w-8 h-8 text-primary/30 animate-pulse" style={{ animationDelay: '1s' }} />
                <Droplets className="absolute bottom-16 right-24 w-5 h-5 text-primary/40 animate-bounce" style={{ animationDelay: '2s', animationDuration: '4s' }} />
              </div>

              {/* Video Container */}
              <div className="relative w-full aspect-video overflow-hidden rounded-2xl">
                <video
                  ref={videoRef}
                  className="w-full h-full rounded-2xl shadow-xl"
                  controls
                  autoPlay={false}
                  loop={false}
                  playsInline
                  style={{ objectFit: 'contain', backgroundColor: '#000' }}
                >
                  <source src="/video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Divider */}
      <SectionDivider />
    </>
  );
}