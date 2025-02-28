import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SupportedLanguage } from "@/store/language-context";

export default function RegisterRedirect() {
  // Get the language from cookie or default to English
  const cookieStore = cookies();
  const langCookie = cookieStore.get("NEXT_LOCALE");
  const language = (langCookie?.value || "en") as SupportedLanguage;
  
  // Redirect to the localized register page
  const prefix = language === "en" ? "" : `/${language}`;
  const registerPath = `${prefix}/register`;
  
  redirect(registerPath);
}