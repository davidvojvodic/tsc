import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default function QuizzesPage() {
  // Get the current language from cookies
  const cookieStore = cookies();
  const langCookie = cookieStore.get("NEXT_LOCALE");
  const language = langCookie?.value || "en";
  
  // Redirect to the localized path
  redirect(`/${language === "en" ? "" : language}/quizzes`);
}