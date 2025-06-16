import React from "react";
import Link from "next/link";
import { Container } from "../container";
import Image from "next/image";
import { Facebook, Instagram, Mail, MapPin, Phone, User } from "lucide-react";
import { cookies } from "next/headers";
import { SupportedLanguage } from "@/store/language-context";
import { CookieSettingsButton } from "@/components/cookie-consent/cookie-settings-button";

// Translation helper
const getTranslations = (language: SupportedLanguage) => {
  const translations = {
    en: {
      about: "About Us",
      projects: "Our Projects",
      waterwise: "WaterWise",
      resources: "Resources",
      learning: "Online Learning",
      studyMaterials: "Study Materials",
      quizzes: "Quizzes",
      blog: "Blog",
      faqs: "FAQs",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      cookies: "Cookie Policy",
      quickLinks: "Quick Links",
      resourcesHeading: "Resources",
      copyright: "© 2024 WaterWise. All rights reserved.",
      address:
        "Tehniški šolski center Maribor, Zolajeva ulica 12, 2000 Maribor",
      coordinator: "Mitja Draškovič, project coordinator Waterwise",
      contactUs: "Contact",
      home: "Home",
      followUs: "Follow Us",
      tscFacebook: "TŠC Maribor",
      ptsFacebook: "PTŠ Dubrovnik",
      tscInstagram: "TŠC Maribor",
      ptsInstagram: "PTŠ Dubrovnik",
    },
    sl: {
      about: "O nas",
      projects: "Naši projekti",
      waterwise: "WaterWise",
      resources: "Gradiva",
      learning: "Spletno učenje",
      studyMaterials: "Učna gradiva",
      quizzes: "Kvizi",
      blog: "Blog",
      faqs: "Pogosta vprašanja",
      privacy: "Politika zasebnosti",
      terms: "Pogoji uporabe",
      cookies: "Politika piškotkov",
      quickLinks: "Hitre povezave",
      resourcesHeading: "Viri",
      copyright: "© 2024 WaterWise. Vse pravice pridržane.",
      address:
        "Tehniški šolski center Maribor, Zolajeva ulica 12, 2000 Maribor",
      coordinator: "Mitja Draškovič, koordinator projekta Waterwise",
      contactUs: "Kontakt",
      home: "Domov",
      followUs: "Sledite nam",
      tscFacebook: "TŠC Maribor",
      ptsFacebook: "PTŠ Dubrovnik",
      tscInstagram: "TŠC Maribor",
      ptsInstagram: "PTŠ Dubrovnik",
    },
    hr: {
      about: "O nama",
      projects: "Naši projekti",
      waterwise: "WaterWise",
      resources: "Materijali",
      learning: "Online učenje",
      studyMaterials: "Nastavni materijali",
      quizzes: "Kvizovi",
      blog: "Blog",
      faqs: "Česta pitanja",
      privacy: "Politika privatnosti",
      terms: "Uvjeti korištenja",
      cookies: "Politika kolačića",
      quickLinks: "Brze poveznice",
      resourcesHeading: "Resursi",
      copyright: "© 2024 WaterWise. Sva prava pridržana.",
      address:
        "Tehniški šolski center Maribor, Zolajeva ulica 12, 2000 Maribor",
      coordinator: "Mitja Draškovič, koordinator projekta Waterwise",
      contactUs: "Kontakt",
      home: "Početna",
      followUs: "Pratite nas",
      tscFacebook: "TŠC Maribor",
      ptsFacebook: "PTŠ Dubrovnik",
      tscInstagram: "TŠC Maribor",
      ptsInstagram: "PTŠ Dubrovnik",
    },
  };

  return translations[language];
};

// Get translated links for the current language
const getNavigationLinks = (language: SupportedLanguage) => {
  const t = getTranslations(language);

  // Base paths without language prefix
  const basePaths = {
    home: "/",
    projects: "/projects",
    waterwise: "/projects/Waterwise",
    materials: "/materials",
    quizzes: "/quizzes",
    blog: "/blog",
    faqs: "/faqs",
    privacy: "/privacy",
    terms: "/terms",
    cookies: "/cookies",
  };

  // If we're not in English, prefix all paths with language code
  const prefix = language === "en" ? "" : `/${language}`;

  const paths = {
    home: `${prefix}${basePaths.home}`,
    projects: `${prefix}${basePaths.projects}`,
    waterwise: `${prefix}${basePaths.waterwise}`,
    materials: `${prefix}${basePaths.materials}`,
    quizzes: `${prefix}${basePaths.quizzes}`,
    blog: `${prefix}${basePaths.blog}`,
    faqs: `${prefix}${basePaths.faqs}`,
    privacy: `${prefix}${basePaths.privacy}`,
    terms: `${prefix}${basePaths.terms}`,
    cookies: `${prefix}${basePaths.cookies}`,
  };

  return {
    main: [
      { name: t.about, href: paths.home },
      { name: t.projects, href: paths.projects },
      { name: t.waterwise, href: paths.waterwise },
      { name: t.resources, href: paths.materials },
      { name: t.learning, href: paths.quizzes },
    ],
    resources: [
      { name: t.studyMaterials, href: paths.materials },
      { name: t.quizzes, href: paths.quizzes },
      { name: t.blog, href: paths.blog },
      { name: t.faqs, href: paths.faqs },
    ],
    legal: [
      { name: t.privacy, href: paths.privacy },
      { name: t.terms, href: paths.terms },
      { name: t.cookies, href: paths.cookies },
    ],
  };
};

export function Footer() {
  // Get current language from cookies
  const cookieStore = cookies();
  const langCookie = cookieStore.get("NEXT_LOCALE");
  const language = (langCookie?.value || "en") as SupportedLanguage;

  // Get translations
  const t = getTranslations(language);

  // Setup navigation data with translations and language-aware paths
  const navigation = getNavigationLinks(language);

  // Get the home path with language prefix
  const prefix = language === "en" ? "" : `/${language}`;
  const homeLink = `${prefix}/`;

  const socialLinks = [
    {
      name: t.tscFacebook,
      icon: Facebook,
      href: "https://www.facebook.com/TSCMariboruradnastran",
      type: "facebook",
    },
    {
      name: t.ptsFacebook,
      icon: Facebook,
      href: "https://www.facebook.com/profile.php?id=100067681561640",
      type: "facebook",
    },
    {
      name: t.tscInstagram,
      icon: Instagram,
      href: "https://www.instagram.com/tsc_maribor",
      type: "instagram",
    },
    {
      name: t.ptsInstagram,
      icon: Instagram,
      href: "https://www.instagram.com/pomorskotehnickaskoladubrovnik",
      type: "instagram",
    },
  ];

  return (
    <footer className="mt-auto bg-background border-t">
      <Container>
        {/* Main Footer Content */}
        <div className="py-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Column */}
            <div className="space-y-4 col-span-1 md:col-span-2">
              <Link href={homeLink} className="inline-block">
                <Image
                  src="/waterwise.png"
                  alt="WaterWise Logo"
                  width={120}
                  height={48}
                  className="dark:invert"
                />
              </Link>
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-semibold">{t.contactUs}</h3>
                <div className="flex items-start text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{t.address}</span>
                </div>
                <div className="flex items-start text-sm text-muted-foreground">
                  <User className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="font-medium">{t.coordinator}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 mr-2" />
                  +386 51 227 990
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2" />
                  mitja.draskovic@tscmb.si
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold mb-4">{t.quickLinks}</h3>
              <ul className="space-y-2">
                {navigation.main.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold mb-4">
                {t.resourcesHeading}
              </h3>
              <ul className="space-y-2">
                {navigation.resources.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap justify-center sm:justify-start gap-4">
              {navigation.legal.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.name}
                </Link>
              ))}
              <CookieSettingsButton 
                variant="ghost" 
                size="sm" 
                showIcon={false}
                className="text-xs text-muted-foreground hover:text-foreground h-auto p-0 font-normal"
              />
            </div>

            {/* Social Links */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                {socialLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name + item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      title={item.name}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Copyright */}
            <p className="text-xs text-muted-foreground">{t.copyright}</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
