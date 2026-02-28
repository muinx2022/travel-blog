"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildCategoryTreeOptions,
  fetchMyServiceCategories,
} from "../lib/categories";
import type { CategoryItem } from "../types";

export function useCategoryTree(enabled = true) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const rows = await fetchMyServiceCategories();
        if (active) {
          setCategories(rows);
        }
      } finally {
        if (active) {
          setLoadingCategories(false);
        }
      }
    };

    void loadCategories();

    return () => {
      active = false;
    };
  }, [enabled]);

  const categoryTreeOptions = useMemo(
    () => buildCategoryTreeOptions(categories),
    [categories],
  );

  return {
    categories,
    categoryTreeOptions,
    loadingCategories,
  };
}

