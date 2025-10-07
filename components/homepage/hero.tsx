"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "../container";
import { useLanguage } from "@/store/language-context";
import { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  Lightbulb,
  Globe,
  Languages,
} from "lucide-react";
import { optimizedImages } from "@/lib/optimized-images";

// Stats data with localization and icons
const statsData = [
  {
    number: "70",
    icon: Users,
    labels: {
      en: "Participating students",
      sl: "Sodelujočih dijakov",
      hr: "Sudjelujućih učenika",
    },
  },
  {
    number: "12",
    icon: GraduationCap,
    labels: {
      en: "Participating teachers",
      sl: "Sodelujočih učiteljev",
      hr: "Sudjelujućih nastavnika",
    },
  },
  {
    number: "16",
    icon: Lightbulb,
    labels: {
      en: "Learning prototypes",
      sl: "Učnih prototipov",
      hr: "Obrazovnih prototipova",
    },
  },
  {
    number: "6",
    icon: Globe,
    labels: {
      en: "International exchanges",
      sl: "Mednarodnih izmenjav",
      hr: "Međunarodnih razmjena",
    },
  },
  {
    number: "3",
    icon: Languages,
    labels: {
      en: "Learning languages",
      sl: "Učni jeziki",
      hr: "Učni jezici",
    },
  },
];

// Content for different languages
const content = {
  en: {
    title: "WaterWise",
    subtitle: "Smart irrigation for a sustainable future",
    description:
      'WaterWise is an Erasmus+ KA2 project (small partnerships) connecting TŠC Maribor and PTŠ Dubrovnik to develop a modular curriculum on smart irrigation systems. The goal is to promote innovative teaching, exchanges, and digital solutions such as a system prototype, web application, and e-textbook. The project also addresses the priority "Common values, civic engagement and participation" and raises awareness about sustainable water resource management.',
    buttonText: "Learn More",
  },
  sl: {
    title: "WaterWise",
    subtitle: "Pametno namakanje za trajnostno prihodnost",
    description:
      "WaterWise je Erasmus+ KA2 projekt (manjša partnerstva), ki povezuje TŠC Maribor in PTŠ Dubrovnik pri razvoju modularnega kurikula o pametnih namakalnih sistemih. Cilj je spodbujati inovativno poučevanje, izmenjave ter digitalne rešitve, kot so prototip sistema, spletna aplikacija in e-učbenik. Hkrati projekt nagovarja prednostno nalogo »Skupne vrednote, državljansko udejstvovanje in udeležba« ter krepi ozaveščenost o trajnostnem ravnanju z vodnimi viri.",
    buttonText: "Več informacij",
  },
  hr: {
    title: "WaterWise",
    subtitle: "Pametno navodnjavanje za održivu budućnost",
    description:
      'WaterWise je Erasmus+ KA2 projekt (mala partnerstva) koji povezuje TŠC Maribor i PTŠ Dubrovnik u razvoju modularnog kurikuluma o pametnim sustavima navodnjavanja. Cilj je poticati inovativno poučavanje, razmjene i digitalna rješenja poput prototipa sustava, web aplikacije i e-udžbenika. Projekt također adresira prioritet "Zajedničke vrijednosti, građanski angažman i sudjelovanje" te podiže svijest o održivom upravljanju vodnim resursima.',
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
              <Link href={`/${language}/projects/waterwise`}>
                <Button size="lg" className="h-12 px-8">
                  {localContent.buttonText}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right column - Hero Image */}
          <div className="relative aspect-square max-h-[600px] w-full">
            <Image
              src={optimizedImages.tscHero.src}
              alt="Student Profiles"
              width={optimizedImages.tscHero.width || 1444}
              height={optimizedImages.tscHero.height || 1444}
              className="object-contain"
              priority
              placeholder={optimizedImages.tscHero.blur ? "blur" : undefined}
              blurDataURL={optimizedImages.tscHero.blur}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
            />
          </div>
        </div>

        {/* Stats section */}
        <div className="py-20 md:py-24">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5 lg:gap-12">
            {statsData.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="relative group">
                  {/* Background decoration */}
                  <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative flex flex-col items-center text-center space-y-4">
                    {/* Icon container */}
                    <div className="relative">
                      <div className="flex items-center justify-center w-16 h-16 bg-white dark:bg-gray-900 border-2 border-primary/20 rounded-2xl shadow-lg">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                      {/* Small decorative dot */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white dark:border-gray-900" />
                    </div>

                    {/* Number with emphasis */}
                    <div className="space-y-2">
                      <div className="text-4xl font-black text-foreground md:text-5xl lg:text-6xl">
                        <span className="bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
                          {stat.number}
                        </span>
                        <span className="text-primary/40 text-2xl md:text-3xl lg:text-4xl">
                          +
                        </span>
                      </div>

                      {/* Label with better typography */}
                      <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide md:text-base max-w-[100px] leading-tight">
                        {stat.labels[language] || stat.labels.en}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Container>
  );
}
