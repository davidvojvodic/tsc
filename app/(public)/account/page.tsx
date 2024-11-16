// app/(public)/account/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { AccountTabs } from "@/components/account/account-tabs";
import { Container } from "@/components/container";

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      image: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <Container>
      <div className="space-y-6 py-10 pb-16">
        <div className="container">
          <Heading
            title="Account"
            description="Manage your account settings and preferences."
          />
          <Separator className="my-6" />
          <AccountTabs user={user} />
        </div>
      </div>
    </Container>
  );
}
