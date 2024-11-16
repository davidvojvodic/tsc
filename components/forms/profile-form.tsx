"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, LogOut, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { UploadButton } from "@/lib/uploadthing";

const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(30, {
      message: "Name must not be longer than 30 characters.",
    }),
  email: z
    .string()
    .min(1, { message: "This field cannot be empty." })
    .email("This is not a valid email."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "TEACHER" | "USER";
  emailVerified: boolean;
  image: string | null;
}

export function ProfileForm({ user }: { user: User }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email,
    },
  });

  async function updateAvatar(url: string) {
    try {
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to update avatar");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("[UPDATE_AVATAR]", error);
      toast.error("Failed to update avatar");
    }
  }

  async function handleRemoveAvatar() {
    try {
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: null }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove avatar");
      }

      startTransition(() => {
        router.refresh();
      });

      toast.success("Avatar removed successfully");
    } catch (error) {
      console.error("[REMOVE_AVATAR]", error);
      toast.error("Failed to remove avatar");
    }
  }

  async function handleSignOut() {
    try {
      setIsSigningOut(true);
      await authClient.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    } finally {
      setIsSigningOut(false);
    }
  }

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Something went wrong");
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("[PROFILE_UPDATE]", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update your profile information.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/90 hover:text-white"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Sign Out
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback>
                {user.name?.charAt(0) || user.email.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  if (res?.[0]) {
                    updateAvatar(res[0].url);
                    toast.success("Avatar updated successfully");
                  }
                }}
                onUploadError={(error: Error) => {
                  toast.error(`Failed to upload avatar: ${error.message}`);
                }}
              />
              {user.image && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={handleRemoveAvatar}
                  disabled={isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Avatar
                </Button>
              )}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is your public display name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your email"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {user.emailVerified
                        ? "Your email is verified."
                        : "Please verify your email address."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
