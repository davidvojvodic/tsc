import { SchoolDetailPage } from "@/app/(localized)/_components/school-detail-page";

interface SchoolDetailPageProps {
  params: {
    slug: string;
  };
}

export default function Page({ params: { slug } }: SchoolDetailPageProps) {
  return <SchoolDetailPage slug={slug} language="sl" />;
}