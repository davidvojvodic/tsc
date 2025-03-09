"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "../container";
import { useLanguage } from "@/store/language-context";
import { useEffect, useState } from "react";

const stats = [
  { number: "250+", label: "Lorem ipsum" },
  { number: "1000+", label: "Lorem ipsum" },
  { number: "15+", label: "Lorem ipsum" },
  { number: "2400+", label: "Lorem ipsum" },
];

// Content for different languages
const content = {
  en: {
    title: "Waterwise",
    subtitle: "Smart irrigation for a sustainable future",
    description:
      'Waterwise is an Erasmus+ KA2 project (small partnerships) connecting TŠC Maribor and PTŠ Dubrovnik to develop a modular curriculum on smart irrigation systems. The goal is to promote innovative teaching, exchanges, and digital solutions such as a system prototype, web application, and e-textbook. The project also addresses the priority "Common values, civic engagement and participation" and raises awareness about sustainable water resource management.',
    buttonText: "Learn More",
  },
  sl: {
    title: "Waterwise",
    subtitle: "Pametno namakanje za trajnostno prihodnost",
    description:
      "Waterwise je Erasmus+ KA2 projekt (manjša partnerstva), ki povezuje TŠC Maribor in PTŠ Dubrovnik pri razvoju modularnega kurikula o pametnih namakalnih sistemih. Cilj je spodbujati inovativno poučevanje, izmenjave ter digitalne rešitve, kot so prototip sistema, spletna aplikacija in e-učbenik. Hkrati projekt nagovarja prednostno nalogo »Skupne vrednote, državljansko udejstvovanje in udeležba« ter krepi ozaveščenost o trajnostnem ravnanju z vodnimi viri.",
    buttonText: "Več informacij",
  },
  hr: {
    title: "Waterwise",
    subtitle: "Pametno navodnjavanje za održivu budućnost",
    description:
      'Waterwise je Erasmus+ KA2 projekt (mala partnerstva) koji povezuje TŠC Maribor i PTŠ Dubrovnik u razvoju modularnog kurikuluma o pametnim sustavima navodnjavanja. Cilj je poticati inovativno poučavanje, razmjene i digitalna rješenja poput prototipa sustava, web aplikacije i e-udžbenika. Projekt također adresira prioritet "Zajedničke vrijednosti, građanski angažman i sudjelovanje" te podiže svijest o održivom upravljanju vodnim resursima.',
    buttonText: "Saznaj više",
  },
};

export function HeroSection() {
  const { language } = useLanguage();
  const [localContent, setLocalContent] = useState(content.en);

  useEffect(() => {
    setLocalContent(content[language] || content.en);
  }, [language]);

  return (
    <Container>
      <div className="relative">
        <div className="grid gap-12 py-16 md:grid-cols-2 md:items-center md:py-24">
          {/* Left column - Text content */}
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              {localContent.title}
            </h1>
            <h2 className="text-2xl font-semibold text-primary md:text-3xl">
              {localContent.subtitle}
            </h2>
            <p className="text-lg text-muted-foreground">
              {localContent.description}
            </p>
            <div>
              <Button size="lg" className="h-12 px-8">
                {localContent.buttonText}
              </Button>
            </div>
          </div>

          {/* Right column - Hero Image */}
          <div className="relative aspect-square max-h-[600px] w-full">
            <Image
              src="/hero-upscaled.png"
              alt="Student Profiles"
              width={1080}
              height={1080}
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
