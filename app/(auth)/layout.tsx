import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TŠC",
  description: "description",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="antialiased min-h-screen flex flex-col">
      <main className="flex-1 items-center justify-center flex">
        {children}
      </main>
    </div>
  );
}
