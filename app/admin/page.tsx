// app/(admin)/page.tsx
import prisma from "@/lib/prisma";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  FileText,
  BookOpen,
  GraduationCap,
  BrainCircuit,
  Newspaper,
} from "lucide-react";

async function getStats() {
  const stats = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.post.count(),
    prisma.page.count(),
    prisma.quiz.count(),
    prisma.post.count({ where: { published: true } }),
  ]);

  return {
    totalUsers: stats[0],
    totalTeachers: stats[1],
    totalPosts: stats[2],
    totalPages: stats[3],
    totalQuizzes: stats[4],
    publishedPosts: stats[5],
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
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
      label: "Total Posts",
      number: stats.totalPosts,
      icon: FileText,
      color: "text-pink-700",
    },
    {
      label: "Published Posts",
      number: stats.publishedPosts,
      icon: Newspaper,
      color: "text-emerald-500",
    },
    {
      label: "Pages",
      number: stats.totalPages,
      icon: BookOpen,
      color: "text-orange-500",
    },
    {
      label: "Quizzes",
      number: stats.totalQuizzes,
      icon: BrainCircuit,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-8 p-8">
      <Heading
        title="Dashboard"
        description="Overview of your site's statistics"
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

      {/* You can add more sections here, like recent activity or charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
