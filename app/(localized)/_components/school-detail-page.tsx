"use client";

import { Container } from "@/components/container";
import Image from "next/image";
import { Heading } from "@/components/ui/heading";
import { SupportedLanguage } from "@/store/language-context";

interface SchoolDetailProps {
  slug: string;
  language: SupportedLanguage;
}

// School content for different languages
const schoolContent = {
  "tsc-maribor": {
    en: {
      title: "Technical School Center Maribor",
      description: `Technical School Center Maribor (TŠC Maribor) is an educational center offering quality general, theoretical vocational, and practical education and training for youth and adults.
        
      The Secondary School of Mechanical Engineering at TŠC Maribor offers various educational programs that adapt to labor market needs:
        
      Mechanical Engineering:
      • Installer of mechanical installations: Trains for installation, assembly, and adjustment of various systems such as water supply, gas pipelines, heating systems, and air conditioning.
      • Metal designer – toolmaker: Emphasis on manufacturing, assembly, maintenance, and control of various tools using techniques such as turning, milling, and grinding.
      • Mechanical Technician (SSI): One of the most employable technical professions with a wide range of expertise needed in various industries.
        
      Mechatronics:
      • Mechatronics Operator: Combines knowledge from mechanics, pneumatics, hydraulics, electrical engineering, and electronics, enabling work on computer-controlled machines.
        
      Automotive Industry:
      • Auto Servicer: Specialized in servicing and diagnostics of motor vehicles and troubleshooting various vehicle systems.
      • Auto Body Repairer: Focuses on manufacturing, repairing, and maintaining car bodies and vehicle upgrades.
        
      In addition to secondary education, TŠC Maribor also includes a higher vocational college offering Mechanical Engineering and Automotive Service Management programs.
        
      The school participates in the Erasmus+ KA1 program, enabling students to participate in international exchanges and gain valuable experience abroad. TŠC Maribor has successfully obtained the Erasmus+ KA2 Waterwise project, aimed at raising awareness and implementing smart solutions in sustainable water management. The school also participates in the zMIGAJ! project, which promotes physical activity and sports among students and emphasizes the importance of a healthy lifestyle.
        
      With modern equipped classrooms, workshops, and laboratories, TŠC Maribor ensures quality education adapted to contemporary needs.`,
      imageUrl: "/school-start-times.jpg",
    },
    sl: {
      title: "Tehniški šolski center Maribor",
      description: `Tehniški šolski center Maribor (TŠC Maribor) je izobraževalno središče, ki ponuja kakovostno splošno-izobraževalno, strokovno-teoretično in praktično izobraževanje ter usposabljanje za mladino in odrasle.  
      
      V sklopu srednje strojne šole TŠC Maribor so na voljo različni izobraževalni programi, ki se prilagajajo potrebam trga dela: 
      
      Strojništvo:
      • Inštalater strojnih inštalacij: Usposablja za napeljavo, montažo in nastavitev različnih sistemov, kot so vodovod, plinovod, toplovod in klimatske naprave. 
      • Oblikovalec kovin – orodjar: Poudarek je na izdelavi, montaži, vzdrževanju in kontroli raznih orodij z uporabo tehnik, kot so struženje, frezanje in brušenje. 
      • Strojni tehnik (SSI): Gre za enega najbolj zaposljivih tehničnih poklicev s širokim spektrom strokovnih znanj, potrebnih v različnih industrijah. 
      
      Mehatronika:
      • Mehatronik operater: Združuje znanja iz mehanike, pnevmatike, hidravlike, elektrotehnike in elektronike ter omogoča delo na računalniško vodenih strojih. 
      
      Avtostroka:
      • Avtoserviser: Specializiran za servisiranje in diagnostiko motornih vozil ter iskanje napak na različnih sistemih vozila. 
      • Avtokaroserist: Osredotoča se na izdelavo, popravilo in vzdrževanje karoserij ter nadgradenj motornih vozil.
      
      Poleg srednje šole TŠC Maribor vključuje tudi višjo strokovno šolo, ki ponuja študijska programa Strojništvo in Avtoservisni menedžment. 
      
      Šola sodeluje v programu Erasmus+ KA1, ki dijakom in študentom omogoča mednarodne izmenjave ter pridobivanje dragocenih izkušenj v tujini. TŠC Maribor je uspešno pridobil projekt Erasmus+ KA2 Waterwise, ki je namenjen ozaveščanju in uvajanju pametnih rešitev na področju trajnostnega ravnanja z vodo. Prav tako šola sodeluje v projektu zMIGAJ!, ki spodbuja telesno aktivnost in šport med dijaki ter poudarja pomen zdravega življenjskega sloga.
      
      S sodobno opremljenimi učilnicami, delavnicami in laboratoriji TŠC Maribor zagotavlja kakovostno izobraževanje, prilagojeno potrebam sodobnega časa.`,
      imageUrl: "/school-start-times.jpg",
    },
    hr: {
      title: "Tehnički školski centar Maribor",
      description: `Tehnički školski centar Maribor (TŠC Maribor) je obrazovni centar koji nudi kvalitetno opće, stručno-teoretsko i praktično obrazovanje i osposobljavanje za mlade i odrasle.
      
      U sklopu srednje strojarske škole TŠC Maribor dostupni su različiti obrazovni programi koji se prilagođavaju potrebama tržišta rada:
      
      Strojarstvo:
      • Instalater strojnih instalacija: Osposobljava za postavljanje, montažu i podešavanje različitih sustava poput vodovoda, plinovoda, toplovoda i klimatizacijskih uređaja.
      • Oblikovatelj metala – alatničar: Naglasak je na izradi, montaži, održavanju i kontroli raznih alata korištenjem tehnika poput tokarenja, glodanja i brušenja.
      • Strojarski tehničar (SSI): Jedan od najzapošljivijih tehničkih zanimanja sa širokim spektrom stručnih znanja potrebnih u različitim industrijama.
      
      Mehatronika:
      • Mehatroničar: Kombinira znanja iz mehanike, pneumatike, hidraulike, elektrotehnike i elektronike te omogućuje rad na računalno upravljanim strojevima.
      
      Autoindustrija:
      • Autoserviser: Specijaliziran za servisiranje i dijagnostiku motornih vozila te pronalaženje kvarova na različitim sustavima vozila.
      • Autokaroser: Fokusira se na izradu, popravak i održavanje karoserija i nadogradnji motornih vozila.
      
      Osim srednje škole, TŠC Maribor uključuje i višu stručnu školu koja nudi studijske programe Strojarstvo i Autoservisni menadžment.
      
      Škola sudjeluje u programu Erasmus+ KA1, koji učenicima i studentima omogućuje međunarodne razmjene i stjecanje dragocjenih iskustava u inozemstvu. TŠC Maribor je uspješno dobio projekt Erasmus+ KA2 Waterwise, usmjeren na podizanje svijesti i implementaciju pametnih rješenja u održivom upravljanju vodama. Škola također sudjeluje u projektu zMIGAJ!, koji promiče tjelesnu aktivnost i sport među učenicima te naglašava važnost zdravog načina života.
      
      Sa suvremeno opremljenim učionicama, radionicama i laboratorijima, TŠC Maribor osigurava kvalitetno obrazovanje prilagođeno suvremenim potrebama.`,
      imageUrl: "/school-start-times.jpg",
    },
  },
  "ptz-dubrovnik": {
    en: {
      title: "About School 2",
      description: "Information about the second school will be added here.",
      imageUrl: "/school-start-times.jpg",
    },
    sl: {
      title: "O šoli 2",
      description: "Informacije o drugi šoli bodo dodane tukaj.",
      imageUrl: "/school-start-times.jpg",
    },
    hr: {
      title: "O školi 2",
      description: "Informacije o drugoj školi bit će dodane ovdje.",
      imageUrl: "/school-start-times.jpg",
    },
  },
};

export function SchoolDetailPage({ slug, language }: SchoolDetailProps) {
  const school = schoolContent[slug as keyof typeof schoolContent]?.[language];
  
  if (!school) {
    return (
      <Container>
        <div className="py-20">
          <p>School not found</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-12 space-y-12">
        <Heading 
          title={school.title} 
          description={language === "en" ? "School Profile" : 
                      language === "sl" ? "Profil šole" : 
                      "Profil škole"} 
        />
        
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl">
          <Image
            src={school.imageUrl}
            alt={school.title}
            fill
            className="object-cover"
          />
        </div>
        
        <div className="prose prose-lg max-w-none whitespace-pre-line">
          {school.description}
        </div>
      </div>
    </Container>
  );
}