// components/homepage/testimonials.tsx
"use client";

import { Container } from "@/components/container";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Quote } from "lucide-react";
import { useLanguage } from "@/store/language-context";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  role_sl?: string | null;
  role_hr?: string | null;
  content: string;
  content_sl?: string | null;
  content_hr?: string | null;
  photo: { url: string } | null;
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export default function TestimonialsSection({
  testimonials,
}: TestimonialsSectionProps) {
  const { language } = useLanguage();

  // Helper function to get localized content
  const getLocalizedContent = (
    testimonial: Testimonial,
    field: "role" | "content"
  ) => {
    if (field === "role") {
      switch (language) {
        case "sl":
          return testimonial.role_sl || testimonial.role;
        case "hr":
          return testimonial.role_hr || testimonial.role;
        default:
          return testimonial.role;
      }
    } else {
      switch (language) {
        case "sl":
          return testimonial.content_sl || testimonial.content;
        case "hr":
          return testimonial.content_hr || testimonial.content;
        default:
          return testimonial.content;
      }
    }
  };

  // Localized section titles
  const sectionContent = {
    en: {
      title: "What Our Students Say",
    },
    sl: {
      title: "Kaj pravijo naši dijaki",
    },
    hr: {
      title: "Što kažu naši učenici",
    },
  };

  const currentContent = sectionContent[language] || sectionContent.en;

  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {currentContent.title}
          </h2>
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
                  {getLocalizedContent(testimonial, "content")}
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
                      {getLocalizedContent(testimonial, "role")}
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
