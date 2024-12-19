import { Suspense } from "react";
import prisma from "@/lib/prisma";

import { Container } from "@/components/container";
import { MaterialsFilter } from "./components/materials-filter";
import MaterialsGridSkeleton, {
  MaterialsGrid,
} from "./components/materials-grid";
import { Prisma } from "@prisma/client";

export const revalidate = 3600; // Revalidate every hour

async function getMaterials(query?: string, category?: string) {
  const where: Prisma.MaterialWhereInput = {
    published: true,
    ...(query && {
      OR: [
        {
          title: {
            contains: query,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
        {
          description: {
            contains: query,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
      ],
    }),
    ...(category && {
      category: {
        equals: category,
        mode: "insensitive" as Prisma.QueryMode,
      },
    }),
  };

  const materials = await prisma.material.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });

  const categories = await prisma.material.groupBy({
    by: ["category"],
    where: {
      published: true,
      category: { not: null },
    },
  });

  return {
    materials,
    categories: categories.map((c) => c.category).filter(Boolean) as string[],
  };
}

interface PageProps {
  params: { slug?: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function MaterialsPage({
  searchParams,
}: PageProps) {
  // Convert searchParams to the expected types
  const query = typeof searchParams.query === 'string' ? searchParams.query : undefined;
  const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;

  const { materials, categories } = await getMaterials(query, category);

  return (
    <div className="py-16 md:py-24">
      <Container>
        <div className="mb-16 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Learning Resources
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Access our collection of educational resources and documents to
            support your learning journey.
          </p>
        </div>

        <MaterialsFilter categories={categories} />

        <Suspense fallback={<MaterialsGridSkeleton />}>
          <MaterialsGrid materials={materials} />
        </Suspense>
      </Container>
    </div>
  );
}