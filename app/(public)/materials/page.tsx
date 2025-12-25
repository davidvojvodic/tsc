// app/(public)/materials/page.tsx
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { Container } from "@/components/container";
import { MaterialsFilter } from "./components/materials-filter";
import MaterialsGridSkeleton, {
  MaterialsGrid,
} from "./components/materials-grid";
import { Prisma } from "@prisma/client";
import { SupportedLanguage } from "@/store/language-context";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

async function getMaterials(
  query?: string,
  category?: string,
  materialLang?: string,
  language: string = "en"
) {
  try {
    const where: Prisma.MaterialWhereInput = {
      published: true,
      // Filter by specific material language if selected
      ...(materialLang
        ? { language: materialLang }
        : {
            // Otherwise include the current UI language and English as fallback
            OR: [
              { language: language },
              { language: "en" } // Always include English materials as fallback
            ],
          }),
      ...(query && {
        OR: [
          // Use language-specific fields for search
          {
            ...(language === "sl"
              ? {
                  title_sl: {
                    contains: query,
                  },
                }
              : language === "hr"
                ? {
                    title_hr: {
                      contains: query,
                    },
                  }
                : {
                    title: {
                      contains: query,
                    },
                  }),
          },
          {
            ...(language === "sl"
              ? {
                  description_sl: {
                    contains: query,
                  },
                }
              : language === "hr"
                ? {
                    description_hr: {
                      contains: query,
                    },
                  }
                : {
                    description: {
                      contains: query,
                    },
                  }),
          },
        ],
      }),
      ...(category && {
        category: {
          equals: category,
        },
      }),
    };

    const [materials, categoriesResult] = await Promise.all([
      prisma.material.findMany({
        where,
        select: {
          id: true,
          title: true,
          title_sl: true,
          title_hr: true,
          description: true,
          description_sl: true,
          description_hr: true,
          type: true,
          size: true,
          downloads: true,
          category: true,
          category_sl: true,
          category_hr: true,
          filename: true,
          language: true,
          url: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.material.groupBy({
        by: ["category"],
        where: {
          published: true,
          category: { not: null },
        },
      }),
    ]);

    const categories = categoriesResult
      .map((c) => c.category)
      .filter((category): category is string => Boolean(category));

    return {
      materials,
      categories,
    };
  } catch (error) {
    console.error("[GET_MATERIALS]", error);
    throw new Error("Failed to fetch materials");
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
  const materialLang = searchParams.materialLang?.toString();
  const language = (searchParams.lang?.toString() || "en") as SupportedLanguage;

  const { materials, categories } = await getMaterials(
    query,
    category,
    materialLang,
    language
  );
  return (
    <div className="py-16 md:py-24">
      <Container>
        <div className="mb-16 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {language === "sl" 
              ? "Učni materiali"
              : language === "hr"
                ? "Nastavni materijali"
                : "Learning Resources"}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {language === "sl"
              ? "Dostopajte do naše zbirke izobraževalnih virov in dokumentov za podporo vaši učni poti."
              : language === "hr"
                ? "Pristupite našoj zbirci obrazovnih resursa i dokumenata za podršku vašem obrazovnom putovanju."
                : "Access our collection of educational resources and documents to support your learning journey."}
          </p>
        </div>

        <MaterialsFilter categories={categories} language={language} />
        <Suspense fallback={<MaterialsGridSkeleton />}>
          <MaterialsGrid materials={materials} language={language} />
        </Suspense>
      </Container>
    </div>
  );
}