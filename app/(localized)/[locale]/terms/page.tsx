import { Container } from "@/components/container";
import { SupportedLanguage } from "@/store/language-context";

interface TermsPageProps {
  params: Promise<{
    locale: SupportedLanguage;
  }>;
}

const termsContent = {
  en: {
    title: "Terms of Service",
    lastUpdated: "Last updated: December 2024",
    sections: [
      {
        title: "1. Acceptance of Terms",
        content: `By accessing and using the Waterwise educational platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`
      },
      {
        title: "2. Description of Service",
        content: `Waterwise is an educational platform developed as part of an Erasmus+ KA2 project connecting TŠC Maribor and PTŠ Dubrovnik. The platform provides:
        
• Educational materials about smart irrigation systems
• Interactive quizzes and assessments
• Progress tracking for learning activities
• Communication tools for educational purposes`
      },
      {
        title: "3. User Accounts",
        content: `To access certain features of the platform, you may be required to create an account. You are responsible for:
        
• Maintaining the confidentiality of your login credentials
• All activities that occur under your account
• Providing accurate and up-to-date information
• Notifying us immediately of any unauthorized use`
      },
      {
        title: "4. Acceptable Use",
        content: `You agree to use the platform only for lawful educational purposes. Prohibited activities include:
        
• Sharing false or misleading information
• Attempting to gain unauthorized access to the system
• Interfering with other users' learning experience
• Using the platform for commercial purposes without permission`
      },
      {
        title: "5. Intellectual Property",
        content: `All content on the Waterwise platform, including text, graphics, logos, and software, is the property of the Erasmus+ Waterwise project partners and is protected by copyright and other intellectual property laws.`
      },
      {
        title: "6. Educational Use",
        content: `This platform is designed for educational purposes within the Erasmus+ project framework. Content may be used for non-commercial educational activities with proper attribution to the Waterwise project.`
      },
      {
        title: "7. Limitation of Liability",
        content: `The Waterwise project partners shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the platform.`
      },
      {
        title: "8. Contact Information",
        content: `For questions about these Terms of Service, please contact:
        
Mitja Draškovič
Project Coordinator, Waterwise
Tehniški šolski center Maribor
Zolajeva ulica 12, 2000 Maribor
Email: mitja.draskovic@tscmb.si
Phone: +386 51 227 990`
      }
    ]
  },
  sl: {
    title: "Pogoji uporabe",
    lastUpdated: "Zadnja posodobitev: december 2024",
    sections: [
      {
        title: "1. Sprejem pogojev",
        content: `Z dostopom in uporabo izobraževalne platforme Waterwise sprejmete in se strinjate z vezanostjo na pogoje in določbe tega sporazuma. Če se ne strinjate z zgoraj navedenimi pogoji, te storitve ne uporabljajte.`
      },
      {
        title: "2. Opis storitve",
        content: `Waterwise je izobraževalna platforma, razvita kot del projekta Erasmus+ KA2, ki povezuje TŠC Maribor in PTŠ Dubrovnik. Platforma zagotavlja:
        
• Izobraževalna gradiva o pametnih namakalnih sistemih
• Interaktivne kvize in ocenjevanja
• Sledenje napredku pri učnih dejavnostih
• Komunikacijska orodja za izobraževalne namene`
      },
      {
        title: "3. Uporabniški računi",
        content: `Za dostop do določenih funkcij platforme boste morda morali ustvariti račun. Odgovorni ste za:
        
• Ohranjanje zaupnosti vaših prijavnih podatkov
• Vse dejavnosti, ki se izvajajo pod vašim računom
• Zagotavljanje točnih in posodobljenih informacij
• Takojšnje obveščanje o kakršni koli nepooblaščeni uporabi`
      },
      {
        title: "4. Sprejemljiva uporaba",
        content: `Strinjate se, da boste platformo uporabljali samo za zakonite izobraževalne namene. Prepovedane dejavnosti vključujejo:
        
• Deljenje napačnih ali zavajajočih informacij
• Poskusi nepooblaščenega dostopa do sistema
• Motenji izkušnje učenja drugih uporabnikov
• Uporaba platforme v komercialne namene brez dovoljenja`
      },
      {
        title: "5. Intelektualna lastnina",
        content: `Vsa vsebina na platformi Waterwise, vključno z besedilom, grafiko, logotipi in programsko opremo, je last partnerjev projekta Erasmus+ Waterwise in je zaščitena z avtorskimi pravicami in drugimi zakoni o intelektualni lastnini.`
      },
      {
        title: "6. Izobraževalna uporaba",
        content: `Ta platforma je namenjena izobraževalnim namenom v okviru projekta Erasmus+. Vsebina se lahko uporablja za nekomercialne izobraževalne dejavnosti z ustreznim pripisovanjem projektu Waterwise.`
      },
      {
        title: "7. Omejitev odgovornosti",
        content: `Partnerji projekta Waterwise ne odgovarjajo za kakršno koli neposredno, posredno, naključno, posebno ali posledično škodo, ki izhaja iz uporabe ali nezmožnosti uporabe platforme.`
      },
      {
        title: "8. Kontaktne informacije",
        content: `Za vprašanja o teh Pogojih uporabe se obrnite na:
        
Mitja Draškovič
Koordinator projekta Waterwise
Tehniški šolski center Maribor
Zolajeva ulica 12, 2000 Maribor
E-pošta: mitja.draskovic@tscmb.si
Telefon: +386 51 227 990`
      }
    ]
  },
  hr: {
    title: "Uvjeti korištenja",
    lastUpdated: "Zadnje ažuriranje: prosinac 2024",
    sections: [
      {
        title: "1. Prihvaćanje uvjeta",
        content: `Pristupanjem i korištenjem obrazovne platforme Waterwise prihvaćate i slažete se biti vezani uvjetima i odredbama ovog sporazuma. Ako se ne slažete s navedenim, molimo ne koristite ovu uslugu.`
      },
      {
        title: "2. Opis usluge",
        content: `Waterwise je obrazovna platforma razvijena kao dio Erasmus+ KA2 projekta koji povezuje TŠC Maribor i PTŠ Dubrovnik. Platforma pruža:
        
• Obrazovne materijale o pametnim sustavima navodnjavanja
• Interaktivne kvizove i procjene
• Praćenje napretka u aktivnostima učenja
• Komunikacijske alate za obrazovne svrhe`
      },
      {
        title: "3. Korisnički računi",
        content: `Za pristup određenim funkcijama platforme možda ćete morati kreirati račun. Odgovorni ste za:
        
• Održavanje povjerljivosti vaših podataka za prijavu
• Sve aktivnosti koje se odvijaju pod vašim računom
• Pružanje točnih i ažurnih informacija
• Trenutačno obavještavanje o bilo kojoj neovlaštenoj uporabi`
      },
      {
        title: "4. Prihvatljiva uporaba",
        content: `Slažete se koristiti platformu samo u zakonite obrazovne svrhe. Zabranjene aktivnosti uključuju:
        
• Dijeljenje lažnih ili obmanjujućih informacija
• Pokušaje neovlaštenog pristupa sustavu
• Ometanje iskustva učenja drugih korisnika
• Korištenje platforme u komercijalne svrhe bez dozvole`
      },
      {
        title: "5. Intelektualno vlasništvo",
        content: `Sav sadržaj na Waterwise platformi, uključujući tekst, grafiku, logotipove i softver, vlasništvo je partnera Erasmus+ Waterwise projekta i zaštićen je autorskim pravima i drugim zakonima o intelektualnom vlasništvu.`
      },
      {
        title: "6. Obrazovna uporaba",
        content: `Ova platforma je namijenjena obrazovnim svrhama u okviru Erasmus+ projekta. Sadržaj se može koristiti za nekomercijalne obrazovne aktivnosti uz odgovarajuće pripisivanje Waterwise projektu.`
      },
      {
        title: "7. Ograničenje odgovornosti",
        content: `Partneri Waterwise projekta neće biti odgovorni za bilo kakvu izravnu, neizravnu, slučajnu, posebnu ili posljedičnu štetu koja proizlazi iz korištenja ili nemogućnosti korištenja platforme.`
      },
      {
        title: "8. Kontaktne informacije",
        content: `Za pitanja o ovim Uvjetima korištenja, kontaktirajte:
        
Mitja Draškovič
Koordinator projekta Waterwise
Tehniški šolski center Maribor
Zolajeva ulica 12, 2000 Maribor
E-mail: mitja.draskovic@tscmb.si
Telefon: +386 51 227 990`
      }
    ]
  }
};

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  const content = termsContent[locale] || termsContent.en;

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