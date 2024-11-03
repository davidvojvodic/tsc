import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "../container";

const stats = [
  { number: "250+", label: "Lorem ipsum" },
  { number: "1000+", label: "Lorem ipsum" },
  { number: "15+", label: "Lorem ipsum" },
  { number: "2400+", label: "Lorem ipsum" },
];

export function HeroSection() {
  return (
    <Container>
      <div className="relative">
        <div className="grid gap-12 py-16 md:grid-cols-2 md:items-center md:py-24">
          {/* Left column - Text content */}
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Welcome to
              <br />
              Lorem ipsum
            </h1>
            <p className="text-lg text-muted-foreground">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>
            <div>
              <Button size="lg" className="h-12 px-8">
                Lorem Ipsum
              </Button>
            </div>
          </div>

          {/* Right column - Hero Image */}
          <div className="relative aspect-square max-h-[600px] w-full">
            <Image
              src="/hero-upscaled.png" // Make sure to save the image you provided with this name
              alt="Student Profiles"
              fill
              className="object-contain"
              priority
            />

            {/* Community badge */}
            <div className="absolute bottom-12 left-4 z-30 rounded-lg bg-white p-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-6 w-6 rounded-full border-2 border-white bg-gray-200"
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <p className="font-semibold">Join our community of</p>
                  <p>100+ Students</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats section */}
        <div className="grid grid-cols-2 gap-8 border-y py-12 md:grid-cols-4 md:gap-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold md:text-4xl">
                {stat.number}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
