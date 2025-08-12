import prisma from "@/lib/prisma";
import { TeacherForm } from "@/components/forms/teacher-form";

export default async function TeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params before using
  const { id } = await params;

  const teacher =
    id !== "new"
      ? await prisma.teacher.findUnique({
          where: { id },
          include: {
            photo: true,
          },
        })
      : null;

  const formattedTeacher = teacher
    ? {
        id: teacher.id,
        name: teacher.name,
        title: teacher.title,
        title_sl: teacher.title_sl,
        title_hr: teacher.title_hr,
        bio: teacher.bio,
        bio_sl: teacher.bio_sl,
        bio_hr: teacher.bio_hr,
        email: teacher.email,
        displayOrder: teacher.displayOrder,
        school: teacher.school,
        photoId: teacher.photoId,
        photo: teacher.photo ? { url: teacher.photo.url } : null,
        createdAt: teacher.createdAt.toISOString(),
      }
    : undefined;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <TeacherForm initialData={formattedTeacher} />
      </div>
    </div>
  );
}
