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
import { signInFormSchema } from "@/lib/auth-schema";
import { toast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth-client";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { SupportedLanguage } from "@/store/language-context";

// Get translations based on the language
const getTranslations = (language: SupportedLanguage) => {
  const translations = {
    en: {
      title: "Sign In",
      description: "Welcome back! Please sign in to continue.",
      emailLabel: "Email",
      emailPlaceholder: "john@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      forgotPassword: "Forgot password?",
      signIn: "Sign in",
      signingIn: "Signing in...",
      noAccount: "Don't have an account yet?",
      signUp: "Sign up",
      termsPrefix: "By signing in, you agree to our",
      termsService: "Terms of Service",
      and: "and",
      privacyPolicy: "Privacy Policy",
      welcomeBack: "Welcome back!",
      loginSuccess: "You have successfully signed in.",
      errorTitle: "Error",
    },
    sl: {
      title: "Prijava",
      description: "Dobrodošli nazaj! Prosimo, prijavite se za nadaljevanje.",
      emailLabel: "E-pošta",
      emailPlaceholder: "janez@primer.si",
      passwordLabel: "Geslo",
      passwordPlaceholder: "Vnesite svoje geslo",
      forgotPassword: "Ste pozabili geslo?",
      signIn: "Prijava",
      signingIn: "Prijavljanje...",
      noAccount: "Še nimate računa?",
      signUp: "Registracija",
      termsPrefix: "S prijavo se strinjate z našimi",
      termsService: "Pogoji uporabe",
      and: "in",
      privacyPolicy: "Pravilnikom o zasebnosti",
      welcomeBack: "Dobrodošli nazaj!",
      loginSuccess: "Uspešno ste se prijavili.",
      errorTitle: "Napaka",
    },
    hr: {
      title: "Prijava",
      description: "Dobrodošli natrag! Molimo prijavite se za nastavak.",
      emailLabel: "E-mail",
      emailPlaceholder: "ivan@primjer.hr",
      passwordLabel: "Lozinka",
      passwordPlaceholder: "Unesite svoju lozinku",
      forgotPassword: "Zaboravili ste lozinku?",
      signIn: "Prijava",
      signingIn: "Prijavljivanje...",
      noAccount: "Još nemate račun?",
      signUp: "Registracija",
      termsPrefix: "Prijavom pristajete na naše",
      termsService: "Uvjete korištenja",
      and: "i",
      privacyPolicy: "Politiku privatnosti",
      welcomeBack: "Dobrodošli natrag!",
      loginSuccess: "Uspješno ste se prijavili.",
      errorTitle: "Greška",
    },
  };

  return translations[language];
};

// Function to generate localized routes
const getLocalizedRoutes = (language: SupportedLanguage) => {
  const prefix = language === "en" ? "" : `/${language}`;
  
  return {
    forgotPassword: `${prefix}/forgot-password`,
    register: `${prefix}/register`,
    terms: `${prefix}/terms`,
    privacy: `${prefix}/privacy`,
    home: `${prefix}/`,
  };
};

export default function LoginPage({ language = "en" }: { language: SupportedLanguage }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  
  // Get translations and routes
  const t = getTranslations(language);
  const routes = getLocalizedRoutes(language);

  const form = useForm<z.infer<typeof signInFormSchema>>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof signInFormSchema>) {
    setIsLoading(true);
    const { email, password } = values;

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message || "Login failed");
      }

      if (data?.user) {
        toast({
          title: t.welcomeBack,
          description: t.loginSuccess,
        });
        form.reset();
        router.push(routes.home);
        router.refresh();
      }
    } catch (err) {
      console.error("Login error:", err);
      toast({
        title: t.errorTitle,
        description: err instanceof Error ? err.message : "Login failed",
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>
          {t.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.emailLabel}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.emailPlaceholder}
                      type="email"
                      disabled={isLoading}
                      autoComplete="email"
                      {...field}
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
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={t.passwordPlaceholder}
                        disabled={isLoading}
                        autoComplete="current-password"
                        className="pr-10"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Link
                href={routes.forgotPassword}
                className="text-sm text-primary hover:underline"
              >
                {t.forgotPassword}
              </Link>
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.signingIn}
                </>
              ) : (
                t.signIn
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 text-center">
        <p className="text-sm text-muted-foreground">
          {t.noAccount}{" "}
          <Link href={routes.register} className="text-primary hover:underline">
            {t.signUp}
          </Link>
        </p>
        <p className="text-xs text-muted-foreground">
          {t.termsPrefix}{" "}
          <Link href={routes.terms} className="text-primary hover:underline">
            {t.termsService}
          </Link>{" "}
          {t.and}{" "}
          <Link href={routes.privacy} className="text-primary hover:underline">
            {t.privacyPolicy}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}