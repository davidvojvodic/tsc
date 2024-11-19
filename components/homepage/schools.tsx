import Image from "next/image";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const schools = [
  {
    id: 1,
    title: "About school 1",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    buttonText: "Learn more",
    imageUrl: "/school-start-times.jpg",
  },
  {
    id: 2,
    title: "About school 2",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    buttonText: "Learn more",
    imageUrl: "/school-start-times.jpg",
  },
];

export default function SchoolsSection() {
  return (
    <Container>
      <div className="py-24 space-y-24">
        {schools.map((school, index) => (
          <div
            key={school.id}
            className={`grid gap-12 items-center ${
              index % 2 === 0
                ? "md:grid-cols-[1fr_1fr]"
                : "md:grid-cols-[1fr_1fr]"
            }`}
          >
            {/* Image */}
            <div className={index % 2 === 1 ? "md:order-2" : ""}>
              <div className="aspect-[4/3] relative overflow-hidden rounded-xl bg-muted">
                <Image
                  src={school.imageUrl}
                  alt={school.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Content */}
            <div className={`space-y-6 ${index % 2 === 1 ? "md:order-1" : ""}`}>
              <h2 className="text-3xl font-bold tracking-tight">
                {school.title}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {school.description}
              </p>
              <div>
                <Button>
                  {school.buttonText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
