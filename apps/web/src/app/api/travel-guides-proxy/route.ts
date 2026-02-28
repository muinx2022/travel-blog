import { NextRequest, NextResponse } from "next/server";
import { getTravelGuidesWithPagination } from "@/lib/strapi";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const categorySlug = searchParams.get("category") || undefined;
  const guideType = searchParams.get("guideType") || undefined;
  const keyword = searchParams.get("keyword") || undefined;
  const tagSlug = searchParams.get("tag") || undefined;

  try {
    const data = await getTravelGuidesWithPagination(
      page,
      pageSize,
      categorySlug,
      guideType,
      keyword,
      tagSlug
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch travel guides", error);
    return NextResponse.json({ error: "Failed to fetch travel guides" }, { status: 500 });
  }
}
