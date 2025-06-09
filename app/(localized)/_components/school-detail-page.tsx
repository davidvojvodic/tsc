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
      imageUrl: "/sola.jpg",
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
      imageUrl: "/sola.jpg",
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
      imageUrl: "/sola.jpg",
    },
  },
  "ptz-dubrovnik": {
    en: {
      title: "Dubrovnik Maritime Technical School",
      description: `The Dubrovnik Maritime Technical School is a secondary vocational school founded in 1852, where students are educated in four vocational professions:

      • Marine Navigator
      • Marine Engineering Technician
      • Mechanical Computer Technician
      • Electrical Technician

      According to the school curricula, practical classes are held in workshops, cabinets with simulators and specialized classrooms. Students have the opportunity to attend optional robotics classes. Students and teachers collaborate in editing the school magazine Albatros and organizing various cultural, educational, sports and volunteer activities.

      The school has an international quality system in accordance with the ISO 9001:2015 standard, certified by Croatian Register of Shipping (CRS) and Bureau Veritas Quality International (BVQI).

      The school collaborates with various institutions and organizations at local, national and international levels, which enables the implementation of numerous activities and projects. Since 2017, it has been implementing Erasmus+ projects. Vocational education and training projects are particularly notable, among which the Erasmus+ project Cybernetic Advanced Technology from 2018 received a high quality assessment due to successful implementation and sustainability of results. In 2022, the school started implementing its first Erasmus+ KA2 project Yellow Dwarf, aimed at modernizing teaching in the field of renewable energy sources. Since 2023, the school has been the holder of the Erasmus+ accreditation for vocational education and training, which enables continuous international cooperation with various institutions.`,
      imageUrl: "/cro.jpg",
    },
    sl: {
      title: "Pomorsko-tehniška šola Dubrovnik",
      description: `Pomorsko-tehniška šola Dubrovnik je srednja poklicna šola, ustanovljena leta 1852, kjer se dijaki izobražujejo v štirih strokovnih smereh:

      • Pomorski navtik
      • Pomorski strojni tehnik
      • Strojni računalniški tehnik
      • Elektrotehnik

      V skladu s šolskimi programi poteka praktični pouk v delavnicah, kabinetih s simulatorji in specializiranih učilnicah. Dijakom je na voljo izbirni pouk robotike. Dijaki in učitelji sodelujejo pri urejanju šolskega časopisa Albatros ter pri organizaciji različnih kulturnih, izobraževalnih, športnih in prostovoljskih aktivnosti.

      Šola ima mednarodni sistem kakovosti v skladu s standardom ISO 9001:2015, certificiran pri Hrvatski registar brodova (CRS) in Bureau Veritas Quality International (BVQI).

      Šola sodeluje z različnimi ustanovami in organizacijami na lokalni, nacionalni in mednarodni ravni, kar omogoča izvajanje številnih aktivnosti in projektov. Od leta 2017 izvaja Erasmus+ projekte. Posebej izstopajo projekti poklicnega izobraževanja in usposabljanja, med katerimi je Erasmus+ projekt Cybernetic Advanced Technology iz leta 2018 prejel visoko oceno kakovosti zaradi uspešne izvedbe in trajnosti rezultatov. Leta 2022 je šola začela izvajati svoj prvi Erasmus+ KA2 projekt Žuti patuljak, ki je namenjen modernizaciji poučevanja na področju obnovljivih virov energije. Od leta 2023 je šola nosilka Erasmus+ akreditacije za poklicno izobraževanje in usposabljanje, kar omogoča stalno mednarodno sodelovanje z različnimi institucijami.`,
      imageUrl: "/cro.jpg",
    },
    hr: {
      title: "Pomorsko-tehnička škola Dubrovnik",
      description: `Pomorsko-tehnička škola Dubrovnik je srednja strukovna škola osnovana 1852. godine, gdje se učenici obrazuju u četiri strukovna zanimanja:

      • Pomorski nautičar
      • Tehničar za brodostrojarstvo
      • Računalni tehničar za strojarstvo
      • Elektrotehničar

      Prema školskom kurikulumu, praktična nastava se održava u radionici, kabinetima sa simulatorima i specijaliziranim učionicama. Učenici imaju mogućnost pohađati izbornu nastavu robotike. Učenici i nastavnici surađuju u uređivanju školskog časopisa Albatros i organiziranju raznih kulturnih, obrazovnih, sportskih i volonterskih aktivnosti.

      Škola ima međunarodni sustav kvalitete prema normi ISO 9001:2015, certificiran od strane Hrvatskog registra brodova (CRS) i Bureau Veritas Quality International (BVQI).

      Škola surađuje s različitim institucijama i organizacijama na lokalnoj, nacionalnoj i međunarodnoj razini, što omogućuje provedbu brojnih aktivnosti i projekata. Od 2017. provodi Erasmus+ projekte. Posebno se ističu projekti strukovnog obrazovanja i osposobljavanja, među kojima je Erasmus+ projekt Cybernetic Advanced Technology iz 2018. dobio visoku ocjenu kvalitete zbog uspješne provedbe i održivosti rezultata. 2022. škola je započela provedbu prvog Erasmus+ KA2 projekta Žuti patuljak, namijenjenog modernizaciji poučavanja u području obnovljivih izvora energije. Od 2023. škola je nositeljica Erasmus+ akreditacije za strukovno obrazovanje i osposobljavanje, što omogućuje kontinuiranu međunarodnu suradnju s različitim institucijama.`,
      imageUrl: "/cro.jpg",
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
          description={
            language === "en"
              ? "School Profile"
              : language === "sl"
                ? "Profil šole"
                : "Profil škole"
          }
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
