import { User } from "@prisma/client";
import prisma from "@/lib/prisma";

export function isAdmin(user: User): boolean {
  return user.role === "ADMIN";
}

export function isTeacher(user: User): boolean {
  return user.role === "TEACHER";
}

export function isAdminOrTeacher(user: User): boolean {
  return user.role === "ADMIN" || user.role === "TEACHER";
}

export async function getTeacherFromUser(user: User) {
  if (!user.email && !user.name) return null;
  
  const whereConditions = [];
  if (user.email) {
    whereConditions.push({ email: user.email });
  }
  if (user.name) {
    whereConditions.push({ name: user.name });
  }
  
  if (whereConditions.length === 0) return null;
  
  const teacher = await prisma.teacher.findFirst({
    where: {
      OR: whereConditions
    }
  });
  
  return teacher;
}

export async function getTeacherProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (!user || user.role !== "TEACHER") return null;
  
  return await getTeacherFromUser(user);
}

export function canAccessQuizzes(user: User): boolean {
  return isAdminOrTeacher(user);
}

export function canAccessAllAdminFeatures(user: User): boolean {
  return isAdmin(user);
}

export async function getUserQuizAccess(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true }
  });
  
  if (!user) return null;
  
  if (user.role === "ADMIN") {
    return {
      canViewAll: true,
      teacherProfile: null,
      user
    };
  }
  
  if (user.role === "TEACHER") {
    const teacherProfile = await getTeacherFromUser(user as User);
    return {
      canViewAll: false,
      teacherProfile,
      user
    };
  }
  
  return null;
}