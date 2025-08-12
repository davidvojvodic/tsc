"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { formSchema } from "@/lib/auth-schema";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SupportedLanguage } from "@/store/language-context";

// Get translations based on the language
const getTranslations = (language: SupportedLanguage) => {
  const translations = {
    en: {
      title: "Sign Up",
      description: "Create your account to get started.",
      nameLabel: "Name",
      namePlaceholder: "John Doe",
      emailLabel: "Email",
      emailPlaceholder: "john@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      createAccount: "Create account",
      creatingAccount: "Creating account...",
      haveAccount: "Already have an account?",
      signIn: "Sign in",
      termsPrefix: "By creating an account, you agree to our",
      termsService: "Terms of Service",
      and: "and",
      privacyPolicy: "Privacy Policy",
      accountCreated: "Account created!",
      verifyEmail: "Please check your email to verify your account.",
      errorTitle: "Error",
    },
    sl: {
      title: "Registracija",
      description: "Ustvarite svoj račun za začetek.",
      nameLabel: "Ime",
      namePlaceholder: "Janez Novak",
      emailLabel: "E-pošta",
      emailPlaceholder: "janez@primer.si",
      passwordLabel: "Geslo",
      passwordPlaceholder: "Vnesite svoje geslo",
      createAccount: "Ustvari račun",
      creatingAccount: "Ustvarjanje računa...",
      haveAccount: "Že imate račun?",
      signIn: "Prijava",
      termsPrefix: "Z ustvarjanjem računa se strinjate z našimi",
      termsService: "Pogoji uporabe",
      and: "in",
      privacyPolicy: "Pravilnikom o zasebnosti",
      accountCreated: "Račun ustvarjen!",
      verifyEmail: "Prosimo, preverite svojo e-pošto za potrditev računa.",
      errorTitle: "Napaka",
    },
    hr: {
      title: "Registracija",
      description: "Stvorite svoj račun za početak.",
      nameLabel: "Ime",
      namePlaceholder: "Ivan Horvat",
      emailLabel: "E-mail",
      emailPlaceholder: "ivan@primjer.hr",
      passwordLabel: "Lozinka",
      passwordPlaceholder: "Unesite svoju lozinku",
      createAccount: "Stvori račun",
      creatingAccount: "Stvaranje računa...",
      haveAccount: "Već imate račun?",
      signIn: "Prijava",
      termsPrefix: "Stvaranjem računa pristajete na naše",
      termsService: "Uvjete korištenja",
      and: "i",
      privacyPolicy: "Politiku privatnosti",
      accountCreated: "Račun stvoren!",
      verifyEmail: "Molimo provjerite svoju e-poštu za potvrdu računa.",
      errorTitle: "Greška",
    },
  };

  return translations[language];
};

// Function to generate localized routes
const getLocalizedRoutes = (language: SupportedLanguage) => {
  const prefix = language === "en" ? "" : `/${language}`;

  return {
    login: `${prefix}/login`,
    terms: `${prefix}/terms`,
    privacy: `${prefix}/privacy`,
    home: `${prefix}/`,
  };
};

export default function RegisterPage({
  language = "en",
}: {
  language: SupportedLanguage;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Get translations and routes
  const t = getTranslations(language);
  const routes = getLocalizedRoutes(language);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const { name, email, password } = values;

    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        throw new Error(error.message || "Registration failed");
      }

      if (data?.token) {
        toast({
          title: t.accountCreated,
          description: t.verifyEmail,
        });
        form.reset();
        router.push(routes.home);
        router.refresh();
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast({
        title: t.errorTitle,
        description: err instanceof Error ? err.message : "Registration failed",
        variant: "destructive",
      });

      if (err instanceof Error) {
        if (err.message.toLowerCase().includes("email")) {
          form.setError("email", {
            type: "manual",
            message: err.message,
          });
        } else if (err.message.toLowerCase().includes("password")) {
          form.setError("password", {
            type: "manual",
            message: err.message,
          });
        } else {
          form.setError("root", {
            type: "manual",
            message: err.message,
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center my-20">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.nameLabel}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t.namePlaceholder}
                        {...field}
                        disabled={isLoading}
                        autoComplete="name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.emailLabel}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t.emailPlaceholder}
                        {...field}
                        type="email"
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.passwordLabel}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t.passwordPlaceholder}
                        {...field}
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.creatingAccount}
                  </>
                ) : (
                  t.createAccount
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            {t.haveAccount}{" "}
            <Link href={routes.login} className="text-primary hover:underline">
              {t.signIn}
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            {t.termsPrefix}{" "}
            <Link href={routes.terms} className="text-primary hover:underline">
              {t.termsService}
            </Link>{" "}
            {t.and}{" "}
            <Link
              href={routes.privacy}
              className="text-primary hover:underline"
            >
              {t.privacyPolicy}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
