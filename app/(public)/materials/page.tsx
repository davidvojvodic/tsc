// app/(public)/materials/page.tsx
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { Container } from "@/components/container";
import { MaterialsFilter } from "./components/materials-filter";
import MaterialsGridSkeleton, { MaterialsGrid } from "./components/materials-grid";
import {  Prisma } from "@prisma/client";

export const dynamic = 'force-dynamic';
export const revalidate = 3600;



async function getMaterials(query?: string, category?: string) {
  try {
    const where: Prisma.MaterialWhereInput = {
      published: true,
      ...(query && {
        OR: [
          {
            title: {
              contains: query,
              mode: Prisma.QueryMode.insensitive,
            } as Prisma.StringFilter<"Material">
          },
          {
            description: {
              contains: query,
              mode: Prisma.QueryMode.insensitive,
            } as Prisma.StringFilter<"Material">
          }
        ]
      }),
      ...(category && {
        category: {
          equals: category,
          mode: Prisma.QueryMode.insensitive,
        } as Prisma.StringFilter<"Material">
      }),
    };

    const [materials, categoriesResult] = await Promise.all([
      prisma.material.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          size: true,
          downloads: true,
          category: true,
          filename: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.material.groupBy({
        by: ['category'],
        where: {
          published: true,
          category: { not: null },
        },
      })
    ]);

    const categories = categoriesResult
      .map(c => c.category)
      .filter((category): category is string => Boolean(category));

    return {
      materials,
      categories,
    };
  } catch (error) {
    console.error('[GET_MATERIALS]', error);
    throw new Error('Failed to fetch materials');
  }
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
type Params = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function MaterialsPage(props: {
  params: Params;
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.query?.toString();
  const category = searchParams.category?.toString();

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