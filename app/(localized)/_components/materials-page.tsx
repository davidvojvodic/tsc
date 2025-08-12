// app/(localized)/_components/materials-page.tsx
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { Container } from "@/components/container";
import { Prisma } from "@prisma/client";
import { SupportedLanguage } from "@/store/language-context";
import MaterialsGridSkeleton, {
  MaterialsGrid,
} from "@/app/(public)/materials/components/materials-grid";

// Client components need to be imported separately
import { LocalizedMaterialsFilter } from "./materials-filter";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

async function getMaterials(
  query?: string,
  category?: string,
  materialLang?: string,
  language: SupportedLanguage = "en"
) {
  try {
    const where: Prisma.MaterialWhereInput = {
      published: true,
      // Filter by specific material language if selected in URL params
      ...(materialLang
        ? { language: materialLang }
        : {
            // Otherwise show only resources matching the current page language
            language: language,
          }),
      ...(query && {
        OR: [
          {
            // Use the appropriate language field for title search
            ...(language === "sl"
              ? { title_sl: { contains: query } }
              : language === "hr"
                ? { title_hr: { contains: query } }
                : { title: { contains: query } }),
          },
          {
            // Use the appropriate language field for description search
            ...(language === "sl"
              ? { description_sl: { contains: query } }
              : language === "hr"
                ? { description_hr: { contains: query } }
                : { description: { contains: query } }),
          },
        ],
      }),
      ...(category && {
        ...(language === "sl"
          ? {
              category_sl: {
                equals: category,
              },
            }
          : language === "hr"
          ? {
              category_hr: {
                equals: category,
              },
            }
          : {
              category: {
                equals: category,
              },
            }),
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
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.material.groupBy({
        by: language === "sl" ? ["category_sl"] : language === "hr" ? ["category_hr"] : ["category"],
        where: {
          published: true,
          language: language,
          ...(language === "sl" 
            ? { category_sl: { not: null } }
            : language === "hr"
            ? { category_hr: { not: null } }
            : { category: { not: null } }
          ),
        },
      }),
    ]);

    const categories = categoriesResult
      .map((c) => {
        if (language === "sl") return (c as { category_sl: string | null }).category_sl;
        if (language === "hr") return (c as { category_hr: string | null }).category_hr;
        return (c as { category: string | null }).category;
      })
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

type SearchParams = { [key: string]: string | string[] | undefined };
type Params = { [key: string]: string | string[] | undefined };

export default async function MaterialsPage(props: {
  params: Params;
  searchParams: SearchParams;
  language: SupportedLanguage;
}) {
  const { searchParams, language } = props;
  const query =
    typeof searchParams.query === "string" ? searchParams.query : undefined;
  const category =
    typeof searchParams.category === "string"
      ? searchParams.category
      : undefined;
  const materialLang =
    typeof searchParams.materialLang === "string"
      ? searchParams.materialLang
      : undefined;

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
              ? "Učno gradivo"
              : language === "hr"
                ? "Nastavni materijali"
                : "Learning Resources"}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {language === "sl"
              ? "Dostop do naše zbirke izobraževalnih virov in dokumentov za podporo pri učenju."
              : language === "hr"
                ? "Pristupite našoj zbirci obrazovnih resursa i dokumenata kao podrška vašem putovanju učenja."
                : "Access our collection of educational resources and documents to support your learning journey."}
          </p>
        </div>

        <LocalizedMaterialsFilter categories={categories} language={language} />

        <Suspense fallback={<MaterialsGridSkeleton />}>
          <MaterialsGrid materials={materials} language={language} />
        </Suspense>
      </Container>
    </div>
  );
}