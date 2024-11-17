import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LayoutDashboard, User, LogOut } from "lucide-react";
import { Container } from "../container";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

function UserAvatar({
  user,
}: {
  user: { name: string | null; email: string; image: string | null };
}) {
  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={user.image || undefined} />
      <AvatarFallback>
        {user.name?.charAt(0) || user.email.charAt(0)}
      </AvatarFallback>
    </Avatar>
  );
}

function ProfileDropdown({
  user,
}: {
  user: { name: string | null; email: string; image: string | null };
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <UserAvatar user={user} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/account">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export async function Navbar() {
  const user = await getUserWithRole();
  const isAuthorized = user?.role === "ADMIN" || user?.role === "TEACHER";

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
            <div className="hidden md:flex md:items-center md:gap-x-4">
              {user ? (
                <>
                  {isAuthorized && (
                    <Button variant="outline" asChild>
                      <Link
                        href={"/admin"}
                        className="flex items-center gap-x-2"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                  )}
                  <ProfileDropdown user={user} />
                </>
              ) : (
                <>
                  <Button asChild>
                    <Link href="/login">Log In</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/register">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>

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
                  <div className="flex flex-col gap-2 pt-4">
                    {user ? (
                      <>
                        {isAuthorized && (
                          <Button variant="outline" asChild>
                            <Link
                              href={"/admin"}
                              className="flex items-center gap-x-2"
                            >
                              <LayoutDashboard className="h-4 w-4" />
                              Dashboard
                            </Link>
                          </Button>
                        )}
                        <div className="flex items-center gap-3 px-2">
                          <UserAvatar user={user} />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {user.name || "User"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" asChild>
                          <Link href="/account">Profile Settings</Link>
                        </Button>
                        <Button variant="ghost">Log out</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" asChild>
                          <Link href="/login">Log In</Link>
                        </Button>
                        <Button asChild>
                          <Link href="/register">Sign Up</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </Container>
    </header>
  );
}
