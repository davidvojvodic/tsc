// app/(public)/account/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function AccountPage() {
  // Get preferred language from cookies or default to "en"
  const cookieStore = await cookies();
  const preferredLanguage = cookieStore.get("preferredLanguage")?.value || "en";
  
  // Redirect to the appropriate localized account page
  redirect(`/${preferredLanguage}/account`);
}