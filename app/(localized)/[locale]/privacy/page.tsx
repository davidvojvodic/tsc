import { Container } from "@/components/container";
import { SupportedLanguage } from "@/store/language-context";

interface PrivacyPageProps {
  params: Promise<{
    locale: SupportedLanguage;
  }>;
}

const privacyContent = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: December 2024",
    sections: [
      {
        title: "1. Information We Collect",
        content: `We collect information you provide directly to us, such as when you create an account, participate in educational activities, or contact us for support. This may include:
        
• Personal identification information (name, email address)
• Educational progress and quiz results
• Communication preferences
• Technical information about your device and browser`
      },
      {
        title: "2. How We Use Your Information",
        content: `We use the information we collect to:
        
• Provide and improve our educational services
• Track your learning progress
• Send you important updates about the Waterwise project
• Respond to your questions and support requests
• Ensure the security of our platform`
      },
      {
        title: "3. Information Sharing",
        content: `We do not sell, trade, or otherwise transfer your personal information to third parties. We may share information:
        
• With educational partners (TŠC Maribor and PTŠ Dubrovnik) for educational purposes
• When required by law or to protect our rights
• With service providers who assist in operating our platform`
      },
      {
        title: "4. Data Security",
        content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.`
      },
      {
        title: "5. Your Rights",
        content: `You have the right to:
        
• Access your personal information
• Correct inaccurate information
• Request deletion of your data
• Withdraw consent for data processing`
      },
      {
        title: "6. Contact Us",
        content: `If you have questions about this Privacy Policy, please contact us at:
        
Mitja Draškovič
Tehniški šolski center Maribor
Zolajeva ulica 12, 2000 Maribor
Email: mitja.draskovic@tscmb.si
Phone: +386 51 227 990`
      }
    ]
  },
  sl: {
    title: "Politika zasebnosti",
    lastUpdated: "Zadnja posodobitev: december 2024",
    sections: [
      {
        title: "1. Informacije, ki jih zbiramo",
        content: `Zbiramo informacije, ki nam jih posredujete neposredno, na primer, ko ustvarite račun, sodelujete v izobraževalnih dejavnostih ali nas kontaktirate za podporo. To lahko vključuje:
        
• Osebne identifikacijske podatke (ime, e-poštni naslov)
• Izobraževalni napredek in rezultate kvizov
• Preference komuniciranja
• Tehnične informacije o vaši napravi in brskalniku`
      },
      {
        title: "2. Kako uporabljamo vaše informacije",
        content: `Zbrane informacije uporabljamo za:
        
• Zagotavljanje in izboljševanje naših izobraževalnih storitev
• Sledenje vašemu učnemu napredku
• Pošiljanje pomembnih posodobitev o projektu Waterwise
• Odgovarjanje na vaša vprašanja in zahteve za podporo
• Zagotavljanje varnosti naše platforme`
      },
      {
        title: "3. Deljenje informacij",
        content: `Vaših osebnih podatkov ne prodajamo, zamenjujemo ali drugače prenašamo tretjim osebam. Informacije lahko delimo:
        
• Z izobraževalnimi partnerji (TŠC Maribor in PTŠ Dubrovnik) za izobraževalne namene
• Ko to zahteva zakon ali za zaščito naših pravic
• S ponudniki storitev, ki pomagajo pri delovanju naše platforme`
      },
      {
        title: "4. Varnost podatkov",
        content: `Izvajamo ustrezne tehnične in organizacijske ukrepe za zaščito vaših osebnih podatkov pred nepooblaščenim dostopom, spremembo, razkritjem ali uničenjem.`
      },
      {
        title: "5. Vaše pravice",
        content: `Imate pravico do:
        
• Dostopa do vaših osebnih podatkov
• Popravka netočnih informacij
• Zahteve za brisanje vaših podatkov
• Umika soglasja za obdelavo podatkov`
      },
      {
        title: "6. Kontaktirajte nas",
        content: `Če imate vprašanja o tej Politiki zasebnosti, nas kontaktirajte na:
        
Mitja Draškovič
Tehniški šolski center Maribor
Zolajeva ulica 12, 2000 Maribor
E-pošta: mitja.draskovic@tscmb.si
Telefon: +386 51 227 990`
      }
    ]
  },
  hr: {
    title: "Politika privatnosti",
    lastUpdated: "Zadnje ažuriranje: prosinac 2024",
    sections: [
      {
        title: "1. Informacije koje prikupljamo",
        content: `Prikupljamo informacije koje nam izravno pružate, kao što je kada kreirate račun, sudjelujete u obrazovnim aktivnostima ili nas kontaktirate za podršku. To može uključivati:
        
• Osobne identifikacijske podatke (ime, e-mail adresa)
• Obrazovni napredak i rezultate kvizova
• Preferencije komunikacije
• Tehničke informacije o vašem uređaju i pregledniku`
      },
      {
        title: "2. Kako koristimo vaše informacije",
        content: `Prikupljene informacije koristimo za:
        
• Pružanje i poboljšanje naših obrazovnih usluga
• Praćenje vašeg napretka u učenju
• Slanje važnih ažuriranja o projektu Waterwise
• Odgovaranje na vaša pitanja i zahtjeve za podršku
• Osiguravanje sigurnosti naše platforme`
      },
      {
        title: "3. Dijeljenje informacija",
        content: `Ne prodajemo, mijenjamo ili na drugi način prenosimo vaše osobne podatke trećim stranama. Možemo dijeliti informacije:
        
• S obrazovnim partnerima (TŠC Maribor i PTŠ Dubrovnik) u obrazovne svrhe
• Kada to zahtijeva zakon ili za zaštitu naših prava
• S pružateljima usluga koji pomažu u radu naše platforme`
      },
      {
        title: "4. Sigurnost podataka",
        content: `Provodimo odgovarajuće tehničke i organizacijske mjere za zaštitu vaših osobnih podataka od neovlaštenog pristupa, mijenjanja, otkrivanja ili uništavanja.`
      },
      {
        title: "5. Vaša prava",
        content: `Imate pravo na:
        
• Pristup vašim osobnim podacima
• Ispravak netočnih informacija
• Zahtjev za brisanje vaših podataka
• Povlačenje pristanka za obradu podataka`
      },
      {
        title: "6. Kontaktirajte nas",
        content: `Ako imate pitanja o ovoj Politici privatnosti, kontaktirajte nas na:
        
Mitja Draškovič
Tehniški šolski center Maribor
Zolajeva ulica 12, 2000 Maribor
E-mail: mitja.draskovic@tscmb.si
Telefon: +386 51 227 990`
      }
    ]
  }
};

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const content = privacyContent[locale] || privacyContent.en;

  return (
    <Container>
      <div className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {content.title}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              {content.lastUpdated}
            </p>
          </div>

          <div className="prose prose-gray max-w-none">
            {content.sections.map((section, index) => (
              <div key={index} className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
                <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}