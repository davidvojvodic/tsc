"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, LogOut, Trash2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { UploadButton } from "@/lib/uploadthing";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Container } from "@/components/container";
import { SupportedLanguage } from "@/store/language-context";

// User interface
interface User {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "TEACHER" | "USER";
  emailVerified: boolean;
  image: string | null;
}

// Get translations based on the language
const getTranslations = (language: SupportedLanguage) => {
  const translations = {
    en: {
      title: "Account",
      description: "Manage your account settings and preferences.",
      profileTab: "Profile",
      securityTab: "Security",
      profileTitle: "Profile",
      profileDescription: "Update your profile information.",
      nameLabel: "Name",
      namePlaceholder: "Enter your name",
      nameDescription: "This is your public display name.",
      emailLabel: "Email",
      emailPlaceholder: "Enter your email",
      emailVerified: "Your email is verified.",
      emailNotVerified: "Please verify your email address.",
      saveChanges: "Save Changes",
      saving: "Saving...",
      signOut: "Sign Out",
      signingOut: "Signing out...",
      removeAvatar: "Remove Avatar",
      successProfileUpdate: "Profile updated successfully",
      errorProfileUpdate: "Something went wrong",
      successAvatarUpdate: "Avatar updated successfully",
      errorAvatarUpdate: "Failed to upload avatar",
      successAvatarRemove: "Avatar removed successfully",
      errorAvatarRemove: "Failed to remove avatar",
      errorSignOut: "Failed to sign out"
    },
    sl: {
      title: "Račun",
      description: "Upravljajte z nastavitvami in preferencami računa.",
      profileTab: "Profil",
      securityTab: "Varnost",
      profileTitle: "Profil",
      profileDescription: "Posodobite informacije svojega profila.",
      nameLabel: "Ime",
      namePlaceholder: "Vnesite svoje ime",
      nameDescription: "To je vaše javno prikazano ime.",
      emailLabel: "E-pošta",
      emailPlaceholder: "Vnesite svoj e-poštni naslov",
      emailVerified: "Vaš e-poštni naslov je potrjen.",
      emailNotVerified: "Prosimo, potrdite svoj e-poštni naslov.",
      saveChanges: "Shrani spremembe",
      saving: "Shranjevanje...",
      signOut: "Odjava",
      signingOut: "Odjavljanje...",
      removeAvatar: "Odstrani sliko",
      successProfileUpdate: "Profil uspešno posodobljen",
      errorProfileUpdate: "Nekaj je šlo narobe",
      successAvatarUpdate: "Slika uspešno posodobljena",
      errorAvatarUpdate: "Napaka pri nalaganju slike",
      successAvatarRemove: "Slika uspešno odstranjena",
      errorAvatarRemove: "Napaka pri odstranjevanju slike",
      errorSignOut: "Napaka pri odjavi"
    },
    hr: {
      title: "Račun",
      description: "Upravljajte postavkama i preferencijama računa.",
      profileTab: "Profil",
      securityTab: "Sigurnost",
      profileTitle: "Profil",
      profileDescription: "Ažurirajte podatke profila.",
      nameLabel: "Ime",
      namePlaceholder: "Unesite svoje ime",
      nameDescription: "Ovo je vaše javno prikazano ime.",
      emailLabel: "E-mail",
      emailPlaceholder: "Unesite svoju e-mail adresu",
      emailVerified: "Vaša e-mail adresa je potvrđena.",
      emailNotVerified: "Molimo potvrdite svoju e-mail adresu.",
      saveChanges: "Spremi promjene",
      saving: "Spremanje...",
      signOut: "Odjava",
      signingOut: "Odjavljivanje...",
      removeAvatar: "Ukloni sliku",
      successProfileUpdate: "Profil uspješno ažuriran",
      errorProfileUpdate: "Nešto je pošlo po zlu",
      successAvatarUpdate: "Slika uspješno ažurirana",
      errorAvatarUpdate: "Pogreška pri učitavanju slike",
      successAvatarRemove: "Slika uspješno uklonjena", 
      errorAvatarRemove: "Pogreška pri uklanjanju slike",
      errorSignOut: "Pogreška pri odjavi"
    },
  };

  return translations[language];
};

// Profile form schema
const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(30, {
      message: "Name must not be longer than 30 characters.",
    }),
  email: z
    .string()
    .min(1, { message: "This field cannot be empty." })
    .email("This is not a valid email."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function AccountPage({ user, language = "en" }: { user: User; language: SupportedLanguage }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  
  // Get translations
  const t = getTranslations(language);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email,
    },
  });

  async function updateAvatar(url: string) {
    try {
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to update avatar");
      }

      startTransition(() => {
        router.refresh();
      });
      
      toast.success(t.successAvatarUpdate);
    } catch (error) {
      console.error("[UPDATE_AVATAR]", error);
      toast.error(t.errorAvatarUpdate);
    }
  }

  async function handleRemoveAvatar() {
    try {
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: null }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove avatar");
      }

      startTransition(() => {
        router.refresh();
      });

      toast.success(t.successAvatarRemove);
    } catch (error) {
      console.error("[REMOVE_AVATAR]", error);
      toast.error(t.errorAvatarRemove);
    }
  }

  async function handleSignOut() {
    try {
      setIsSigningOut(true);
      await authClient.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error(t.errorSignOut);
    } finally {
      setIsSigningOut(false);
    }
  }

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Something went wrong");
      }

      toast.success(t.successProfileUpdate);
    } catch (error) {
      console.error("[PROFILE_UPDATE]", error);
      toast.error(t.errorProfileUpdate);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Container>
      <div className="space-y-6 py-10 pb-16">
        <div className="container">
          <Heading
            title={t.title}
            description={t.description}
          />
          <Separator className="my-6" />
          
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">{t.profileTab}</TabsTrigger>
              {/* <TabsTrigger value="security">{t.securityTab}</TabsTrigger> */}
            </TabsList>
            <TabsContent value="profile">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{t.profileTitle}</CardTitle>
                        <CardDescription>
                          {t.profileDescription}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        className="text-destructive hover:bg-destructive/90 hover:text-white"
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                      >
                        {isSigningOut ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="mr-2 h-4 w-4" />
                        )}
                        {t.signOut}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback>
                          {user.name?.charAt(0) || user.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-2">
                        <UploadButton
                          endpoint="imageUploader"
                          onClientUploadComplete={(res) => {
                            if (res?.[0]) {
                              updateAvatar(res[0].url);
                            }
                          }}
                          onUploadError={(error: Error) => {
                            toast.error(`${t.errorAvatarUpdate}: ${error.message}`);
                          }}
                        />
                        {user.image && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={handleRemoveAvatar}
                            disabled={isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t.removeAvatar}
                          </Button>
                        )}
                      </div>
                    </div>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.nameLabel}</FormLabel>
                              <FormControl>
                                <Input placeholder={t.namePlaceholder} {...field} />
                              </FormControl>
                              <FormDescription>
                                {t.nameDescription}
                              </FormDescription>
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
                                  type="email"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                {user.emailVerified
                                  ? t.emailVerified
                                  : t.emailNotVerified}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end">
                          <Button type="submit" disabled={isLoading}>
                            {isLoading && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {isLoading ? t.saving : t.saveChanges}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            {/* <TabsContent value="security">
              <SecurityForm user={user} />
            </TabsContent> */}
          </Tabs>
        </div>
      </div>
    </Container>
  );
}