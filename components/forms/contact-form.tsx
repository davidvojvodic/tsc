"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  User,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  Droplets,
  Waves,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message too long"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  locale: "en" | "sl" | "hr";
}

const translations = {
  en: {
    title: "Get in Touch",
    subtitle: "Let's make waves together",
    description: "Have feedback or suggestions about WaterWise? We'd love to hear from you and help shape the future of smart irrigation.",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    emailLabel: "Email Address",
    emailPlaceholder: "your@email.com",
    messageLabel: "Your Message",
    messagePlaceholder: "Tell us your thoughts, suggestions, or report any issues you've encountered...",
    submitButton: "Send Message",
    submittingButton: "Sending...",
    successMessage: "Thank you! Your message has been sent successfully.",
    successTitle: "Message Sent!",
    sendAnotherMessage: "Send Another Message",
    errorMessage: "Sorry, something went wrong. Please try again.",
  },
  sl: {
    title: "Kontaktirajte nas",
    subtitle: "",
    description: "Imate povratne informacije ali predloge o WaterWise?",
    nameLabel: "Ime",
    namePlaceholder: "Vaše ime",
    emailLabel: "E-poštni naslov",
    emailPlaceholder: "vasa@eposta.si",
    messageLabel: "Vaše sporočilo",
    messagePlaceholder: "Povejte nam svoje misli, predloge ali prijavite težave, ki ste jih opazili...",
    submitButton: "Pošlji sporočilo",
    submittingButton: "Pošiljanje...",
    successMessage: "Hvala! Vaše sporočilo je bilo uspešno poslano.",
    successTitle: "Sporočilo poslano!",
    sendAnotherMessage: "Pošlji drugo sporočilo",
    errorMessage: "Oprostite, nekaj je šlo narobe. Poskusite znova.",
  },
  hr: {
    title: "Kontaktirajte nas",
    subtitle: "Stvorimo valove zajedno",
    description: "Imate povratne informacije ili prijedloge o WaterWise? Rado bismo čuli od vas i pomogli oblikovati budućnost pametnog navodnjavanja.",
    nameLabel: "Ime",
    namePlaceholder: "Vaše ime",
    emailLabel: "Email adresa",
    emailPlaceholder: "vas@email.hr",
    messageLabel: "Vaša poruka",
    messagePlaceholder: "Recite nam svoje misli, prijedloge ili prijavite probleme koje ste primijetili...",
    submitButton: "Pošaljite poruku",
    submittingButton: "Šaljemo...",
    successMessage: "Hvala! Vaša poruka je uspješno poslana.",
    successTitle: "Poruka poslana!",
    sendAnotherMessage: "Pošaljite drugu poruku",
    errorMessage: "Žao nam je, nešto je pošlo po zlu. Molimo pokušajte ponovo.",
  },
};

export function ContactForm({ locale = "en" }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const t = translations[locale];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus("success");
        reset();
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Contact form submission error:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === "success") {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>

            {/* Success Content */}
            <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {t.successTitle}
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              {t.successMessage}
            </p>

            <Button
              onClick={() => setSubmitStatus("idle")}
              variant="outline"
              className="group"
            >
              {t.sendAnotherMessage}
              <Mail className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="relative">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-chart-2 rounded-2xl mb-6 shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                {t.title}
              </span>
            </h2>

            <h3 className="text-xl md:text-2xl font-semibold text-primary mb-4">
              {t.subtitle}
            </h3>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t.description}
            </p>
          </div>

          {/* Error Message */}
          {submitStatus === "error" && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-800 dark:text-red-200">{t.errorMessage}</p>
              </div>
            </div>
          )}

          {/* Contact Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto">
            {/* Name and Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Field */}
              <div className="group">
                <Label
                  htmlFor="name"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3"
                >
                  <User className="w-4 h-4 text-primary" />
                  {t.nameLabel}
                </Label>
                <Input
                  id="name"
                  placeholder={t.namePlaceholder}
                  {...register("name")}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="group">
                <Label
                  htmlFor="email"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3"
                >
                  <Mail className="w-4 h-4 text-primary" />
                  {t.emailLabel}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  {...register("email")}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* Message Field */}
            <div className="group">
              <Label
                htmlFor="message"
                className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3"
              >
                <MessageSquare className="w-4 h-4 text-primary" />
                {t.messageLabel}
              </Label>
              <Textarea
                id="message"
                placeholder={t.messagePlaceholder}
                rows={5}
                {...register("message")}
                disabled={isSubmitting}
                className="min-h-[120px] resize-none"
              />
              {errors.message && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.message.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="text-center pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className={cn(
                  "h-14 px-12 text-lg font-semibold",
                  "bg-gradient-to-r from-primary to-chart-2",
                  "hover:from-primary/90 hover:to-chart-2/90",
                  "shadow-lg hover:shadow-xl transition-all duration-300",
                  "hover:scale-105 active:scale-95",
                  "group relative overflow-hidden"
                )}
              >
                {/* Button background animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t.submittingButton}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    {t.submitButton}
                  </>
                )}
              </Button>
            </div>
          </form>
      </div>
    </div>
  );
}