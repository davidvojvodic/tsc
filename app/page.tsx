import { HeroSection } from "@/components/homepage/hero";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  console.log(session);

  return (
    <>
      <HeroSection />
    </>
  );
}
