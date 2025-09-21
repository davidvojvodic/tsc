"use client";

import { useState, useEffect } from "react";
import { Camera, Wifi, WifiOff, Activity, Eye, Signal } from "lucide-react";
import { SectionHeader } from "./section-header";
import { WaterSeparator } from "./water-separator";
import { LiveCameraStream } from "../live-camera-stream";
import { cn } from "@/lib/utils";

interface LiveStreamSectionProps {
  locale?: "en" | "sl" | "hr";
}

const translations = {
  title: {
    en: "Live System Monitoring",
    sl: "Spremljanje Sistema v Živo",
    hr: "Praćenje Sistema Uživo"
  },
  subtitle: {
    en: "Real-Time Camera Feed",
    sl: "Kamera v Realnem Času",
    hr: "Kamera u Realnom Vremenu"
  },
  description: {
    en: "Monitor our WaterWise irrigation system 24/7 through our live camera feed. Watch real-time operations, system status, and see our smart water management technology in action around the clock.",
    sl: "Spremljajte naš sistem namakanja WaterWise 24/7 preko naše kamere v živo. Oglejte si operacije v realnem času, stanje sistema in vidite našo pametno tehnologijo upravljanja vode v akciji ves dan.",
    hr: "Pratite naš WaterWise sustav navodnjavanja 24/7 putem naše kamere uživo. Gledajte operacije u realnom vremenu, stanje sustava i vidite našu pametnu tehnologiju upravljanja vodom u akciji cijeli dan."
  },
  statusIndicator: {
    live: {
      en: "Live",
      sl: "V Živo",
      hr: "Uživo"
    },
    offline: {
      en: "Offline",
      sl: "Brez Povezave",
      hr: "Offline"
    }
  },
  stats: {
    viewers: {
      en: "Current Viewers",
      sl: "Trenutni Gledalci",
      hr: "Trenutni Gledatelji"
    },
    uptime: {
      en: "System Uptime",
      sl: "Čas Delovanja",
      hr: "Vrijeme Rada"
    },
    quality: {
      en: "Stream Quality",
      sl: "Kakovost Prenosa",
      hr: "Kvaliteta Prijenosa"
    },
    fps: {
      en: "FPS",
      sl: "FPS",
      hr: "FPS"
    }
  },
  networkStatus: {
    excellent: {
      en: "Excellent",
      sl: "Odlična",
      hr: "Izvrsna"
    },
    good: {
      en: "Good",
      sl: "Dobra",
      hr: "Dobra"
    },
    poor: {
      en: "Poor",
      sl: "Slaba",
      hr: "Loša"
    }
  }
};

export function LiveStreamSection({ locale = "en" }: LiveStreamSectionProps) {
  const [isLive, setIsLive] = useState(true);
  const [viewers, setViewers] = useState(0);
  const [uptime, setUptime] = useState("98.7%");
  const [streamQuality, setStreamQuality] = useState<"excellent" | "good" | "poor">("excellent");
  const [currentFps, setCurrentFps] = useState(2);

  // Simulate viewer count and system stats
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate viewer count fluctuation
      setViewers(Math.floor(Math.random() * 15) + 5);

      // Simulate network quality changes
      const qualityRandom = Math.random();
      if (qualityRandom > 0.8) {
        setStreamQuality("poor");
      } else if (qualityRandom > 0.3) {
        setStreamQuality("good");
      } else {
        setStreamQuality("excellent");
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const getQualityColor = (quality: "excellent" | "good" | "poor") => {
    switch (quality) {
      case "excellent":
        return "text-green-500";
      case "good":
        return "text-yellow-500";
      case "poor":
        return "text-red-500";
    }
  };

  const getSignalIcon = (quality: "excellent" | "good" | "poor") => {
    const baseClass = "w-4 h-4";
    switch (quality) {
      case "excellent":
        return <Signal className={cn(baseClass, "text-green-500")} />;
      case "good":
        return <Signal className={cn(baseClass, "text-yellow-500")} />;
      case "poor":
        return <Signal className={cn(baseClass, "text-red-500")} />;
    }
  };

  return (
    <>
      {/* Top Separator */}
      <WaterSeparator variant="droplets" height="lg" />

      <section className="py-16 px-4 bg-gradient-to-b from-cyan-50/20 via-gray-50 to-blue-50/30 dark:from-cyan-950/10 dark:via-gray-900 dark:to-blue-950/20">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Section Header */}
          <SectionHeader
            icon={<Camera className="w-8 h-8 text-white" />}
            title={translations.title}
            subtitle={translations.subtitle}
            description={translations.description}
            locale={locale}
            statusIndicator={{
              type: isLive ? "live" : "offline",
              text: isLive ? translations.statusIndicator.live : translations.statusIndicator.offline
            }}
          />

          {/* Live Stream Container */}
          <div className="relative max-w-5xl mx-auto">
            {/* Glass-morphism container */}
            <div className="relative overflow-hidden rounded-3xl bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm border border-blue-200/30 dark:border-blue-800/30 shadow-2xl p-4">

              {/* Stream Stats Header */}
              <div className="flex flex-wrap items-center justify-between mb-6 p-4 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-blue-200/20 dark:border-blue-800/20">
                <div className="flex flex-wrap items-center gap-6">
                  {/* Live Status */}
                  <div className="flex items-center gap-2">
                    {isLive ? (
                      <div className="relative">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                      </div>
                    ) : (
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isLive ? translations.statusIndicator.live[locale] : translations.statusIndicator.offline[locale]}
                    </span>
                  </div>

                  {/* Viewers */}
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {translations.stats.viewers[locale]}:
                    </span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {viewers}
                    </span>
                  </div>

                  {/* FPS */}
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {translations.stats.fps[locale]}:
                    </span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {currentFps}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  {/* Network Quality */}
                  <div className="flex items-center gap-2">
                    {getSignalIcon(streamQuality)}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {translations.stats.quality[locale]}:
                    </span>
                    <span className={cn("text-sm font-semibold", getQualityColor(streamQuality))}>
                      {translations.networkStatus[streamQuality][locale]}
                    </span>
                  </div>

                  {/* Uptime */}
                  <div className="flex items-center gap-2">
                    {isLive ? (
                      <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {translations.stats.uptime[locale]}:
                    </span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {uptime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Camera Stream */}
              <div className="relative overflow-hidden rounded-2xl">
                <LiveCameraStream
                  className="w-full"
                />

                {/* Overlay Effects */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner indicators */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-white text-xs font-medium">REC</span>
                  </div>

                  {/* Timestamp */}
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <span className="text-white text-xs font-mono">
                      {new Date().toLocaleTimeString(locale === "en" ? "en-US" : locale === "sl" ? "sl-SI" : "hr-HR")}
                    </span>
                  </div>

                  {/* Network quality indicator */}
                  <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                    {getSignalIcon(streamQuality)}
                    <span className={cn("text-xs font-medium", getQualityColor(streamQuality))}>
                      {translations.networkStatus[streamQuality][locale]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stream Information Footer */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-2xl border border-blue-200/20 dark:border-blue-800/20">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {locale === "en" && "Experience our WaterWise system in real-time. This live feed showcases our automated irrigation technology working 24/7."}
                    {locale === "sl" && "Doživite naš sistem WaterWise v realnem času. Ta prenos v živo prikazuje našo avtomatizirano tehnologijo namakanja, ki deluje 24/7."}
                    {locale === "hr" && "Doživite naš WaterWise sustav u realnom vremenu. Ovaj prijenos uživo prikazuje našu automatiziranu tehnologiju navodnjavanja koja radi 24/7."}
                  </p>
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                    <span>📍 {locale === "en" ? "Location: TŠC Facility" : locale === "sl" ? "Lokacija: TŠC Objekt" : "Lokacija: TŠC Objekt"}</span>
                    <span>•</span>
                    <span>📡 {locale === "en" ? "Protocol: WebSocket" : locale === "sl" ? "Protokol: WebSocket" : "Protokol: WebSocket"}</span>
                    <span>•</span>
                    <span>🔒 {locale === "en" ? "Secure Connection" : locale === "sl" ? "Varna Povezava" : "Sigurna Veza"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Separator */}
      <WaterSeparator variant="wave" height="md" />
    </>
  );
}