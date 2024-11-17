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
        bio: teacher.bio,
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
