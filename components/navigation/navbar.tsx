import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Container } from "../container";
import { ProfileDropdown } from "./profile-dropdown";

const navigation = [
  { name: "About Us", href: "/about" },
  { name: "Our Projects", href: "/projects" },
  { name: "Resources", href: "/resources" },
  { name: "Online Learning", href: "/learning" },
];

async function getUserWithRole() {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
    },
  });

  return user;
}

export async function Navbar() {
  const user = await getUserWithRole();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <nav className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex shrink-0 items-center">
            <Link href="/">
              <Image
                src="/waterwise.png"
                alt="WaterWise Logo"
                width={100}
                height={40}
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:gap-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-x-4">
            {user ? (
              <ProfileDropdown user={user} />
            ) : (
              <div className="hidden md:flex md:items-center md:gap-x-4">
                <Button asChild>
                  <Link href="/login">Log In</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 pt-10">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-lg font-medium text-foreground/60 transition-colors hover:text-foreground"
                    >
                      {item.name}
                    </Link>
                  ))}
                  {user ? (
                    <ProfileDropdown user={user} />
                  ) : (
                    <div className="flex flex-col gap-2 pt-4">
                      <Button variant="ghost" asChild>
                        <Link href="/login">Log In</Link>
                      </Button>
                      <Button asChild>
                        <Link href="/register">Sign Up</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </Container>
    </header>
  );
}
