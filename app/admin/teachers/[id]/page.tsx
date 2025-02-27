import prisma from "@/lib/prisma";
import { TeacherForm } from "@/components/forms/teacher-form";

export default async function TeacherPage({
  params,
}: {
  params: { id: string };
}) {
  const teacher =
    params.id !== "new"
      ? await prisma.teacher.findUnique({
          where: { id: params.id },
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
        title_sl: teacher.title_sl, // Add this
        title_hr: teacher.title_hr, // Add this
        bio: teacher.bio,
        bio_sl: teacher.bio_sl, // Add this
        bio_hr: teacher.bio_hr, // Add this
        email: teacher.email,
        displayOrder: teacher.displayOrder,
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
