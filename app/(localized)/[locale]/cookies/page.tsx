import { Container } from "@/components/container";
import { SupportedLanguage } from "@/store/language-context";

interface CookiesPageProps {
  params: Promise<{
    locale: SupportedLanguage;
  }>;
}

const cookiesContent = {
  en: {
    title: "Cookie Policy",
    lastUpdated: "Last updated: December 2024",
    sections: [
      {
        title: "1. What are Cookies?",
        content: `Cookies are small text files that are placed on your computer or mobile device when you visit our website. They are widely used to make websites work more efficiently and to provide information to website owners.`
      },
      {
        title: "2. How We Use Cookies",
        content: `The Waterwise platform uses cookies to:
        
• Remember your login status and preferences
• Track your learning progress and quiz results
• Remember your language preference
• Analyze how our platform is used to improve user experience
• Ensure the security of your account`
      },
      {
        title: "3. Types of Cookies We Use",
        content: `Essential Cookies: These are necessary for the website to function properly. They include:
• Authentication cookies to keep you logged in
• Security cookies to protect against fraud
• Language preference cookies

Analytics Cookies: These help us understand how you use our platform:
• Usage statistics to improve our services
• Performance monitoring to ensure optimal functionality

Functional Cookies: These enhance your experience:
• Storing your quiz progress
• Remembering your display preferences`
      },
      {
        title: "4. Third-Party Cookies",
        content: `We may use third-party services that place cookies on your device:
        
• Authentication services for secure login
• Analytics tools to understand user behavior
• Educational content delivery networks

These third parties have their own cookie policies which we encourage you to review.`
      },
      {
        title: "5. Managing Your Cookie Preferences",
        content: `You can control cookies through your browser settings:
        
• Most browsers allow you to refuse cookies entirely
• You can delete existing cookies from your device
• You can set your browser to notify you when cookies are being used

Please note that disabling certain cookies may affect the functionality of the Waterwise platform.`
      },
      {
        title: "6. Data Retention",
        content: `Different cookies have different retention periods:
        
• Session cookies are deleted when you close your browser
• Persistent cookies remain until their expiration date or until you delete them
• Essential cookies are kept for the duration necessary to provide our services`
      },
      {
        title: "7. Contact Us",
        content: `If you have questions about our use of cookies, please contact us at:
        
Mitja Draškovič
Tehniški šolski center Maribor
Zolajeva ulica 12, 2000 Maribor
Email: mitja.draskovic@tscmb.si
Phone: +386 51 227 990`
      }
    ]
  },
  sl: {
    title: "Politika piškotkov",
    lastUpdated: "Zadnja posodobitev: december 2024",
    sections: [
      {
        title: "1. Kaj so piškotki?",
        content: `Piškotki so majhne besedilne datoteke, ki se postavijo v vaš računalnik ali mobilno napravo, ko obiščete našo spletno stran. Široko se uporabljajo za bolj učinkovito delovanje spletnih strani in za zagotavljanje informacij lastnikom spletnih strani.`
      },
      {
        title: "2. Kako uporabljamo piškotke",
        content: `Platforma Waterwise uporablja piškotke za:
        
• Pomnjenje vašega statusa prijave in preferenc
• Sledenje vašemu učnemu napredku in rezultatom kvizov
• Pomnjenje vaše jezikovne preference
• Analizo uporabe naše platforme za izboljšanje uporabniške izkušnje
• Zagotavljanje varnosti vašega računa`
      },
      {
        title: "3. Vrste piškotkov, ki jih uporabljamo",
        content: `Bistveni piškotki: Ti so potrebni za pravilno delovanje spletne strani. Vključujejo:
• Avtentifikacijske piškotke za ohranjanje prijave
• Varnostne piškotke za zaščito pred goljufijami
• Piškotke za jezikovne preference

Analitični piškotki: Ti nam pomagajo razumeti, kako uporabljate našo platformo:
• Statistike uporabe za izboljšanje naših storitev
• Spremljanje zmogljivosti za zagotavljanje optimalne funkcionalnosti

Funkcionalni piškotki: Ti izboljšajo vašo izkušnjo:
• Shranjevanje vašega napredka pri kvizih
• Pomnjenje vaših preferenc prikaza`
      },
      {
        title: "4. Piškotki tretjih oseb",
        content: `Lahko uporabljamo storitve tretjih oseb, ki postavijo piškotke v vašo napravo:
        
• Avtentifikacijske storitve za varno prijavo
• Analitična orodja za razumevanje vedenja uporabnikov
• Izobraževalne mreže za dostavo vsebine

Te tretje osebe imajo svoje politike piškotkov, ki jih priporočamo, da pregledate.`
      },
      {
        title: "5. Upravljanje vaših preferenc piškotkov",
        content: `Piškotke lahko nadzirate preko nastavitev vašega brskalnika:
        
• Večina brskalnikov vam omogoča popolno zavrnitev piškotkov
• Obstoječe piškotke lahko izbrišete iz vaše naprave
• Svoj brskalnik lahko nastavite, da vas obvesti, ko se uporabljajo piškotki

Opozarjamo, da lahko onemogočanje določenih piškotkov vpliva na funkcionalnost platforme Waterwise.`
      },
      {
        title: "6. Hramnjenje podatkov",
        content: `Različni piškotki imajo različna obdobja hramjenja:
        
• Sejni piškotki se izbrišejo, ko zaprete brskalnik
• Trajni piškotki ostanejo do datuma poteka ali dokler jih ne izbrišete
• Bistveni piškotki se hranijo za čas, potreben za zagotavljanje naših storitev`
      },
      {
        title: "7. Kontaktirajte nas",
        content: `Če imate vprašanja o naši uporabi piškotkov, nas kontaktirajte na:
        
Mitja Draškovič
Tehniški šolski center Maribor
Zolajeva ulica 12, 2000 Maribor
E-pošta: mitja.draskovic@tscmb.si
Telefon: +386 51 227 990`
      }
    ]
  },
  hr: {
    title: "Politika kolačića",
    lastUpdated: "Zadnje ažuriranje: prosinac 2024",
    sections: [
      {
        title: "1. Što su kolačići?",
        content: `Kolačići su male tekstualne datoteke koje se postavljaju na vaše računalo ili mobilni uređaj kada posjećujete našu web stranicu. Široko se koriste za učinkovitiji rad web stranica i za pružanje informacija vlasnicima web stranica.`
      },
      {
        title: "2. Kako koristimo kolačiće",
        content: `Waterwise platforma koristi kolačiće za:
        
• Pamćenje vašeg statusa prijave i preferencija
• Praćenje vašeg napretka u učenju i rezultata kvizova
• Pamćenje vaše jezične preferencije
• Analizu korištenja naše platforme za poboljšanje korisničkog iskustva
• Osiguravanje sigurnosti vašeg računa`
      },
      {
        title: "3. Vrste kolačića koje koristimo",
        content: `Osnovni kolačići: Ovi su potrebni za ispravno funkcioniranje web stranice. Uključuju:
• Autentifikacijske kolačiće za održavanje prijave
• Sigurnosne kolačiće za zaštitu od prevara
• Kolačiće za jezične preferencije

Analitički kolačići: Ovi nam pomažu razumjeti kako koristite našu platformu:
• Statistike korištenja za poboljšanje naših usluga
• Praćenje performansi za osiguravanje optimalne funkcionalnosti

Funkcionalni kolačići: Ovi poboljšavaju vaše iskustvo:
• Spremanje vašeg napretka u kvizovima
• Pamćenje vaših preferencija prikaza`
      },
      {
        title: "4. Kolačići treće strane",
        content: `Možemo koristiti usluge treće strane koje postavljaju kolačiće na vaš uređaj:
        
• Autentifikacijske usluge za sigurnu prijavu
• Analitičke alate za razumijevanje ponašanja korisnika
• Obrazovne mreže za dostavu sadržaja

Ove treće strane imaju svoje vlastite politike kolačića koje preporučujemo da pregledate.`
      },
      {
        title: "5. Upravljanje vašim preferencijama kolačića",
        content: `Kolačiće možete kontrolirati kroz postavke vašeg preglednika:
        
• Većina preglednika omogućuje vam potpuno odbijanje kolačića
• Možete obrisati postojeće kolačiće s vašeg uređaja
• Možete postaviti preglednik da vas obavijesti kada se kolačići koriste

Molimo imajte na umu da onemogućavanje određenih kolačića može utjecati na funkcionalnost Waterwise platforme.`
      },
      {
        title: "6. Čuvanje podataka",
        content: `Različiti kolačići imaju različita razdoblja čuvanja:
        
• Sesijski kolačići se brišu kada zatvorite preglednik
• Trajni kolačići ostaju do datuma isteka ili dok ih ne obrišete
• Osnovni kolačići se čuvaju onoliko dugo koliko je potrebno za pružanje naših usluga`
      },
      {
        title: "7. Kontaktirajte nas",
        content: `Ako imate pitanja o našoj upotrebi kolačića, kontaktirajte nas na:
        
Mitja Draškovič
Tehniški šolski center Maribor
Zolajeva ulica 12, 2000 Maribor
E-mail: mitja.draskovic@tscmb.si
Telefon: +386 51 227 990`
      }
    ]
  }
};

export default async function CookiesPage({ params }: CookiesPageProps) {
  const { locale } = await params;
  const content = cookiesContent[locale] || cookiesContent.en;

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