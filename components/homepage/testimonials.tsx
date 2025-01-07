// components/homepage/testimonials.tsx
"use client";

import { Container } from "@/components/container";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Quote } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  photo: { url: string } | null;
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export default function TestimonialsSection({
  testimonials,
}: TestimonialsSectionProps) {
  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            What Our Students Say
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear from our students about their learning experiences and
            achievements.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="relative p-8 overflow-hidden bg-background"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-4 right-4 h-12 w-12 text-muted-foreground/10" />

              {/* Testimonial Content */}
              <div className="relative">
                <blockquote className="text-lg mb-6">
                  {testimonial.content}
                </blockquote>

                {/* Author */}
                <footer className="flex items-center gap-4">
                  <div className="relative h-12 w-12">
                    {testimonial.photo ? (
                      <Image
                        src={testimonial.photo.url}
                        alt={testimonial.name}
                        fill
                        className="object-cover rounded-full"
                      />
                    ) : (
                      <div className="h-full w-full rounded-full bg-secondary" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </footer>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}