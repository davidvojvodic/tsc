"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "../forms/profile-form";
// import { SecurityForm } from "../forms/security-form";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "TEACHER" | "USER";
  emailVerified: boolean;
  image: string | null;
}

export function AccountTabs({ user }: { user: User }) {
  return (
    <Tabs defaultValue="profile" className="space-y-4">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        {/* <TabsTrigger value="security">Security</TabsTrigger> */}
      </TabsList>
      <TabsContent value="profile">
        <ProfileForm user={user} />
      </TabsContent>
      {/* <TabsContent value="security">
        <SecurityForm user={user} />
      </TabsContent> */}
    </Tabs>
  );
}
