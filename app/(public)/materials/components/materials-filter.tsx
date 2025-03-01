// components/materials/materials-filter.tsx
"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import debounce from "lodash/debounce";
import { SupportedLanguage } from "@/store/language-context";

interface MaterialsFilterProps {
  categories: string[];
  language: SupportedLanguage;
}

export function MaterialsFilter({
  categories,
  language,
}: MaterialsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("query") || "");

  // Debounced search function
  const debouncedSearch = useCallback((value: string) => {
    const debouncedFn = debounce((searchValue: string) => {
      const params = new URLSearchParams(searchParams);
      if (searchValue) {
        params.set("query", searchValue);
      } else {
        params.delete("query");
      }

      router.push(`/${language}/materials?${params.toString()}`);
    }, 300);
    
    debouncedFn(value);
  }, [searchParams, router, language]);

  const handleSearch = (value: string) => {
    setSearch(value);
    debouncedSearch(value);
  };

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("category");
    } else {
      params.set("category", value);
    }

    router.push(`/${language}/materials?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch("");
    router.push(`/${language}/materials`);
  };

  const hasFilters = search || searchParams.get("category");

  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 gap-4">
        <div className="max-w-sm flex-1">
          <Input
            placeholder={
              language === "sl"
                ? "Išči po materialih..."
                : language === "hr"
                  ? "Pretraži materijale..."
                  : "Search materials..."
            }
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Select
          defaultValue={searchParams.get("category") || "all"}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue
              placeholder={
                language === "sl"
                  ? "Kategorija"
                  : language === "hr"
                    ? "Kategorija"
                    : "Category"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {language === "sl"
                ? "Vse kategorije"
                : language === "hr"
                  ? "Sve kategorije"
                  : "All Categories"}
            </SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hasFilters && (
        <Button
          variant="ghost"
          className="w-full sm:w-auto"
          onClick={clearFilters}
        >
          <X className="mr-2 h-4 w-4" />
          {language === "sl"
            ? "Počisti filtre"
            : language === "hr"
              ? "Očisti filtre"
              : "Clear filters"}
        </Button>
      )}
    </div>
  );
}