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
      description:
        "Technical School Center Maribor (TŠC Maribor) is an educational center offering quality general, theoretical vocational, and practical education and training for youth and adults. The school offers various educational programs in mechanical engineering, mechatronics, and automotive industry that adapt to labor market needs. With modern equipped classrooms, workshops, and laboratories, TŠC Maribor ensures quality education adapted to contemporary needs.",
      buttonText: "Learn more",
      imageUrl: "/school-start-times.jpg",
    },
    {
      id: "ptz-dubrovnik",
      title: "Dubrovnik Maritime Technical School",
      description:
        "Dubrovnik Maritime Technical School is a secondary vocational school founded in 1852, offering education in four vocational professions: marine navigator, marine engineering technician, mechanical computer technician, and electrical technician. The school provides practical training in specialized classrooms with modern simulators and workshops, including optional robotics classes. With an ISO 9001:2015 certified quality system and active participation in Erasmus+ projects since 2017, the school ensures high-quality education adapted to contemporary maritime and technical industry needs.",
      buttonText: "Learn more",
      imageUrl: "/school-start-times.jpg",
    },
  ],
  sl: [
    {
      id: "tsc-maribor",
      title: "Tehniški šolski center Maribor",
      description:
        "Tehniški šolski center Maribor (TŠC Maribor) je izobraževalno središče, ki ponuja kakovostno splošno-izobraževalno, strokovno-teoretično in praktično izobraževanje ter usposabljanje za mladino in odrasle. Šola ponuja različne izobraževalne programe na področju strojništva, mehatronike in avtoservisa, ki se prilagajajo potrebam trga dela. S sodobno opremljenimi učilnicami, delavnicami in laboratoriji TŠC Maribor zagotavlja kakovostno izobraževanje, prilagojeno potrebam sodobnega časa.",
      buttonText: "Več informacij",
      imageUrl: "/school-start-times.jpg",
    },
    {
      id: "ptz-dubrovnik",
      title: "Pomorsko-tehniška šola Dubrovnik",
      description:
        "Pomorsko-tehniška šola Dubrovnik je srednja poklicna šola, ustanovljena leta 1852, ki izobražuje dijake v štirih strokovnih smereh: pomorski navtik, pomorski strojni tehnik, strojni računalniški tehnik in elektrotehnik. Šola ponuja praktično usposabljanje v specializiranih učilnicah z modernimi simulatorji in delavnicami, vključno z izbirnim poukom robotike. S sistemom kakovosti, certificiranim po standardu ISO 9001:2015 in aktivnim sodelovanjem v projektih Erasmus+ od leta 2017, šola zagotavlja visokokakovostno izobraževanje, prilagojeno sodobnim potrebam pomorske in tehnične industrije.",
      buttonText: "Več informacij",
      imageUrl: "/school-start-times.jpg",
    },
  ],
  hr: [
    {
      id: "tsc-maribor",
      title: "Tehnički školski centar Maribor",
      description:
        "Tehnički školski centar Maribor (TŠC Maribor) je obrazovni centar koji nudi kvalitetno opće, stručno-teoretsko i praktično obrazovanje i osposobljavanje za mlade i odrasle. Škola nudi različite obrazovne programe u području strojarstva, mehatronike i autoindustrije koji se prilagođavaju potrebama tržišta rada. Sa suvremeno opremljenim učionicama, radionicama i laboratorijima, TŠC Maribor osigurava kvalitetno obrazovanje prilagođeno suvremenim potrebama.",
      buttonText: "Saznaj više",
      imageUrl: "/school-start-times.jpg",
    },
    {
      id: "ptz-dubrovnik",
      title: "Pomorsko-tehnička škola Dubrovnik",
      description:
        "Pomorsko-tehnička škola Dubrovnik je srednja strukovna škola osnovana 1852. godine koja obrazuje učenike u četiri strukovna zanimanja: pomorski nautičar, tehničar za brodostrojarstvo, računalni tehničar za strojarstvo i elektrotehničar. Škola pruža praktičnu nastavu u specijaliziranim učionicama s modernim simulatorima i radionicama, uključujući izbornu nastavu robotike. Sa sustavom kvalitete certificiranim prema normi ISO 9001:2015 i aktivnim sudjelovanjem u Erasmus+ projektima od 2017. godine, škola osigurava visokokvalitetno obrazovanje prilagođeno suvremenim potrebama pomorske i tehničke industrije.",
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
            className={`grid gap-16 items-center ${
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
              <div className="text-muted-foreground text-lg leading-relaxed text-justify">
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
