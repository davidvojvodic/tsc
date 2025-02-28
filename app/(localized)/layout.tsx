// app/(localized)/layout.tsx
import type { Metadata } from "next";
import { Navbar } from "@/components/navigation/navbar";
import Footer from "@/components/navigation/footer";

export const metadata: Metadata = {
  title: "Your App Title",
  description: "Your app description",
};

export default function LocalizedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="antialiased min-h-screen flex flex-col">
      <Navbar />
      <main className="my-auto">{children}</main>
      <Footer />
    </div>
  );
}
