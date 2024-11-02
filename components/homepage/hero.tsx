// components/HeroSection.tsx
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
        {/* Small profile image in top-right */}
        <div className="absolute -top-12 right-4 z-10 md:right-8">
          <Image
            src="/profile-small.jpg"
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full"
          />
        </div>

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

          {/* Right column - Images */}
          <div className="relative h-[500px]">
            {/* Decorative dots pattern */}
            <div className="absolute right-0 top-0 h-64 w-64 opacity-10">
              <div className="grid grid-cols-6 gap-4">
                {[...Array(36)].map((_, i) => (
                  <div key={i} className="h-2 w-2 rounded-full bg-foreground" />
                ))}
              </div>
            </div>

            {/* Profile images */}
            <div className="relative h-full">
              <div className="absolute left-4 top-8 z-20 h-64 w-64 overflow-hidden rounded-full bg-blue-500">
                <Image
                  src="/profile-1.jpg"
                  alt="Student profile"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute right-4 top-32 z-10 h-72 w-72 overflow-hidden rounded-full bg-red-400">
                <Image
                  src="/profile-2.jpg"
                  alt="Student profile"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-16 h-64 w-64 overflow-hidden rounded-full bg-yellow-400">
                <Image
                  src="/profile-3.jpg"
                  alt="Student profile"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Community badge */}
              <div className="absolute bottom-12 left-0 z-30 rounded-lg bg-white p-3 shadow-lg">
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
