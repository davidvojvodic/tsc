"use client";

import { cn } from "@/lib/utils";

interface WaterSeparatorProps {
  className?: string;
  variant?: "wave" | "gradient" | "droplets";
  height?: "sm" | "md" | "lg";
}

export function WaterSeparator({
  className,
  variant = "wave",
  height = "md"
}: WaterSeparatorProps) {
  const heightClasses = {
    sm: "h-16",
    md: "h-24",
    lg: "h-32"
  };

  if (variant === "wave") {
    return (
      <div className={cn("relative w-full overflow-hidden", heightClasses[height], className)}>
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-secondary/30 to-transparent dark:from-secondary/30 dark:via-secondary/20 dark:to-transparent" />

        {/* SVG Wave */}
        <svg
          className="absolute bottom-0 w-full h-full"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            className="fill-primary/20 dark:fill-primary/20"
          />
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            className="fill-primary/30 dark:fill-primary/30"
          />
          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            className="fill-primary/15 dark:fill-primary/15"
          />
        </svg>

        {/* Floating droplets */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
          <div className="absolute top-8 left-1/2 w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }} />
          <div className="absolute top-6 right-1/3 w-2.5 h-2.5 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      </div>
    );
  }

  if (variant === "gradient") {
    return (
      <div className={cn("relative w-full", heightClasses[height], className)}>
        {/* Main gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10" />

        {/* Overlay gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/5 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/5 via-transparent to-secondary/5" />

        {/* Animated flowing effect */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse" />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-l from-transparent via-primary/15 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>
    );
  }

  if (variant === "droplets") {
    return (
      <div className={cn("relative w-full", heightClasses[height], className)}>
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-transparent dark:from-secondary/20 dark:to-transparent" />

        {/* Droplet pattern */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Large droplets */}
          <div className="absolute top-4 left-[10%] w-4 h-4 bg-gradient-to-br from-primary/40 to-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '4s' }} />
          <div className="absolute top-8 left-[25%] w-3 h-3 bg-gradient-to-br from-primary/50 to-primary/70 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '3.5s' }} />
          <div className="absolute top-6 left-[40%] w-5 h-5 bg-gradient-to-br from-primary/30 to-primary/50 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '4.5s' }} />
          <div className="absolute top-10 left-[55%] w-2.5 h-2.5 bg-gradient-to-br from-primary/60 to-primary/80 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }} />
          <div className="absolute top-5 left-[70%] w-3.5 h-3.5 bg-gradient-to-br from-primary/40 to-primary/60 rounded-full animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '4s' }} />
          <div className="absolute top-9 left-[85%] w-2 h-2 bg-gradient-to-br from-primary/50 to-primary/70 rounded-full animate-bounce" style={{ animationDelay: '2.5s', animationDuration: '3.5s' }} />

          {/* Small droplets */}
          <div className="absolute top-3 left-[15%] w-1.5 h-1.5 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
          <div className="absolute top-7 left-[30%] w-1 h-1 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-4 left-[45%] w-1.5 h-1.5 bg-primary/35 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-11 left-[60%] w-1 h-1 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-2 left-[75%] w-1.5 h-1.5 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-8 left-[90%] w-1 h-1 bg-primary/35 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }} />
        </div>
      </div>
    );
  }

  return null;
}