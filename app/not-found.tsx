import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4">
      <h1 className="text-4xl font-bold">404</h1>
      <h2 className="text-xl text-muted-foreground">Page Not Found</h2>
      <p className="text-center text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <Button asChild>
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}