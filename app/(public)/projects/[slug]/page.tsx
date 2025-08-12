import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Get the current language from cookies
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("NEXT_LOCALE");
  const language = langCookie?.value || "en";
  
  // Await params before using
  const { slug } = await params;
  
  // Redirect to the localized path
  redirect(`/${language === "en" ? "" : language}/projects/${slug}`);
}