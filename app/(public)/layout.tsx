import type { Metadata } from "next";
import { Navbar } from "@/components/navigation/navbar";
import Footer from "@/components/navigation/footer";

export const metadata: Metadata = {
  title: "TŠC",
  description: "description",
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="antialiased min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
