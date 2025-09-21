"use client";

import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { columns, ContactColumn } from "./columns";

interface ContactClientProps {
  data: ContactColumn[];
}

export const ContactClient: React.FC<ContactClientProps> = ({ data }) => {
  const unreadCount = data.filter(item => item.status === "unread").length;

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Contact Submissions (${data.length})`}
          description={`Manage contact form submissions. ${unreadCount} unread messages.`}
        />
      </div>
      <Separator />
      <DataTable searchKey="email" columns={columns} data={data} />
    </>
  );
};