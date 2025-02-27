import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { TeacherClient } from "./components/client";

export default async function TeachersPage() {
  const teachers = await prisma.teacher.findMany({
    include: {
      photo: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedTeachers = teachers.map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
    title: teacher.title,
    title_sl: teacher.title_sl,
    title_hr: teacher.title_hr,
    bio: teacher.bio,
    bio_sl: teacher.bio_sl,
    bio_hr: teacher.bio_hr,
    photoId: teacher.photoId,
    photo: teacher.photo ? { url: teacher.photo.url } : null,
    // Format the date when we prepare the data
    createdAt: format(teacher.createdAt, "PPP"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <TeacherClient data={formattedTeachers} />
      </div>
    </div>
  );
}
