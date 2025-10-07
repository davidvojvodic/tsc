// app/(admin)/page.tsx
import prisma from "@/lib/prisma";
import { Heading } from "@/components/ui/heading";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  Users,
  FolderKanban,
  BookOpen,
  GraduationCap,
  BrainCircuit,
  Mail,
  ArrowRight,
} from "lucide-react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

async function getStats(teacherId?: string) {
  const [
    totalUsers,
    totalTeachers,
    totalProjects,
    publishedMaterials,
    totalQuizzes,
    unreadContacts,
    recentSubmissions,
    quizStats,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.teacher.count(),
    prisma.project.count(),
    prisma.material.count({ where: { published: true } }),
    teacherId
      ? prisma.quiz.count({ where: { teacherId } })
      : prisma.quiz.count(),
    prisma.contactSubmission.count({ where: { status: "unread" } }),
    // Get recent quiz submissions
    prisma.quizSubmission.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      where: teacherId
        ? {
            quiz: { teacherId },
          }
        : undefined,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        quiz: {
          select: {
            title: true,
          },
        },
      },
    }),
    // Get quiz statistics
    prisma.quizSubmission.groupBy({
      by: ["quizId"],
      where: teacherId
        ? {
            quiz: { teacherId },
          }
        : undefined,
      _avg: {
        score: true,
      },
      _count: {
        id: true,
      },
    }),
  ]);

  // Calculate average submission score across all quizzes
  const totalSubmissions = quizStats.reduce(
    (acc, stat) => acc + stat._count.id,
    0
  );
  const averageScore =
    quizStats.reduce(
      (acc, stat) => acc + (stat._avg.score || 0) * stat._count.id,
      0
    ) / (totalSubmissions || 1);

  return {
    totalUsers,
    totalTeachers,
    totalProjects,
    publishedMaterials,
    totalQuizzes,
    unreadContacts,
    recentSubmissions,
    quizStats: {
      totalSubmissions,
      averageScore,
    },
  };
}

async function getUserWithRole() {
  const headersObj = await headers();
  const session = await auth.api.getSession({
    headers: headersObj,
  });

  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
    },
  });

  return user;
}

export default async function AdminDashboard() {
  const user = await getUserWithRole();

  if (!user) {
    return <div>Unauthorized</div>;
  }

  // Teachers should see all quizzes, not filtered by teacherId
  const stats = await getStats();

  const cards = [];

  if (user.role === "ADMIN") {
    cards.push(
      {
        label: "Total Users",
        number: stats.totalUsers,
        icon: Users,
        color: "text-violet-500",
      },
      {
        label: "Teachers",
        number: stats.totalTeachers,
        icon: GraduationCap,
        color: "text-yellow-500",
      },
      {
        label: "Total Projects",
        number: stats.totalProjects,
        icon: FolderKanban,
        color: "text-cyan-500",
      },
      {
        label: "Published Materials",
        number: stats.publishedMaterials,
        icon: BookOpen,
        color: "text-emerald-500",
      },
      {
        label: "Unread Messages",
        number: stats.unreadContacts,
        icon: Mail,
        color: "text-orange-500",
      }
    );
  }

  // Both admin and teacher can see quizzes
  cards.push({
    label: user.role === "ADMIN" ? "All Quizzes" : "My Quizzes",
    number: stats.totalQuizzes,
    icon: BrainCircuit,
    color: "text-purple-500",
  });

  return (
    <div className="space-y-8 p-8">
      <Heading
        title={user.role === "ADMIN" ? "Admin Dashboard" : "Teacher Dashboard"}
        description={
          user.role === "ADMIN"
            ? "Overview of your site's statistics"
            : "Overview of your quiz performance and submissions"
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.label}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.number}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quiz Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Overview</CardTitle>
            <CardDescription>
              Summary of quiz performance and submissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <div className="text-sm font-medium">Average Score</div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Progress
                    value={stats.quizStats.averageScore}
                    className="h-2"
                  />
                </div>
                <div className="text-sm tabular-nums text-muted-foreground">
                  {stats.quizStats.averageScore.toFixed(1)}%
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium">Total Submissions</div>
              <div className="text-2xl font-bold">
                {stats.quizStats.totalSubmissions}
              </div>
            </div>

            <Button variant="outline" asChild className="w-full">
              <Link href="/admin/quizzes">
                {user.role === "ADMIN" ? "View All Quizzes" : "View My Quizzes"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Submissions</CardTitle>
                <CardDescription>
                  Latest quiz submissions from students
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/quizzes">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {stats.recentSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.image || undefined} />
                    <AvatarFallback>
                      {submission.user.name?.[0] || submission.user.email[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {submission.user.name || submission.user.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {submission.quiz.title}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    {submission.score.toFixed(1)}%
                  </div>
                </div>
              ))}

              {stats.recentSubmissions.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No submissions yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
