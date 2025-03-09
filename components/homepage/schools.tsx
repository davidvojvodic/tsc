"use client";
import Image from "next/image";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/store/language-context";
import { useEffect, useState } from "react";
import Link from "next/link";

// Multilingual content for schools
const schoolsContent = {
  en: [
    {
      id: "tsc-maribor",
      title: "Technical School Center Maribor",
      description: "Technical School Center Maribor (TŠC Maribor) is an educational center offering quality general, theoretical vocational, and practical education and training for youth and adults. The school offers various educational programs in mechanical engineering, mechatronics, and automotive industry that adapt to labor market needs. With modern equipped classrooms, workshops, and laboratories, TŠC Maribor ensures quality education adapted to contemporary needs.",
      buttonText: "Learn more",
      imageUrl: "/school-start-times.jpg",
    },
    {
      id: "ptz-dubrovnik",
      title: "About School 2",
      description: "Information about the second school will be added here.",
      buttonText: "Learn more",
      imageUrl: "/school-start-times.jpg",
    },
  ],
  sl: [
    {
      id: "tsc-maribor",
      title: "Tehniški šolski center Maribor",
      description: "Tehniški šolski center Maribor (TŠC Maribor) je izobraževalno središče, ki ponuja kakovostno splošno-izobraževalno, strokovno-teoretično in praktično izobraževanje ter usposabljanje za mladino in odrasle. Šola ponuja različne izobraževalne programe na področju strojništva, mehatronike in avtoservisa, ki se prilagajajo potrebam trga dela. S sodobno opremljenimi učilnicami, delavnicami in laboratoriji TŠC Maribor zagotavlja kakovostno izobraževanje, prilagojeno potrebam sodobnega časa.",
      buttonText: "Več informacij",
      imageUrl: "/school-start-times.jpg",
    },
    {
      id: "ptz-dubrovnik",
      title: "O šoli 2",
      description: "Informacije o drugi šoli bodo dodane tukaj.",
      buttonText: "Več informacij",
      imageUrl: "/school-start-times.jpg",
    },
  ],
  hr: [
    {
      id: "tsc-maribor",
      title: "Tehnički školski centar Maribor",
      description: "Tehnički školski centar Maribor (TŠC Maribor) je obrazovni centar koji nudi kvalitetno opće, stručno-teoretsko i praktično obrazovanje i osposobljavanje za mlade i odrasle. Škola nudi različite obrazovne programe u području strojarstva, mehatronike i autoindustrije koji se prilagođavaju potrebama tržišta rada. Sa suvremeno opremljenim učionicama, radionicama i laboratorijima, TŠC Maribor osigurava kvalitetno obrazovanje prilagođeno suvremenim potrebama.",
      buttonText: "Saznaj više",
      imageUrl: "/school-start-times.jpg",
    },
    {
      id: "ptz-dubrovnik",
      title: "O školi 2",
      description: "Informacije o drugoj školi bit će dodane ovdje.",
      buttonText: "Saznaj više",
      imageUrl: "/school-start-times.jpg",
    },
  ],
};

export default function SchoolsSection() {
  const { language } = useLanguage();
  const [schools, setSchools] = useState(schoolsContent.en);

  useEffect(() => {
    setSchools(schoolsContent[language] || schoolsContent.en);
  }, [language]);

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
              <div className="text-muted-foreground text-lg leading-relaxed">
                {school.description}
              </div>
              <div>
                <Link href={`/${language}/schools/${school.id}`}>
                  <Button>
                    {school.buttonText}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}