import { SchoolDetailPage } from "@/app/(localized)/_components/school-detail-page";

interface SchoolDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Page({ params }: SchoolDetailPageProps) {
  const { slug } = await params;
  return <SchoolDetailPage slug={slug} language="sl" />;
}