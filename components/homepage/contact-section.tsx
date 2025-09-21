import { ContactForm } from "@/components/forms/contact-form";
import { Container } from "@/components/container";

interface ContactSectionProps {
  locale: "en" | "sl" | "hr";
}

export function ContactSection({ locale = "en" }: ContactSectionProps) {
  return (
    <section className="py-16 px-4">
      <Container>
        <ContactForm locale={locale} />
      </Container>
    </section>
  );
}