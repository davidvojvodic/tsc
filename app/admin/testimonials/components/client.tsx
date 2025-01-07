// app/admin/testimonials/components/client.tsx
"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { columns, TestimonialColumn } from "./columns";

interface TestimonialClientProps {
  data: TestimonialColumn[];
}

export const TestimonialClient: React.FC<TestimonialClientProps> = ({ data }) => {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Testimonials (${data.length})`}
          description="Manage testimonials from your students and parents"
        />
        <Button onClick={() => router.push(`/admin/testimonials/new`)}>
          <Plus className="mr-2 h-4 w-4" /> Add Testimonial
        </Button>
      </div>
      <Separator />
      <DataTable searchKey="name" columns={columns} data={data} />
    </>
  );
};